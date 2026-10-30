const { Op } = require('sequelize');
const {
  Banner,
  SpecialOfferCard,
  Coupon,
  Order,
  OrderItem,
  StoreFeature,
  ContactMessage,
  NewsletterSubscriber,
  ShippingZone,
  StaticPage,
  SiteSetting,
} = require('../models');
const FirstOrderDiscountService = require('../services/firstOrderDiscountService');

class CmsController {
  // =================== BANNERS & SPECIAL OFFERS ===================

  static async getBanners(req, res, next) {
    try {
      const { placement, all } = req.query;
      const whereClause = {};
      if (all !== 'true') {
        whereClause.is_active = true;
      }
      if (placement) whereClause.placement = placement;

      const banners = await Banner.findAll({
        where: whereClause,
        order: [['sort_order', 'ASC'], ['id', 'ASC']],
      });
      return res.status(200).json({ success: true, data: all === 'true' ? banners : res.localize(banners) });
    } catch (error) {
      next(error);
    }
  }

  static async getAllBannersAdmin(req, res, next) {
    try {
      const { placement } = req.query;
      const whereClause = {};
      if (placement) whereClause.placement = placement;

      const banners = await Banner.findAll({
        where: whereClause,
        order: [['sort_order', 'ASC'], ['id', 'ASC']],
      });
      return res.status(200).json({ success: true, data: banners });
    } catch (error) {
      next(error);
    }
  }

  static async createBanner(req, res, next) {
    try {
      const banner = await Banner.create(req.body);
      return res.status(201).json({ success: true, data: banner });
    } catch (error) {
      next(error);
    }
  }

  static async updateBanner(req, res, next) {
    try {
      const { id } = req.params;
      const banner = await Banner.findByPk(id);
      if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
      await banner.update(req.body);
      return res.status(200).json({ success: true, data: banner });
    } catch (error) {
      next(error);
    }
  }

  static async reorderBanners(req, res, next) {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ success: false, message: 'Items array is required' });
      }

      const { sequelize } = require('../config/db');
      await sequelize.transaction(async (t) => {
        for (const item of items) {
          if (item.id !== undefined && item.sort_order !== undefined) {
            await Banner.update(
              { sort_order: Number(item.sort_order) },
              { where: { id: item.id }, transaction: t }
            );
          }
        }
      });

      const updated = await Banner.findAll({ order: [['sort_order', 'ASC'], ['id', 'ASC']] });
      return res.status(200).json({ success: true, message: 'Banners reordered successfully', data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async deleteBanner(req, res, next) {
    try {
      const { id } = req.params;
      const banner = await Banner.findByPk(id);
      if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
      await banner.destroy();
      return res.status(200).json({ success: true, message: 'Banner deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getSpecialOffers(req, res, next) {
    try {
      const offers = await SpecialOfferCard.findAll({
        where: { is_active: true },
        order: [['sort_order', 'ASC']],
      });
      return res.status(200).json({ success: true, data: res.localize(offers) });
    } catch (error) {
      next(error);
    }
  }

  // =================== STORE FEATURES ===================

  static async getStoreFeatures(req, res, next) {
    try {
      const { placement } = req.query;
      const whereClause = { is_active: true };
      if (placement) whereClause.placement = placement;

      const features = await StoreFeature.findAll({
        where: whereClause,
        order: [['sort_order', 'ASC']],
      });
      return res.status(200).json({ success: true, data: res.localize(features) });
    } catch (error) {
      next(error);
    }
  }

  // =================== SHIPPING ZONES ===================

  static async getShippingZones(req, res, next) {
    try {
      const zones = await ShippingZone.findAll({
        where: { is_active: true },
        order: [['governorate_ar', 'ASC']],
      });
      return res.status(200).json({ success: true, data: res.localize(zones) });
    } catch (error) {
      next(error);
    }
  }

  static async updateShippingZone(req, res, next) {
    try {
      const { id } = req.params;
      const zone = await ShippingZone.findByPk(id);
      if (!zone) return res.status(404).json({ success: false, message: 'Shipping zone not found' });

      await zone.update(req.body);
      return res.status(200).json({ success: true, data: zone });
    } catch (error) {
      next(error);
    }
  }

  // =================== COUPONS ===================

  static generateRandomCouponCode(length = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'TRD';
    for (let i = 0; i < Math.max(3, length - 3); i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static async generateUniqueCouponCode() {
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = CmsController.generateRandomCouponCode(8);
      const existing = await Coupon.findOne({ where: { code: candidate } });
      if (!existing) return candidate;
    }
    return `TRD${Date.now().toString(36).toUpperCase().slice(-5)}`;
  }

  static async getCoupons(req, res, next) {
    try {
      const [coupons, couponOrders] = await Promise.all([
        Coupon.findAll({ order: [['id', 'DESC']] }),
        Order.findAll({
          where: {
            coupon_code: {
              [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }],
            },
          },
          include: [{ model: OrderItem, as: 'items' }],
          order: [['id', 'DESC']],
        }),
      ]);

      // Group orders by normalized coupon_code
      const ordersByCode = {};
      for (const ord of couponOrders) {
        const plainOrd = ord.toJSON ? ord.toJSON() : ord;
        const normCode = String(plainOrd.coupon_code || '').toUpperCase().trim();
        if (!normCode) continue;
        if (!ordersByCode[normCode]) ordersByCode[normCode] = [];
        ordersByCode[normCode].push(plainOrd);
      }

      const now = new Date();
      const enrichedCoupons = coupons.map((c) => {
        const raw = c.toJSON ? c.toJSON() : c;
        const normCode = String(raw.code || '').toUpperCase().trim();
        const linkedOrders = ordersByCode[normCode] || [];

        // Count non-cancelled orders per customer phone for this coupon
        const phoneUsageCounts = {};
        const customerMap = {};
        let nonCancelledCount = 0;
        let totalDiscountGranted = 0;
        let totalRevenueGenerated = 0;

        // Sort linkedOrders by createdAt DESC
        linkedOrders.sort(
          (a, b) =>
            new Date(b.createdAt || b.created_at || 0).getTime() -
            new Date(a.createdAt || a.created_at || 0).getTime()
        );

        for (const o of linkedOrders) {
          const phoneKey = String(o.customer_phone || '').trim();
          const isCancelled = o.order_status === 'cancelled';
          if (!isCancelled) {
            nonCancelledCount += 1;
            totalDiscountGranted += Number(o.discount_amount || 0);
            totalRevenueGenerated += Number(o.total_amount || 0);
            if (phoneKey) {
              phoneUsageCounts[phoneKey] = (phoneUsageCounts[phoneKey] || 0) + 1;
            }
          }

          if (phoneKey) {
            if (!customerMap[phoneKey]) {
              customerMap[phoneKey] = {
                customer_name: o.customer_name,
                customer_phone: o.customer_phone,
                customer_phone_2: o.customer_phone_2 || null,
                customer_email: o.customer_email || null,
                governorate: o.governorate,
                city: o.city,
                street_address: o.street_address,
                times_used: 0,
                total_orders: 0,
                total_discount_saved: 0,
                total_spent: 0,
                last_used_at: o.createdAt || o.created_at,
                last_order_number: o.order_number,
                orders: [],
              };
            }
            customerMap[phoneKey].total_orders += 1;
            if (!isCancelled) {
              customerMap[phoneKey].times_used += 1;
              customerMap[phoneKey].total_discount_saved += Number(o.discount_amount || 0);
              customerMap[phoneKey].total_spent += Number(o.total_amount || 0);
            }
            customerMap[phoneKey].orders.push({
              order_id: o.id,
              order_number: o.order_number,
              subtotal: Number(o.subtotal || 0),
              discount_amount: Number(o.discount_amount || 0),
              shipping_fee: Number(o.shipping_fee || 0),
              total_amount: Number(o.total_amount || 0),
              order_status: o.order_status,
              payment_method: o.payment_method,
              payment_status: o.payment_status,
              used_at: o.createdAt || o.created_at,
            });
          }
        }

        const usages = linkedOrders.map((o) => {
          const phoneKey = String(o.customer_phone || '').trim();
          const usedAt = o.createdAt || o.created_at;
          return {
            order_id: o.id,
            order_number: o.order_number,
            customer_name: o.customer_name,
            customer_phone: o.customer_phone,
            customer_phone_2: o.customer_phone_2 || null,
            customer_email: o.customer_email || null,
            governorate: o.governorate,
            city: o.city,
            street_address: o.street_address,
            subtotal: Number(o.subtotal || 0),
            discount_amount: Number(o.discount_amount || 0),
            shipping_fee: Number(o.shipping_fee || 0),
            total_amount: Number(o.total_amount || 0),
            order_status: o.order_status,
            payment_method: o.payment_method,
            payment_status: o.payment_status,
            used_at: usedAt,
            customer_usage_count_for_coupon: phoneUsageCounts[phoneKey] || 1,
            items_count: Array.isArray(o.items) ? o.items.length : 0,
            items: Array.isArray(o.items)
              ? o.items.map((it) => ({
                  id: it.id,
                  item_type: it.item_type,
                  name_ar: it.item_name_snapshot_ar,
                  name_en: it.item_name_snapshot_en,
                  sku: it.sku_snapshot,
                  quantity: it.quantity,
                  unit_price: Number(it.unit_price || 0),
                  total_price: Number(it.total_price || 0),
                }))
              : [],
          };
        });

        const actualUsedCount = Math.max(Number(raw.used_count || 0), nonCancelledCount);
        const lastUsage = usages.length > 0 ? usages[0] : null;
        const lastUsedAt = lastUsage ? lastUsage.used_at : null;

        const isExpired = Boolean(raw.expires_at && new Date(raw.expires_at) < now);
        const isExhausted = Boolean(
          raw.usage_limit && Number(raw.usage_limit) > 0 && actualUsedCount >= Number(raw.usage_limit)
        );

        let computedStatus = 'active';
        if (!raw.is_active) {
          computedStatus = 'inactive';
        } else if (isExpired) {
          computedStatus = 'expired';
        } else if (isExhausted) {
          computedStatus = 'exhausted';
        }

        return {
          ...raw,
          name_ar: raw.name_ar || raw.description_ar || raw.code,
          name_en: raw.name_en || raw.description_en || raw.code,
          discount_value: Number(raw.discount_value || 0),
          max_discount: raw.max_discount !== null ? Number(raw.max_discount) : null,
          min_order_value: Number(raw.min_order_value || 0),
          usage_limit: raw.usage_limit !== null ? Number(raw.usage_limit) : null,
          per_user_limit: raw.per_user_limit !== null ? Number(raw.per_user_limit) : null,
          used_count: actualUsedCount,
          actual_used_count: actualUsedCount,
          linked_orders_count: usages.length,
          last_used_at: lastUsedAt,
          last_usage: lastUsage,
          usages,
          customers_summary: Object.values(customerMap),
          total_discount_granted: Number(totalDiscountGranted.toFixed(2)),
          total_revenue_generated: Number(totalRevenueGenerated.toFixed(2)),
          is_expired: isExpired,
          is_exhausted: isExhausted,
          computed_status: computedStatus,
        };
      });

      return res.status(200).json({ success: true, data: enrichedCoupons });
    } catch (error) {
      next(error);
    }
  }

  static async createCoupon(req, res, next) {
    try {
      const {
        name_ar,
        name_en,
        description_ar,
        description_en,
        code,
        auto_generate,
        discount_type = 'percentage',
        discount_value,
        max_discount,
        min_order_value = 0,
        first_order_only = false,
        usage_limit,
        per_user_limit,
        expires_at,
        is_active = true,
      } = req.body;

      const cleanNameAr = (name_ar || description_ar || '').trim();
      if (!cleanNameAr) {
        return res.status(400).json({
          success: false,
          message: 'اسم الكوبون إجباري، يرجى إدخال اسم واضح للكوبون',
        });
      }

      // Resolve & validate coupon code (auto-generate OR manual min 3 alphanumeric characters)
      let finalCode = '';
      if (auto_generate || !code || String(code).trim() === '') {
        finalCode = await CmsController.generateUniqueCouponCode();
      } else {
        finalCode = String(code).toUpperCase().trim().replace(/\s+/g, '');
        if (!/^[A-Z0-9]{3,50}$/.test(finalCode)) {
          return res.status(400).json({
            success: false,
            message: 'كود الكوبون يجب أن يتكون من 3 أحرف إنجليزية وأرقام على الأقل بدون رموز أو مسافات',
          });
        }
      }

      const existing = await Coupon.findOne({
        where: { code: { [Op.iLike]: finalCode } },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `كود الكوبون (${finalCode}) مستخدم بالفعل في كوبون آخر`,
        });
      }

      if (!['percentage', 'fixed_amount'].includes(discount_type)) {
        return res.status(400).json({
          success: false,
          message: 'نوع الخصم يجب أن يكون نسبة مئوية أو مبلغ ثابت',
        });
      }

      const numDiscountVal = Number(discount_value);
      if (isNaN(numDiscountVal) || numDiscountVal <= 0) {
        return res.status(400).json({
          success: false,
          message: 'قيمة الخصم يجب أن تكون رقماً أكبر من صفر',
        });
      }
      if (discount_type === 'percentage' && numDiscountVal > 100) {
        return res.status(400).json({
          success: false,
          message: 'نسبة الخصم المئوية لا يمكن أن تتجاوز 100%',
        });
      }

      const parsedUsageLimit =
        usage_limit !== undefined && usage_limit !== null && String(usage_limit).trim() !== '' && Number(usage_limit) > 0
          ? parseInt(usage_limit, 10)
          : null;

      const parsedPerUserLimit =
        per_user_limit !== undefined && per_user_limit !== null && String(per_user_limit).trim() !== '' && Number(per_user_limit) > 0
          ? parseInt(per_user_limit, 10)
          : null;

      const parsedMaxDiscount =
        discount_type === 'percentage' && max_discount !== undefined && max_discount !== null && String(max_discount).trim() !== '' && Number(max_discount) > 0
          ? Number(max_discount)
          : null;

      const parsedMinOrderValue =
        min_order_value !== undefined && min_order_value !== null && String(min_order_value).trim() !== '' && Number(min_order_value) >= 0
          ? Number(min_order_value)
          : 0;

      const parsedExpiresAt =
        expires_at && String(expires_at).trim() !== '' ? new Date(expires_at) : null;

      const coupon = await Coupon.create({
        code: finalCode,
        name_ar: cleanNameAr,
        name_en: (name_en || cleanNameAr).trim(),
        description_ar: (description_ar || cleanNameAr).trim(),
        description_en: (description_en || name_en || cleanNameAr).trim(),
        discount_type,
        discount_value: numDiscountVal,
        max_discount: parsedMaxDiscount,
        min_order_value: parsedMinOrderValue,
        first_order_only: Boolean(first_order_only),
        usage_limit: parsedUsageLimit,
        per_user_limit: parsedPerUserLimit,
        used_count: 0,
        expires_at: parsedExpiresAt,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
      });

      return res.status(201).json({
        success: true,
        message: 'تم إنشاء الكوبون بنجاح',
        data: coupon,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCoupon(req, res, next) {
    try {
      const { id } = req.params;
      const coupon = await Coupon.findByPk(id);
      if (!coupon) {
        return res.status(404).json({ success: false, message: 'الكوبون غير موجود' });
      }

      const {
        name_ar,
        name_en,
        description_ar,
        description_en,
        code,
        discount_type,
        discount_value,
        max_discount,
        min_order_value,
        first_order_only,
        usage_limit,
        per_user_limit,
        expires_at,
        is_active,
      } = req.body;

      const cleanNameAr =
        name_ar !== undefined ? String(name_ar).trim() : coupon.name_ar || coupon.description_ar;
      if (!cleanNameAr) {
        return res.status(400).json({
          success: false,
          message: 'اسم الكوبون إجباري، يرجى إدخال اسم واضح للكوبون',
        });
      }

      let finalCode = coupon.code;
      if (code !== undefined) {
        finalCode = String(code).toUpperCase().trim().replace(/\s+/g, '');
        if (!/^[A-Z0-9]{3,50}$/.test(finalCode)) {
          return res.status(400).json({
            success: false,
            message: 'كود الكوبون يجب أن يتكون من 3 أحرف إنجليزية وأرقام على الأقل بدون رموز أو مسافات',
          });
        }

        if (finalCode !== coupon.code.toUpperCase()) {
          const duplicate = await Coupon.findOne({
            where: {
              code: { [Op.iLike]: finalCode },
              id: { [Op.ne]: coupon.id },
            },
          });
          if (duplicate) {
            return res.status(400).json({
              success: false,
              message: `كود الكوبون (${finalCode}) مستخدم بالفعل في كوبون آخر`,
            });
          }
        }
      }

      const finalDiscountType = discount_type || coupon.discount_type;
      if (!['percentage', 'fixed_amount'].includes(finalDiscountType)) {
        return res.status(400).json({
          success: false,
          message: 'نوع الخصم يجب أن يكون نسبة مئوية أو مبلغ ثابت',
        });
      }

      const numDiscountVal =
        discount_value !== undefined ? Number(discount_value) : Number(coupon.discount_value);
      if (isNaN(numDiscountVal) || numDiscountVal <= 0) {
        return res.status(400).json({
          success: false,
          message: 'قيمة الخصم يجب أن تكون رقماً أكبر من صفر',
        });
      }
      if (finalDiscountType === 'percentage' && numDiscountVal > 100) {
        return res.status(400).json({
          success: false,
          message: 'نسبة الخصم المئوية لا يمكن أن تتجاوز 100%',
        });
      }

      const parsedUsageLimit =
        usage_limit !== undefined
          ? usage_limit !== null && String(usage_limit).trim() !== '' && Number(usage_limit) > 0
            ? parseInt(usage_limit, 10)
            : null
          : coupon.usage_limit;

      const parsedPerUserLimit =
        per_user_limit !== undefined
          ? per_user_limit !== null && String(per_user_limit).trim() !== '' && Number(per_user_limit) > 0
            ? parseInt(per_user_limit, 10)
            : null
          : coupon.per_user_limit;

      const parsedMaxDiscount =
        finalDiscountType === 'percentage'
          ? max_discount !== undefined
            ? max_discount !== null && String(max_discount).trim() !== '' && Number(max_discount) > 0
              ? Number(max_discount)
              : null
            : coupon.max_discount
          : null;

      const parsedMinOrderValue =
        min_order_value !== undefined
          ? min_order_value !== null && String(min_order_value).trim() !== '' && Number(min_order_value) >= 0
            ? Number(min_order_value)
            : 0
          : coupon.min_order_value;

      const parsedExpiresAt =
        expires_at !== undefined
          ? expires_at && String(expires_at).trim() !== ''
            ? new Date(expires_at)
            : null
          : coupon.expires_at;

      const oldCode = coupon.code;
      await coupon.update({
        code: finalCode,
        name_ar: cleanNameAr,
        name_en: name_en !== undefined ? String(name_en || cleanNameAr).trim() : coupon.name_en,
        description_ar:
          description_ar !== undefined
            ? String(description_ar || cleanNameAr).trim()
            : cleanNameAr,
        description_en:
          description_en !== undefined
            ? String(description_en || name_en || cleanNameAr).trim()
            : coupon.description_en,
        discount_type: finalDiscountType,
        discount_value: numDiscountVal,
        max_discount: parsedMaxDiscount,
        min_order_value: parsedMinOrderValue,
        first_order_only:
          first_order_only !== undefined ? Boolean(first_order_only) : coupon.first_order_only,
        usage_limit: parsedUsageLimit,
        per_user_limit: parsedPerUserLimit,
        expires_at: parsedExpiresAt,
        is_active: is_active !== undefined ? Boolean(is_active) : coupon.is_active,
      });

      // Keep historical orders linked if coupon code was renamed
      if (oldCode && finalCode && oldCode.toUpperCase() !== finalCode.toUpperCase()) {
        await Order.update(
          { coupon_code: finalCode },
          { where: { coupon_code: { [Op.iLike]: oldCode } } }
        );
      }

      return res.status(200).json({
        success: true,
        message: 'تم تحديث بيانات الكوبون بنجاح',
        data: coupon,
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleCouponStatus(req, res, next) {
    try {
      const { id } = req.params;
      const coupon = await Coupon.findByPk(id);
      if (!coupon) {
        return res.status(404).json({ success: false, message: 'الكوبون غير موجود' });
      }
      const nextStatus =
        req.body.is_active !== undefined ? Boolean(req.body.is_active) : !coupon.is_active;
      await coupon.update({ is_active: nextStatus });

      return res.status(200).json({
        success: true,
        message: nextStatus ? 'تم تفعيل الكوبون بنجاح' : 'تم إيقاف الكوبون بنجاح',
        data: coupon,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCoupon(req, res, next) {
    try {
      const { id } = req.params;
      const coupon = await Coupon.findByPk(id);
      if (!coupon) {
        return res.status(404).json({ success: false, message: 'الكوبون غير موجود' });
      }
      await coupon.destroy();
      return res.status(200).json({
        success: true,
        message: 'تم حذف الكوبون بنجاح',
      });
    } catch (error) {
      next(error);
    }
  }

  static async validateCouponPublic(req, res, next) {
    try {
      const { code, customer_phone, subtotal = 0 } = req.body;
      const result = await FirstOrderDiscountService.validateAndApplyCoupon(
        code,
        customer_phone,
        Number(subtotal || 0)
      );
      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }
      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          code: result.coupon.code,
          name_ar: result.coupon.name_ar || result.coupon.description_ar,
          discount_type: result.coupon.discount_type,
          discount_value: Number(result.coupon.discount_value),
          discount_amount: result.discount_amount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // =================== CONTACT & NEWSLETTER ===================

  static async submitContact(req, res, next) {
    try {
      const { full_name, email, phone, message, locale } = req.body;
      const contact = await ContactMessage.create({
        full_name,
        email,
        phone,
        message,
        locale: locale || req.locale || 'ar',
      });
      return res.status(201).json({
        success: true,
        message: req.locale === 'en' ? 'Message sent successfully' : 'تم استلام رسالتكم بنجاح وسيتواصل معكم فريقنا قريباً',
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getContactMessages(req, res, next) {
    try {
      const messages = await ContactMessage.findAll({ order: [['created_at', 'DESC']] });
      return res.status(200).json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  }

  static async subscribeNewsletter(req, res, next) {
    try {
      const { email, locale } = req.body;
      if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

      const [, created] = await NewsletterSubscriber.findOrCreate({
        where: { email: email.toLowerCase().trim() },
        defaults: { locale: locale || req.locale || 'ar', is_active: true },
      });

      return res.status(200).json({
        success: true,
        message: req.locale === 'en' ? 'Subscribed successfully' : 'تم الاشتراك في النشرة البريدية بنجاح',
        is_new: created,
      });
    } catch (error) {
      next(error);
    }
  }

  // =================== STATIC PAGES & SETTINGS ===================

  static async getPageBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const page = await StaticPage.findOne({ where: { slug, is_published: true } });
      if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
      return res.status(200).json({ success: true, data: res.localize(page) });
    } catch (error) {
      next(error);
    }
  }

  static async getSiteSettings(req, res, next) {
    try {
      const settings = await SiteSetting.findAll();
      const formatted = {};
      const isEn = req.locale === 'en';

      for (const s of settings) {
        let val = s.setting_value_common;
        if (isEn && s.setting_value_en) {
          val = s.setting_value_en;
        } else if (!isEn && s.setting_value_ar) {
          val = s.setting_value_ar;
        }
        formatted[s.setting_key] = val;
      }

      return res.status(200).json({ success: true, data: formatted });
    } catch (error) {
      next(error);
    }
  }

  static async upsertSiteSetting(req, res, next) {
    try {
      const { setting_key, setting_value_ar, setting_value_en, setting_value_common, setting_group, settings } = req.body;

      if (Array.isArray(settings)) {
        for (const item of settings) {
          if (item && item.setting_key) {
            await SiteSetting.upsert({
              setting_key: item.setting_key,
              setting_value_ar: item.setting_value_ar || null,
              setting_value_en: item.setting_value_en || null,
              setting_value_common: item.setting_value_common !== undefined ? String(item.setting_value_common) : null,
              setting_group: item.setting_group || 'general',
            });
          }
        }
        return res.status(200).json({ success: true, message: 'Settings batch updated successfully' });
      }

      if (settings && typeof settings === 'object') {
        for (const [key, val] of Object.entries(settings)) {
          await SiteSetting.upsert({
            setting_key: key,
            setting_value_common: typeof val === 'object' ? JSON.stringify(val) : String(val),
            setting_group: setting_group || 'slider',
          });
        }
        return res.status(200).json({ success: true, message: 'Settings updated successfully' });
      }

      const [setting] = await SiteSetting.upsert({
        setting_key,
        setting_value_ar,
        setting_value_en,
        setting_value_common,
        setting_group: setting_group || 'general',
      });
      return res.status(200).json({ success: true, data: setting });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CmsController;
