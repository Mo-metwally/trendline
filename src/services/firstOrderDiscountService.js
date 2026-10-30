const { Op } = require('sequelize');
const { Order, Coupon } = require('../models');

/**
 * Guest First-Order Verification Service
 * Validates eligibility for the 15% First-Order promotion using guest phone number.
 */
class FirstOrderDiscountService {
  /**
   * Check if a given phone number has any prior orders.
   * Excludes cancelled orders.
   * @param {string} phone 
   * @returns {Promise<boolean>} true if first order eligible
   */
  static async isEligibleForFirstOrderDiscount(phone) {
    if (!phone) return false;

    const formattedPhone = phone.trim();

    const previousOrdersCount = await Order.count({
      where: {
        customer_phone: formattedPhone,
        order_status: {
          [Op.ne]: 'cancelled',
        },
      },
    });

    return previousOrdersCount === 0;
  }

  /**
   * Validate a coupon against customer phone and cart subtotal.
   * @param {string} couponCode 
   * @param {string} phone 
   * @param {number} subtotal 
   * @returns {Promise<{valid: boolean, discount_amount: number, message: string}>}
   */
  static async validateAndApplyCoupon(couponCode, phone, subtotal) {
    if (!couponCode) {
      return { valid: false, discount_amount: 0, message: 'No coupon code provided' };
    }

    const coupon = await Coupon.findOne({
      where: {
        code: couponCode.toUpperCase().trim(),
        is_active: true,
      },
    });

    if (!coupon) {
      return { valid: false, discount_amount: 0, message: 'Invalid or inactive coupon code' };
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return { valid: false, discount_amount: 0, message: 'Coupon code has expired' };
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return { valid: false, discount_amount: 0, message: 'Coupon usage limit has been reached' };
    }

    // Check per_user_limit based on customer_phone in previous non-cancelled orders
    if (coupon.per_user_limit && Number(coupon.per_user_limit) > 0 && phone) {
      const formattedPhone = phone.trim();
      const customerCouponOrdersCount = await Order.count({
        where: {
          customer_phone: formattedPhone,
          coupon_code: { [Op.iLike]: coupon.code },
          order_status: { [Op.ne]: 'cancelled' },
        },
      });
      if (customerCouponOrdersCount >= Number(coupon.per_user_limit)) {
        return {
          valid: false,
          discount_amount: 0,
          message: `لقد وصلت للحد الأقصى المسموح به لاستخدام هذا الكوبون (${coupon.per_user_limit} مرة لهذا الرقم)`,
        };
      }
    }

    if (coupon.min_order_value && Number(subtotal) < Number(coupon.min_order_value)) {
      return {
        valid: false,
        discount_amount: 0,
        message: `Minimum order value for this coupon is EGP ${coupon.min_order_value}`,
      };
    }

    if (coupon.first_order_only) {
      const isFirst = await this.isEligibleForFirstOrderDiscount(phone);
      if (!isFirst) {
        return {
          valid: false,
          discount_amount: 0,
          message: 'This coupon is exclusively valid for your first order',
        };
      }
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (Number(subtotal) * Number(coupon.discount_value)) / 100;
      if (coupon.max_discount && discount > Number(coupon.max_discount)) {
        discount = Number(coupon.max_discount);
      }
    } else {
      discount = Number(coupon.discount_value);
    }

    return {
      valid: true,
      discount_amount: Math.min(discount, Number(subtotal)),
      coupon,
      message: 'Coupon applied successfully',
    };
  }
}

module.exports = FirstOrderDiscountService;
