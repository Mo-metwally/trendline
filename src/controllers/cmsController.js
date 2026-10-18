const {
  Banner,
  SpecialOfferCard,
  Coupon,
  StoreFeature,
  ContactMessage,
  NewsletterSubscriber,
  ShippingZone,
  StaticPage,
  SiteSetting,
} = require('../models');

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
      const banners = await Banner.findAll({
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

  static async getCoupons(req, res, next) {
    try {
      const coupons = await Coupon.findAll({ order: [['created_at', 'DESC']] });
      return res.status(200).json({ success: true, data: coupons });
    } catch (error) {
      next(error);
    }
  }

  static async createCoupon(req, res, next) {
    try {
      const coupon = await Coupon.create(req.body);
      return res.status(201).json({ success: true, data: coupon });
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
      const { setting_key, setting_value_ar, setting_value_en, setting_value_common, setting_group } = req.body;
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
