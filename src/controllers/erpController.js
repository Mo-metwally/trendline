const { Op } = require('sequelize');
const {
  sequelize,
  InventoryTransaction,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  Product,
  FinancialTransaction,
  AdminUser,
} = require('../models');
const OrderLifecycleService = require('../services/orderLifecycleService');

class ErpController {
  // =================== INVENTORY & WMS ===================

  /**
   * Get Inventory Transactions Ledger (Audit Log)
   * GET /api/v1/erp/inventory/ledger
   */
  static async getInventoryLedger(req, res, next) {
    try {
      const { product_id, transaction_type, page = 1, limit = 50 } = req.query;
      const whereClause = {};

      if (product_id) whereClause.product_id = product_id;
      if (transaction_type) whereClause.transaction_type = transaction_type;

      const offset = (Number(page) - 1) * Number(limit);
      const { count, rows } = await InventoryTransaction.findAndCountAll({
        where: whereClause,
        include: [
          { model: Product, as: 'product', attributes: ['id', 'name_ar', 'name_en', 'sku'] },
          { model: AdminUser, as: 'performed_by_admin', attributes: ['id', 'full_name', 'email'] },
        ],
        order: [['created_at', 'DESC']],
        limit: Number(limit),
        offset,
      });

      return res.status(200).json({
        success: true,
        count,
        total_pages: Math.ceil(count / limit),
        data: rows,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manual Stock Adjustment (WMS)
   * POST /api/v1/erp/inventory/adjust
   */
  static async adjustStock(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { product_id, quantity_change, target_bucket = 'on_hand', notes } = req.body;

      if (!product_id || quantity_change === undefined || !notes) {
        return res.status(400).json({
          success: false,
          message: 'Product ID, quantity_change (positive/negative), and audit notes are required',
        });
      }

      const product = await Product.findByPk(product_id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      const change = Number(quantity_change);
      const beforeStock = product.stock_quantity;

      if (target_bucket === 'on_hand') {
        const afterStock = beforeStock + change;
        if (afterStock < 0) {
          return res.status(400).json({ success: false, message: 'Adjustment would result in negative stock' });
        }
        await product.update({ stock_quantity: afterStock }, { transaction: t });

        await InventoryTransaction.create({
          product_id: product.id,
          transaction_type: 'MANUAL_ADJUSTMENT',
          quantity_change: change,
          stock_before: beforeStock,
          stock_after: afterStock,
          reference_type: 'manual',
          notes: notes.trim(),
          performed_by: req.user.id,
        }, { transaction: t });
      } else if (target_bucket === 'damaged') {
        await product.increment('damaged_stock', { by: change, transaction: t });
      }

      await t.commit();
      return res.status(200).json({
        success: true,
        message: 'Stock adjusted successfully and logged in ledger',
        data: {
          product_id: product.id,
          sku: product.sku,
          stock_quantity: product.stock_quantity,
          damaged_stock: product.damaged_stock,
        },
      });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }

  // =================== SUPPLIERS & PURCHASE ORDERS ===================

  static async getSuppliers(req, res, next) {
    try {
      const suppliers = await Supplier.findAll({ order: [['company_name', 'ASC']] });
      return res.status(200).json({ success: true, count: suppliers.length, data: suppliers });
    } catch (error) {
      next(error);
    }
  }

  static async createSupplier(req, res, next) {
    try {
      const supplier = await Supplier.create(req.body);
      return res.status(201).json({ success: true, data: supplier });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create Purchase Order (PO)
   * POST /api/v1/erp/purchase-orders
   */
  static async createPurchaseOrder(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { supplier_id, notes, items = [] } = req.body;

      if (!supplier_id || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Supplier and items are required' });
      }

      const poNumber = `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
      let totalCost = 0;

      for (const it of items) {
        totalCost += Number(it.unit_cost) * Number(it.quantity_ordered);
      }

      const po = await PurchaseOrder.create({
        po_number: poNumber,
        supplier_id,
        status: 'draft',
        total_cost: totalCost,
        notes,
        created_by: req.user.id,
      }, { transaction: t });

      for (const it of items) {
        await PurchaseOrderItem.create({
          po_id: po.id,
          product_id: it.product_id,
          quantity_ordered: it.quantity_ordered,
          quantity_received: 0,
          unit_cost: it.unit_cost,
          total_cost: Number(it.unit_cost) * Number(it.quantity_ordered),
        }, { transaction: t });
      }

      await t.commit();
      return res.status(201).json({ success: true, message: 'Purchase Order created', data: po });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }

  /**
   * Receive Purchase Order (Restock & Update Weighted Average Cost)
   * POST /api/v1/erp/purchase-orders/:id/receive
   */
  static async receivePurchaseOrder(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { received_items = [] } = req.body; // [{ item_id, quantity_received }]

      const po = await PurchaseOrder.findByPk(id, {
        include: [{ model: PurchaseOrderItem, as: 'items' }],
        transaction: t,
      });

      if (!po) return res.status(404).json({ success: false, message: 'Purchase Order not found' });
      if (po.status === 'received') {
        return res.status(400).json({ success: false, message: 'PO already received' });
      }

      for (const it of po.items) {
        const receivedData = received_items.find((r) => r.item_id === it.id);
        const qtyReceived = receivedData ? Number(receivedData.quantity_received) : it.quantity_ordered;

        const product = await Product.findByPk(it.product_id, { transaction: t, lock: t.LOCK.UPDATE });
        const oldQty = product.stock_quantity;
        const oldCost = Number(product.cost_price);
        const newCostUnit = Number(it.unit_cost);

        // Weighted Average Cost (COGS) formula:
        // ((oldQty * oldCost) + (qtyReceived * newCostUnit)) / (oldQty + qtyReceived)
        let updatedCost = newCostUnit;
        if (oldQty + qtyReceived > 0) {
          updatedCost = ((oldQty * oldCost) + (qtyReceived * newCostUnit)) / (oldQty + qtyReceived);
        }

        const newStock = oldQty + qtyReceived;
        await product.update({
          stock_quantity: newStock,
          cost_price: updatedCost.toFixed(2),
        }, { transaction: t });

        await it.update({ quantity_received: qtyReceived }, { transaction: t });

        // Log PO_RECEIVE in immutable ledger
        await InventoryTransaction.create({
          product_id: product.id,
          transaction_type: 'PO_RECEIVE',
          quantity_change: qtyReceived,
          stock_before: oldQty,
          stock_after: newStock,
          reference_type: 'purchase_order',
          reference_id: po.id,
          performed_by: req.user.id,
          notes: `Received via PO #${po.po_number}`,
        }, { transaction: t });
      }

      await po.update({
        status: 'received',
        received_at: new Date(),
      }, { transaction: t });

      // Update supplier balance due
      const supplier = await Supplier.findByPk(po.supplier_id, { transaction: t });
      if (supplier) {
        await supplier.increment('balance_due', { by: po.total_cost, transaction: t });
      }

      await t.commit();
      return res.status(200).json({
        success: true,
        message: 'PO received, stock updated, and weighted average cost adjusted',
        data: po,
      });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }

  // =================== RMA & QC INSPECTION ===================

  static async inspectRMA(req, res, next) {
    try {
      const { id } = req.params;
      const { items, inspection_notes: _inspection_notes } = req.body; // items: [{ return_item_id, restock_action: 'restock_available'|'move_to_damaged', item_condition }]

      const rma = await OrderLifecycleService.processReturnInspection(id, items, req.user);
      return res.status(200).json({
        success: true,
        message: 'RMA QC Inspection processed successfully',
        data: rma,
      });
    } catch (error) {
      next(error);
    }
  }

  // =================== FINANCIAL LEDGER & COGS ===================

  /**
   * Get Accounting Ledger & Financial Overview
   * GET /api/v1/erp/financials
   */
  static async getFinancialOverview(req, res, next) {
    try {
      const { start_date, end_date } = req.query;
      const whereClause = {};

      if (start_date || end_date) {
        whereClause.created_at = {};
        if (start_date) whereClause.created_at[Op.gte] = new Date(start_date);
        if (end_date) whereClause.created_at[Op.lte] = new Date(end_date);
      }

      const transactions = await FinancialTransaction.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit: 100,
      });

      // Sum inflows & outflows
      const totals = await FinancialTransaction.findAll({
        where: whereClause,
        attributes: [
          'direction',
          [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
        ],
        group: ['direction'],
      });

      let totalInflow = 0;
      let totalOutflow = 0;

      for (const t of totals) {
        if (t.direction === 'INFLOW') totalInflow = Number(t.getDataValue('total_amount')) || 0;
        if (t.direction === 'OUTFLOW') totalOutflow = Number(t.getDataValue('total_amount')) || 0;
      }

      const netCashflow = totalInflow - totalOutflow;

      return res.status(200).json({
        success: true,
        summary: {
          total_inflow: totalInflow,
          total_outflow: totalOutflow,
          net_cashflow: netCashflow,
        },
        transactions,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ErpController;
