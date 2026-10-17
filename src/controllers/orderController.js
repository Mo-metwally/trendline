const crypto = require('crypto');
const { Op } = require('sequelize');
const {
  Order,
  OrderItem,
  OrderTrackingLog,
  Product,
  Bundle,
  BundleItem,
  ShippingZone,
  OrderReturn,
  OrderReturnItem,
} = require('../models');
const OrderLifecycleService = require('../services/orderLifecycleService');
const FirstOrderDiscountService = require('../services/firstOrderDiscountService');

class OrderController {
  /**
   * Helper to generate unique order number: TRD-YYMM-RANDOM
   */
  static generateOrderNumber() {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const rand = crypto.randomInt(1000, 9999);
    return `TRD-${yy}${mm}-${rand}`;
  }

  /**
   * Guest Checkout
   * POST /api/v1/orders/checkout
   */
  static async checkout(req, res, next) {
    try {
      const {
        customer_name,
        customer_phone,
        customer_phone_2,
        customer_email,
        governorate,
        city,
        street_address,
        order_notes,
        locale = 'ar',
        payment_method = 'cod',
        coupon_code,
        cart_items = [], // [{ item_type: 'product'|'bundle', product_id, bundle_id, quantity }]
      } = req.body;

      if (!customer_name || !customer_phone || !governorate || !city || !street_address) {
        return res.status(400).json({
          success: false,
          message: 'Customer name, phone, governorate, city, and street address are strictly required',
        });
      }

      if (!cart_items || cart_items.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart cannot be empty' });
      }

      // 1. Calculate shipping fee from ShippingZone
      let shippingFee = 50.00; // default fallback
      const zone = await ShippingZone.findOne({
        where: {
          [Op.or]: [
            { governorate_ar: governorate },
            { governorate_en: { [Op.iLike]: governorate } },
          ],
          is_active: true,
        },
      });
      if (zone) {
        shippingFee = Number(zone.shipping_cost);
      }

      // 2. Prepare order line items and compute subtotal & COGS
      let subtotal = 0;
      let totalCost = 0;
      const preparedItems = [];

      for (const item of cart_items) {
        if (item.item_type === 'product') {
          const product = await Product.findByPk(item.product_id);
          if (!product || !product.is_active) {
            return res.status(400).json({ success: false, message: `Product #${item.product_id} is unavailable` });
          }

          const unitPrice = product.sale_price ? Number(product.sale_price) : Number(product.original_price);
          const lineTotal = unitPrice * Number(item.quantity);
          const unitCost = Number(product.cost_price) || 0;

          subtotal += lineTotal;
          totalCost += unitCost * Number(item.quantity);

          preparedItems.push({
            item_type: 'product',
            product_id: product.id,
            bundle_id: null,
            item_name_snapshot_ar: product.name_ar,
            item_name_snapshot_en: product.name_en,
            sku_snapshot: product.sku,
            unit_cost_snapshot: unitCost,
            unit_price: unitPrice,
            quantity: item.quantity,
            total_price: lineTotal,
            bundle_breakdown_json: null,
          });
        } else if (item.item_type === 'bundle') {
          const bundle = await Bundle.findByPk(item.bundle_id, {
            include: [{ model: BundleItem, as: 'items', include: [{ model: Product, as: 'product' }] }],
          });

          if (!bundle || !bundle.is_active) {
            return res.status(400).json({ success: false, message: `Bundle #${item.bundle_id} is unavailable` });
          }

          const unitPrice = Number(bundle.bundle_price);
          const lineTotal = unitPrice * Number(item.quantity);

          // Calculate bundle cost snapshot from components
          let bundleCost = 0;
          const breakdown = [];
          for (const bItem of bundle.items) {
            const pCost = Number(bItem.product.cost_price) || 0;
            bundleCost += pCost * bItem.quantity;
            breakdown.push({
              product_id: bItem.product_id,
              name_ar: bItem.product.name_ar,
              name_en: bItem.product.name_en,
              sku: bItem.product.sku,
              quantity_per_bundle: bItem.quantity,
              total_quantity: bItem.quantity * item.quantity,
            });
          }

          subtotal += lineTotal;
          totalCost += bundleCost * Number(item.quantity);

          preparedItems.push({
            item_type: 'bundle',
            product_id: null,
            bundle_id: bundle.id,
            item_name_snapshot_ar: bundle.name_ar,
            item_name_snapshot_en: bundle.name_en,
            sku_snapshot: bundle.sku,
            unit_cost_snapshot: bundleCost,
            unit_price: unitPrice,
            quantity: item.quantity,
            total_price: lineTotal,
            bundle_breakdown_json: breakdown,
          });
        }
      }

      // 3. Coupon Verification & First-Order Eligibility
      let discountAmount = 0;
      let appliedCouponCode = null;
      if (coupon_code) {
        const couponCheck = await FirstOrderDiscountService.validateAndApplyCoupon(
          coupon_code,
          customer_phone,
          subtotal
        );
        if (couponCheck.valid) {
          discountAmount = couponCheck.discount_amount;
          appliedCouponCode = couponCheck.coupon.code;
          // Increment used count
          await couponCheck.coupon.increment('used_count', { by: 1 });
        } else {
          return res.status(400).json({ success: false, message: couponCheck.message });
        }
      }

      const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);
      const orderNumber = OrderController.generateOrderNumber();

      const orderPayload = {
        order_number: orderNumber,
        customer_name,
        customer_phone: customer_phone.trim(),
        customer_phone_2: customer_phone_2 ? customer_phone_2.trim() : null,
        customer_email: customer_email ? customer_email.trim() : null,
        governorate,
        city,
        street_address,
        order_notes,
        locale: locale === 'en' ? 'en' : 'ar',
        subtotal,
        discount_amount: discountAmount,
        shipping_fee: shippingFee,
        total_amount: totalAmount,
        total_cost: totalCost,
        coupon_code: appliedCouponCode,
        payment_method,
        payment_status: payment_method === 'cod' ? 'unpaid' : 'paid',
        order_status: 'new',
      };

      // 4. Create Order inside ACID transaction
      const { order, items } = await OrderLifecycleService.createOrder(orderPayload, preparedItems);

      return res.status(201).json({
        success: true,
        message: locale === 'en' ? 'Order placed successfully!' : 'تم تقديم طلبك بنجاح!',
        data: {
          order_number: order.order_number,
          total_amount: order.total_amount,
          shipping_fee: order.shipping_fee,
          order_status: order.order_status,
          created_at: order.created_at,
          items_count: items.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Track Order by Order Number or Customer Phone
   * GET /api/v1/orders/track
   */
  static async trackOrder(req, res, next) {
    try {
      const { query } = req.query; // can be TRD-XXXX or phone number
      if (!query) {
        return res.status(400).json({ success: false, message: 'Order number or phone number is required' });
      }

      const trimmed = query.trim();
      const isOrderNum = trimmed.toUpperCase().startsWith('TRD-');

      const whereClause = isOrderNum
        ? { order_number: trimmed.toUpperCase() }
        : { customer_phone: trimmed };

      const orders = await Order.findAll({
        where: whereClause,
        include: [
          { model: OrderItem, as: 'items' },
          { model: OrderTrackingLog, as: 'tracking_logs', order: [['created_at', 'ASC']] },
        ],
        order: [['created_at', 'DESC']],
      });

      if (!orders || orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: req.locale === 'en' ? 'No orders found matching the provided reference' : 'لم يتم العثور على أي طلبات مطابقة لبيانات البحث',
        });
      }

      return res.status(200).json({
        success: true,
        count: orders.length,
        data: orders.map((o) => res.localize(o)),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: List & Search Orders
   * GET /api/v1/orders
   */
  static async listOrders(req, res, next) {
    try {
      const {
        status,
        payment_status,
        search,
        page = 1,
        limit = 20,
      } = req.query;

      const whereClause = {};
      if (status) whereClause.order_status = status;
      if (payment_status) whereClause.payment_status = payment_status;

      if (search) {
        const q = `%${search.trim()}%`;
        whereClause[Op.or] = [
          { order_number: { [Op.iLike]: q } },
          { customer_name: { [Op.iLike]: q } },
          { customer_phone: { [Op.iLike]: q } },
        ];
      }

      const offset = (Number(page) - 1) * Number(limit);
      const { count, rows } = await Order.findAndCountAll({
        where: whereClause,
        include: [
          { model: OrderItem, as: 'items' },
          { model: OrderTrackingLog, as: 'tracking_logs' },
        ],
        order: [['created_at', 'DESC']],
        limit: Number(limit),
        offset,
        distinct: true,
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
   * Admin: Transition Order Status
   * PATCH /api/v1/orders/:id/status
   */
  static async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, courier_name, tracking_waybill, cancellation_reason, internal_note } = req.body;

      const updated = await OrderLifecycleService.transitionStatus(id, status, req.user, {
        courier_name,
        tracking_waybill,
        cancellation_reason,
        internal_erp_note: internal_note,
      });

      return res.status(200).json({
        success: true,
        message: `Order status successfully transitioned to ${status}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Initiate RMA Return
   * POST /api/v1/orders/:id/rma
   */
  static async createRMA(req, res, next) {
    try {
      const { id } = req.params;
      const { return_reason, refund_method, items } = req.body; // items: [{ order_item_id, product_id, quantity }]

      const order = await Order.findByPk(id, { include: [{ model: OrderItem, as: 'items' }] });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      if (order.order_status !== 'delivered') {
        return res.status(400).json({ success: false, message: 'Returns can only be requested for delivered orders' });
      }

      // Check 14-day return window
      const deliveredAt = new Date(order.delivered_at || order.updated_at);
      const diffDays = (new Date() - deliveredAt) / (1000 * 60 * 60 * 24);
      if (diffDays > 14) {
        return res.status(400).json({ success: false, message: 'Return window (14 days) has expired' });
      }

      let totalRefund = 0;
      for (const it of items) {
        const orderItem = order.items.find((oi) => oi.id === it.order_item_id);
        if (orderItem) {
          totalRefund += Number(orderItem.unit_price) * Number(it.quantity);
        }
      }

      const rmaNumber = `RMA-${Date.now().toString().slice(-4)}${crypto.randomInt(10, 99)}`;

      const rma = await OrderReturn.create({
        rma_number: rmaNumber,
        order_id: order.id,
        status: 'requested',
        return_reason,
        refund_method: refund_method || 'instapay',
        refund_amount: totalRefund,
      });

      for (const it of items) {
        await OrderReturnItem.create({
          rma_id: rma.id,
          order_item_id: it.order_item_id,
          product_id: it.product_id,
          quantity_returned: it.quantity,
          item_condition: 'sealed',
          restock_action: 'restock_available',
        });
      }

      await OrderLifecycleService.transitionStatus(order.id, 'return_requested', req.user || null);

      return res.status(201).json({
        success: true,
        message: 'RMA Return request submitted successfully',
        data: rma,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrderController;
