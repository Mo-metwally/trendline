const { sequelize, Order, OrderItem, OrderTrackingLog, Product, Bundle, BundleItem, InventoryTransaction, FinancialTransaction, OrderReturn, OrderReturnItem } = require('../models');

/**
 * End-to-End ERP Order Lifecycle & Inventory State Machine
 * Executes all state transitions inside ACID database transactions with immutable audit logs.
 */
class OrderLifecycleService {
  /**
   * Status transitions dictionary with bilingual titles and descriptions
   */
  static STATUS_DEFINITIONS = {
    new: {
      title_ar: 'تم استلام الطلب',
      title_en: 'Order Received',
      desc_ar: 'تم استلام طلبكم بنجاح وجارٍ مراجعته وتأكيده مع العميل.',
      desc_en: 'Your order has been received and is pending sales verification.',
    },
    confirmed: {
      title_ar: 'تم تأكيد الطلب',
      title_en: 'Order Confirmed',
      desc_ar: 'تم تأكيد الطلب مع العميل هاتفياً وهو جاهز للتجهيز في المستودع.',
      desc_en: 'Order has been verified via phone and forwarded to the warehouse.',
    },
    processing: {
      title_ar: 'جارٍ التجهيز والتغليف',
      title_en: 'Processing & Packing',
      desc_ar: 'فريق المستودع يقوم بتجهيز وتغليف المنتجات للشحن.',
      desc_en: 'Warehouse team is picking and securely packing your items.',
    },
    shipped: {
      title_ar: 'تم تسليم الشحنة لشركة التوصيل',
      title_en: 'Shipped with Courier',
      desc_ar: 'تم شحن طلبكم بنجاح ومع المندوب للتوصيل.',
      desc_en: 'Your package is on its way with the courier.',
    },
    delivered: {
      title_ar: 'تم التوصيل بنجاح',
      title_en: 'Delivered',
      desc_ar: 'تم تسليم الطلب للعميل واستلام القيمة بنجاح.',
      desc_en: 'Order has been successfully delivered.',
    },
    delivery_failed: {
      title_ar: 'تعذر التوصيل',
      title_en: 'Delivery Failed',
      desc_ar: 'تعذر على شركة الشحن الوصول للعميل.',
      desc_en: 'Courier was unable to reach the recipient.',
    },
    returned_to_warehouse: {
      title_ar: 'عادت الشحنة للمستودع',
      title_en: 'Returned to Warehouse',
      desc_ar: 'تم استلام الشحنة المرتجعة وإعادة المنتجات للمخزون المتاح.',
      desc_en: 'Failed shipment returned to warehouse and physical stock restored.',
    },
    cancelled: {
      title_ar: 'تم إلغاء الطلب',
      title_en: 'Order Cancelled',
      desc_ar: 'تم إلغاء الطلب وتحرير المخزون المحجوز.',
      desc_en: 'Order cancelled and reserved stock released.',
    },
    return_requested: {
      title_ar: 'طلب إرجاع (RMA)',
      title_en: 'Return Requested',
      desc_ar: 'طلب العميل إرجاع منتج ضمن فترة الإرجاع المسموحة.',
      desc_en: 'Customer requested a product return within the return window.',
    },
    return_approved: {
      title_ar: 'تمت الموافقة على الإرجاع',
      title_en: 'Return Approved',
      desc_ar: 'تمت الموافقة على طلب الإرجاع وجارٍ انتظار استلام الشحنة.',
      desc_en: 'Return authorized; waiting for package to arrive at warehouse.',
    },
    return_received: {
      title_ar: 'تم استلام المرتجع وفحصه',
      title_en: 'Return Inspected in Warehouse',
      desc_ar: 'تم فحص القطع المرتجعة وتوجيه المخزون حسب الفحص الفني.',
      desc_en: 'Items received and inspected by QC team.',
    },
    refunded: {
      title_ar: 'تم رد المبلغ',
      title_en: 'Refunded',
      desc_ar: 'تم تحويل المبلغ للعميل وتسجيل حركة الاسترداد المالي.',
      desc_en: 'Financial refund completed and recorded in accounting ledger.',
    },
  };

  /**
   * Place a New Guest Order (ACID Transaction)
   * 1. Checks and locks product rows.
   * 2. Reserves stock.
   * 3. Creates order, line items, initial tracking log, and inventory transaction.
   */
  static async createOrder(orderData, itemsData) {
    const t = await sequelize.transaction();
    try {
      // 1. Validate stock and lock rows for update
      for (const item of itemsData) {
        if (item.item_type === 'product') {
          const product = await Product.findByPk(item.product_id, {
            transaction: t,
            lock: t.LOCK.UPDATE,
          });

          if (!product) {
            throw new Error(`Product #${item.product_id} not found`);
          }

          const ats = (product.stock_quantity || 0) - (product.reserved_stock || 0);
          if (ats < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name_ar} (${product.name_en}). Available: ${ats}, Requested: ${item.quantity}`);
          }

          // Reserve stock
          await product.increment('reserved_stock', { by: item.quantity, transaction: t });

          // Log reservation
          await InventoryTransaction.create({
            product_id: product.id,
            transaction_type: 'RESERVE',
            quantity_change: item.quantity,
            stock_before: product.stock_quantity,
            stock_after: product.stock_quantity,
            reference_type: 'order',
            notes: `Reserved for new order`,
          }, { transaction: t });

        } else if (item.item_type === 'bundle') {
          const bundle = await Bundle.findByPk(item.bundle_id, {
            include: [{ model: BundleItem, as: 'items', include: [{ model: Product, as: 'product' }] }],
            transaction: t,
          });

          if (!bundle) {
            throw new Error(`Bundle #${item.bundle_id} not found`);
          }

          for (const bItem of bundle.items) {
            const product = await Product.findByPk(bItem.product_id, {
              transaction: t,
              lock: t.LOCK.UPDATE,
            });

            const totalNeeded = bItem.quantity * item.quantity;
            const ats = (product.stock_quantity || 0) - (product.reserved_stock || 0);

            if (ats < totalNeeded) {
              throw new Error(`Insufficient bundle component stock for ${product.name_ar}. Available: ${ats}, Required: ${totalNeeded}`);
            }

            await product.increment('reserved_stock', { by: totalNeeded, transaction: t });

            await InventoryTransaction.create({
              product_id: product.id,
              transaction_type: 'RESERVE',
              quantity_change: totalNeeded,
              stock_before: product.stock_quantity,
              stock_after: product.stock_quantity,
              reference_type: 'order',
              notes: `Reserved component for bundle #${bundle.id}`,
            }, { transaction: t });
          }
        }
      }

      // 2. Insert Order
      const newOrder = await Order.create(orderData, { transaction: t });

      // 3. Insert Order Items
      const createdItems = [];
      for (const item of itemsData) {
        const orderItem = await OrderItem.create({
          ...item,
          order_id: newOrder.id,
        }, { transaction: t });
        createdItems.push(orderItem);
      }

      // Update reference_id on transactions created above
      await InventoryTransaction.update(
        { reference_id: newOrder.id },
        {
          where: {
            reference_type: 'order',
            reference_id: null,
          },
          transaction: t,
        }
      );

      // 4. Initial Tracking Log
      const initialStatus = this.STATUS_DEFINITIONS.new;
      await OrderTrackingLog.create({
        order_id: newOrder.id,
        from_status: null,
        to_status: 'new',
        title_ar: initialStatus.title_ar,
        title_en: initialStatus.title_en,
        notes_ar: initialStatus.desc_ar,
        notes_en: initialStatus.desc_en,
        internal_erp_note: 'Order created via storefront guest checkout.',
      }, { transaction: t });

      await t.commit();
      return { order: newOrder, items: createdItems };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Transition Order Status with ERP Ledger & Stock Updates
   */
  static async transitionStatus(orderId, newStatus, adminUser = null, extraData = {}) {
    const t = await sequelize.transaction();
    try {
      const order = await Order.findByPk(orderId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!order) {
        throw new Error(`Order #${orderId} not found`);
      }

      const items = await OrderItem.findAll({
        where: { order_id: order.id },
        transaction: t,
      });
      order.items = items;

      const currentStatus = order.order_status;
      if (currentStatus === newStatus) {
        await t.commit();
        return order;
      }

      // --- LOGIC RULES FOR TRANSITIONS ---

      // A. SHIPPED: Physical deduction from warehouse
      if (newStatus === 'shipped') {
        if (!['confirmed', 'processing'].includes(currentStatus)) {
          throw new Error(`Order must be 'confirmed' or 'processing' before dispatching as 'shipped'. Current: ${currentStatus}`);
        }

        for (const item of order.items) {
          if (item.item_type === 'product' && item.product_id) {
            const product = await Product.findByPk(item.product_id, { transaction: t, lock: t.LOCK.UPDATE });
            const beforeStock = product.stock_quantity;
            const qty = item.quantity;

            // Deduct both physical and reserved
            await product.decrement('stock_quantity', { by: qty, transaction: t });
            await product.decrement('reserved_stock', { by: qty, transaction: t });

            await InventoryTransaction.create({
              product_id: product.id,
              transaction_type: 'SALE_DEDUCTION',
              quantity_change: -qty,
              stock_before: beforeStock,
              stock_after: beforeStock - qty,
              reference_type: 'order',
              reference_id: order.id,
              performed_by: adminUser ? adminUser.id : null,
              notes: `Order #${order.order_number} dispatched to courier`,
            }, { transaction: t });

          } else if (item.item_type === 'bundle' && item.bundle_id) {
            const bundle = await Bundle.findByPk(item.bundle_id, {
              include: [{ model: BundleItem, as: 'items' }],
              transaction: t,
            });

            for (const bItem of bundle.items) {
              const product = await Product.findByPk(bItem.product_id, { transaction: t, lock: t.LOCK.UPDATE });
              const beforeStock = product.stock_quantity;
              const totalQty = bItem.quantity * item.quantity;

              await product.decrement('stock_quantity', { by: totalQty, transaction: t });
              await product.decrement('reserved_stock', { by: totalQty, transaction: t });

              await InventoryTransaction.create({
                product_id: product.id,
                transaction_type: 'SALE_DEDUCTION',
                quantity_change: -totalQty,
                stock_before: beforeStock,
                stock_after: beforeStock - totalQty,
                reference_type: 'order',
                reference_id: order.id,
                performed_by: adminUser ? adminUser.id : null,
                notes: `Bundle item dispatched in order #${order.order_number}`,
              }, { transaction: t });
            }
          }
        }

        order.shipped_at = new Date();
        if (extraData.courier_name) order.courier_name = extraData.courier_name;
        if (extraData.tracking_waybill) order.tracking_waybill = extraData.tracking_waybill;
      }

      // B. DELIVERED: Financial recognition
      if (newStatus === 'delivered') {
        order.delivered_at = new Date();
        order.payment_status = 'paid';

        // Record Inflow in ERP Financial Ledger
        const existingFin = await FinancialTransaction.findOne({
          where: { order_id: order.id, type: 'order_revenue' },
          transaction: t,
        });

        if (!existingFin) {
          const transNum = `REV-${Date.now()}-${order.id}`;
          await FinancialTransaction.create({
            transaction_number: transNum,
            order_id: order.id,
            type: 'order_revenue',
            direction: 'INFLOW',
            amount: order.total_amount,
            payment_channel: order.payment_method === 'cod' ? 'cod_cash' : 'online_gateway',
            gateway_reference: order.tracking_waybill || null,
            recorded_by: adminUser ? adminUser.id : null,
          }, { transaction: t });
        }
      }

      // C. CANCELLED: Release reservations or refund
      if (newStatus === 'cancelled') {
        if (!['new', 'confirmed', 'processing'].includes(currentStatus)) {
          throw new Error(`Cannot cancel order in status '${currentStatus}'. Must be before shipping.`);
        }

        for (const item of order.items) {
          if (item.item_type === 'product' && item.product_id) {
            const product = await Product.findByPk(item.product_id, { transaction: t, lock: t.LOCK.UPDATE });
            await product.decrement('reserved_stock', { by: item.quantity, transaction: t });

            await InventoryTransaction.create({
              product_id: product.id,
              transaction_type: 'RELEASE_RESERVATION',
              quantity_change: -item.quantity,
              stock_before: product.stock_quantity,
              stock_after: product.stock_quantity,
              reference_type: 'order',
              reference_id: order.id,
              performed_by: adminUser ? adminUser.id : null,
              notes: `Order #${order.order_number} cancelled`,
            }, { transaction: t });
          } else if (item.item_type === 'bundle' && item.bundle_id) {
            const bundle = await Bundle.findByPk(item.bundle_id, {
              include: [{ model: BundleItem, as: 'items' }],
              transaction: t,
            });

            for (const bItem of bundle.items) {
              const product = await Product.findByPk(bItem.product_id, { transaction: t, lock: t.LOCK.UPDATE });
              const totalQty = bItem.quantity * item.quantity;
              await product.decrement('reserved_stock', { by: totalQty, transaction: t });

              await InventoryTransaction.create({
                product_id: product.id,
                transaction_type: 'RELEASE_RESERVATION',
                quantity_change: -totalQty,
                stock_before: product.stock_quantity,
                stock_after: product.stock_quantity,
                reference_type: 'order',
                reference_id: order.id,
                performed_by: adminUser ? adminUser.id : null,
                notes: `Bundle reservation released on cancellation`,
              }, { transaction: t });
            }
          }
        }

        order.cancelled_at = new Date();
        if (extraData.cancellation_reason) {
          order.cancellation_reason = extraData.cancellation_reason;
        }

        // If online payment was already captured, log refund
        if (order.payment_status === 'paid') {
          order.payment_status = 'refunded';
          await FinancialTransaction.create({
            transaction_number: `REF-${Date.now()}-${order.id}`,
            order_id: order.id,
            type: 'customer_refund',
            direction: 'OUTFLOW',
            amount: order.total_amount,
            payment_channel: order.payment_method,
            notes: 'Cancellation refund',
            recorded_by: adminUser ? adminUser.id : null,
          }, { transaction: t });
        }
      }

      // D. RETURNED_TO_WAREHOUSE: Restock physical stock
      if (newStatus === 'returned_to_warehouse') {
        for (const item of order.items) {
          if (item.item_type === 'product' && item.product_id) {
            const product = await Product.findByPk(item.product_id, { transaction: t, lock: t.LOCK.UPDATE });
            const beforeStock = product.stock_quantity;
            await product.increment('stock_quantity', { by: item.quantity, transaction: t });

            await InventoryTransaction.create({
              product_id: product.id,
              transaction_type: 'FAILED_DELIVERY_RESTOCK',
              quantity_change: item.quantity,
              stock_before: beforeStock,
              stock_after: beforeStock + item.quantity,
              reference_type: 'order',
              reference_id: order.id,
              performed_by: adminUser ? adminUser.id : null,
              notes: `Package returned to warehouse; restocked`,
            }, { transaction: t });
          }
        }
      }

      // E. CONFIRMED
      if (newStatus === 'confirmed') {
        order.confirmed_at = new Date();
      }

      order.order_status = newStatus;
      await order.save({ transaction: t });

      // Create tracking log
      const statusDef = this.STATUS_DEFINITIONS[newStatus] || {
        title_ar: newStatus,
        title_en: newStatus,
        desc_ar: extraData.notes_ar || '',
        desc_en: extraData.notes_en || '',
      };

      await OrderTrackingLog.create({
        order_id: order.id,
        from_status: currentStatus,
        to_status: newStatus,
        title_ar: statusDef.title_ar,
        title_en: statusDef.title_en,
        notes_ar: extraData.notes_ar || statusDef.desc_ar,
        notes_en: extraData.notes_en || statusDef.desc_en,
        internal_erp_note: extraData.internal_erp_note || null,
        updated_by: adminUser ? adminUser.id : null,
      }, { transaction: t });

      await t.commit();
      return order;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Process RMA Return Inspection & Restock (QC step)
   */
  static async processReturnInspection(rmaId, restockItems, adminUser = null) {
    const t = await sequelize.transaction();
    try {
      const rma = await OrderReturn.findByPk(rmaId, {
        include: [{ model: OrderReturnItem, as: 'items' }, { model: Order, as: 'order' }],
        transaction: t,
      });

      if (!rma) throw new Error(`RMA #${rmaId} not found`);

      for (const itemConfig of restockItems) {
        const rmaItem = rma.items.find((i) => i.id === itemConfig.return_item_id);
        if (!rmaItem) continue;

        const product = await Product.findByPk(rmaItem.product_id, { transaction: t, lock: t.LOCK.UPDATE });
        const beforeStock = product.stock_quantity;

        if (itemConfig.restock_action === 'restock_available') {
          await product.increment('stock_quantity', { by: rmaItem.quantity_returned, transaction: t });
          await InventoryTransaction.create({
            product_id: product.id,
            transaction_type: 'RMA_RESTOCK',
            quantity_change: rmaItem.quantity_returned,
            stock_before: beforeStock,
            stock_after: beforeStock + rmaItem.quantity_returned,
            reference_type: 'rma',
            reference_id: rma.id,
            performed_by: adminUser ? adminUser.id : null,
            notes: `RMA inspection passed: Restocked to available`,
          }, { transaction: t });
        } else if (itemConfig.restock_action === 'move_to_damaged') {
          await product.increment('damaged_stock', { by: rmaItem.quantity_returned, transaction: t });
          await InventoryTransaction.create({
            product_id: product.id,
            transaction_type: 'RMA_DAMAGED',
            quantity_change: rmaItem.quantity_returned,
            stock_before: beforeStock,
            stock_after: beforeStock,
            reference_type: 'rma',
            reference_id: rma.id,
            performed_by: adminUser ? adminUser.id : null,
            notes: `RMA inspection defective: Moved to damaged stock`,
          }, { transaction: t });
        }

        await rmaItem.update({
          item_condition: itemConfig.item_condition || rmaItem.item_condition,
          restock_action: itemConfig.restock_action,
        }, { transaction: t });
      }

      await rma.update({
        status: 'inspected',
        processed_by: adminUser ? adminUser.id : null,
        admin_inspection_notes: restockItems.inspection_notes || 'QC inspection completed.',
      }, { transaction: t });

      await t.commit();
      return rma;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

module.exports = OrderLifecycleService;
