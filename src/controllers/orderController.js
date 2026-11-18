const crypto = require('crypto');
const { Op } = require('sequelize');
const {
  Order,
  OrderItem,
  OrderTrackingLog,
  Product,
  ProductImage,
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
        landmark,
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
        landmark: landmark ? landmark.trim() : null,
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
          id: order.id,
          order_number: order.order_number,
          total_amount: order.total_amount,
          subtotal: order.subtotal,
          discount_amount: order.discount_amount,
          shipping_fee: order.shipping_fee,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          order_status: order.order_status,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          customer_phone_2: order.customer_phone_2,
          customer_email: order.customer_email,
          governorate: order.governorate,
          city: order.city,
          street_address: order.street_address,
          landmark: order.landmark,
          order_notes: order.order_notes,
          created_at: order.created_at,
          items: items,
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
      const isOrderNum = trimmed.toUpperCase().startsWith('TRD-') || isNaN(trimmed) === false;

      const whereClause = trimmed.toUpperCase().startsWith('TRD-')
        ? { order_number: { [Op.iLike]: trimmed } }
        : {
            [Op.or]: [
              { order_number: { [Op.iLike]: trimmed } },
              { customer_phone: { [Op.iLike]: `%${trimmed}%` } },
              { customer_phone_2: { [Op.iLike]: `%${trimmed}%` } },
            ],
          };

      const orders = await Order.findAll({
        where: whereClause,
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name_ar', 'name_en', 'slug', 'sku', 'stock_quantity'],
                include: [
                  {
                    model: ProductImage,
                    as: 'images',
                    attributes: ['image_url', 'is_primary'],
                  },
                ],
              },
            ],
          },
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
        data: typeof res.localize === 'function' ? orders.map((o) => res.localize(o)) : orders,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Single Order by Order Number or ID
   * GET /api/v1/orders/by-number/:orderNumber
   */
  static async getOrderByNumber(req, res, next) {
    try {
      const { orderNumber } = req.params;
      if (!orderNumber) {
        return res.status(400).json({ success: false, message: 'Order number is required' });
      }

      const trimmed = orderNumber.trim();
      const whereClause = isNaN(trimmed)
        ? { order_number: { [Op.iLike]: trimmed } }
        : {
            [Op.or]: [
              { id: trimmed },
              { order_number: { [Op.iLike]: trimmed } },
            ],
          };

      const order = await Order.findOne({
        where: whereClause,
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name_ar', 'name_en', 'slug', 'sku', 'stock_quantity'],
                include: [
                  {
                    model: ProductImage,
                    as: 'images',
                    attributes: ['image_url', 'is_primary'],
                  },
                ],
              },
            ],
          },
          { model: OrderTrackingLog, as: 'tracking_logs', order: [['created_at', 'ASC']] },
        ],
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      }

      return res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Customer Self-Service Update (Allowed only if NOT shipped yet)
   * PATCH /api/v1/orders/:orderNumber/customer-update
   */
  static async customerUpdateOrder(req, res, next) {
    try {
      const { orderNumber } = req.params;
      const {
        customer_name,
        customer_phone,
        customer_phone_2,
        governorate,
        city,
        street_address,
        landmark,
        order_notes,
        items,
      } = req.body;

      const order = await Order.findOne({
        where: { order_number: orderNumber },
        include: [{ model: OrderItem, as: 'items' }],
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      }

      // Customer can ONLY edit if status is new, confirmed, or processing
      if (!['new', 'confirmed', 'processing'].includes(order.order_status)) {
        return res.status(400).json({
          success: false,
          message: 'عفواً، لا يمكن تعديل بيانات الطلب لأنه قيد الشحن أو تم تسليمه بالفعل.',
        });
      }

      if (customer_name && customer_name.trim()) order.customer_name = customer_name.trim();
      if (customer_phone && customer_phone.trim()) order.customer_phone = customer_phone.trim();
      if (customer_phone_2 !== undefined) order.customer_phone_2 = customer_phone_2 ? customer_phone_2.trim() : null;
      if (governorate && governorate.trim()) order.governorate = governorate.trim();
      if (city && city.trim()) order.city = city.trim();
      if (street_address && street_address.trim()) order.street_address = street_address.trim();
      if (landmark !== undefined) order.landmark = landmark ? landmark.trim() : null;
      if (order_notes !== undefined) order.order_notes = order_notes;

      // Handle item quantity modification or deletion
      if (Array.isArray(items) && items.length > 0) {
        let newSubtotal = 0;
        for (const itemMod of items) {
          const oi = order.items.find((i) => i.id == itemMod.id);
          if (oi) {
            const newQty = Number(itemMod.quantity);
            if (newQty <= 0) {
              await oi.destroy();
            } else {
              oi.quantity = newQty;
              oi.total_price = Number(oi.unit_price) * newQty;
              await oi.save();
              newSubtotal += Number(oi.total_price);
            }
          }
        }
        if (newSubtotal > 0) {
          order.subtotal = newSubtotal;
          order.total_amount = Math.max(0, newSubtotal - Number(order.discount_amount) + Number(order.shipping_fee));
        }
      }

      await order.save();

      await OrderTrackingLog.create({
        order_id: order.id,
        from_status: order.order_status,
        to_status: order.order_status,
        title_ar: 'تعديل بيانات الطلب',
        title_en: 'Order Details Updated',
        notes_ar: 'قام العميل بتحديث بيانات الشحن والتوصيل للطلب.',
        notes_en: 'Customer updated delivery information for this order.',
        internal_erp_note: 'Updated by customer via tracking self-service.',
      });

      return res.status(200).json({
        success: true,
        message: 'تم تحديث بيانات الطلب بنجاح',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Customer Self-Service Cancel (Allowed only if NOT shipped yet)
   * POST /api/v1/orders/:orderNumber/customer-cancel
   */
  static async customerCancelOrder(req, res, next) {
    try {
      const { orderNumber } = req.params;
      const { cancellation_reason } = req.body;

      const order = await Order.findOne({ where: { order_number: orderNumber } });
      if (!order) {
        return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      }

      if (!['new', 'confirmed', 'processing'].includes(order.order_status)) {
        return res.status(400).json({
          success: false,
          message: 'عفواً، لا يمكن إلغاء الطلب لأنه قيد الشحن أو تم تسليمه بالفعل.',
        });
      }

      const updated = await OrderLifecycleService.transitionStatus(order.id, 'cancelled', null, {
        cancellation_reason: cancellation_reason || 'تم الإلغاء بناءً على رغبة العميل من صفحة التتبع',
        internal_note: 'Customer cancelled order via tracking self-service',
      });

      return res.status(200).json({
        success: true,
        message: 'تم إلغاء الطلب بنجاح',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: List & Search Orders with Time Filters and Status Counts
   * GET /api/v1/orders
   */
  static async listOrders(req, res, next) {
    try {
      const {
        status,
        payment_status,
        search,
        time_filter,
        date_from,
        date_to,
        page = 1,
        limit = 30,
      } = req.query;

      const whereClause = {};

      // Status Filter
      if (status && status !== 'all') {
        if (status === 'new') whereClause.order_status = 'new';
        else if (status === 'pending') whereClause.order_status = { [Op.in]: ['confirmed', 'processing'] };
        else if (status === 'processing') whereClause.order_status = 'processing';
        else if (status === 'shipped') whereClause.order_status = 'shipped';
        else if (status === 'delivered') whereClause.order_status = 'delivered';
        else if (status === 'returned') whereClause.order_status = { [Op.in]: ['returned_to_warehouse', 'return_received', 'refunded'] };
        else if (status === 'cancelled') whereClause.order_status = 'cancelled';
        else whereClause.order_status = status;
      }

      if (payment_status && payment_status !== 'all') {
        whereClause.payment_status = payment_status;
      }

      // Time Filter (فيلتر زمني)
      const now = new Date();
      if (time_filter === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        whereClause.created_at = { [Op.gte]: startOfDay };
      } else if (time_filter === '7days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        whereClause.created_at = { [Op.gte]: sevenDaysAgo };
      } else if (time_filter === '30days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        whereClause.created_at = { [Op.gte]: thirtyDaysAgo };
      } else if (time_filter === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        whereClause.created_at = { [Op.gte]: startOfMonth };
      } else if (date_from || date_to) {
        whereClause.created_at = {};
        if (date_from) whereClause.created_at[Op.gte] = new Date(date_from);
        if (date_to) {
          const end = new Date(date_to);
          end.setHours(23, 59, 59, 999);
          whereClause.created_at[Op.lte] = end;
        }
      }

      // Search Query
      if (search && search.trim()) {
        const q = `%${search.trim()}%`;
        whereClause[Op.or] = [
          { order_number: { [Op.iLike]: q } },
          { customer_name: { [Op.iLike]: q } },
          { customer_phone: { [Op.iLike]: q } },
          { customer_email: { [Op.iLike]: q } },
          { city: { [Op.iLike]: q } },
          { governorate: { [Op.iLike]: q } },
        ];
      }

      const offset = (Number(page) - 1) * Number(limit);
      const { count, rows } = await Order.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name_ar', 'name_en', 'slug', 'sku'],
              },
            ],
          },
          { model: OrderTrackingLog, as: 'tracking_logs', order: [['created_at', 'DESC']] },
        ],
        order: [['created_at', 'DESC']],
        limit: Number(limit),
        offset,
        distinct: true,
      });

      // Compute Status Counter Badges across all orders
      const allOrders = await Order.findAll({
        attributes: ['order_status', 'created_at'],
      });

      const statusCounts = {
        all: allOrders.length,
        new: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        returned: 0,
        cancelled: 0,
      };

      allOrders.forEach((o) => {
        const st = o.order_status;
        if (st === 'new') statusCounts.new++;
        else if (st === 'confirmed') statusCounts.pending++;
        else if (st === 'processing') statusCounts.processing++;
        else if (st === 'shipped') statusCounts.shipped++;
        else if (st === 'delivered') statusCounts.delivered++;
        else if (st === 'returned_to_warehouse' || st === 'return_received' || st === 'refunded') statusCounts.returned++;
        else if (st === 'cancelled') statusCounts.cancelled++;
      });

      return res.status(200).json({
        success: true,
        count,
        total_pages: Math.ceil(count / limit),
        status_counts: statusCounts,
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

      const updated = await OrderLifecycleService.transitionStatus(id, status, req.user || null, {
        courier_name,
        tracking_waybill,
        cancellation_reason,
        internal_erp_note: internal_note,
      });

      return res.status(200).json({
        success: true,
        message: `تم تحديث حالة الطلب إلى ${status} بنجاح`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Add Internal Comment / Note
   * POST /api/v1/orders/:id/comment
   */
  static async addComment(req, res, next) {
    try {
      const { id } = req.params;
      const { comment } = req.body;

      if (!comment || !comment.trim()) {
        return res.status(400).json({ success: false, message: 'نص التعليق مطلوب' });
      }

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
      }

      const log = await OrderTrackingLog.create({
        order_id: order.id,
        from_status: order.order_status,
        to_status: order.order_status,
        title_ar: 'ملاحظة إدارية داخلية',
        title_en: 'Internal Admin Note',
        notes_ar: comment.trim(),
        notes_en: comment.trim(),
        internal_erp_note: comment.trim(),
        updated_by: req.user ? req.user.id : null,
      });

      return res.status(201).json({
        success: true,
        message: 'تم إضافة التعليق بنجاح',
        data: log,
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
