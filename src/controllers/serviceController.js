const { Op } = require('sequelize');
const { Service } = require('../models');

// Helper to generate clean URL slug
function slugify(text) {
  if (!text) return `service-${Date.now()}`;
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0621-\u064A-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '') || `service-${Date.now()}`;
}

class ServiceController {
  /**
   * GET /api/v1/services
   * List all services (for admin table or storefront list)
   */
  static async getServices(req, res, next) {
    try {
      const { search, is_active, limit = 50, page = 1 } = req.query;
      const whereClause = {};

      if (is_active !== undefined && is_active !== 'all') {
        whereClause.is_active = is_active === 'true' || is_active === true;
      }

      if (search && search.trim()) {
        const query = `%${search.trim()}%`;
        whereClause[Op.or] = [
          { name_ar: { [Op.iLike]: query } },
          { name_en: { [Op.iLike]: query } },
          { short_desc_ar: { [Op.iLike]: query } },
          { short_desc_en: { [Op.iLike]: query } },
        ];
      }

      const offset = (Number(page) - 1) * Number(limit);

      const { rows: services, count } = await Service.findAndCountAll({
        where: whereClause,
        order: [
          ['sort_order', 'ASC'],
          ['created_at', 'DESC'],
        ],
        limit: Number(limit),
        offset,
      });

      return res.status(200).json({
        success: true,
        count,
        total_pages: Math.ceil(count / Number(limit)),
        page: Number(page),
        data: services,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/services/:identifier
   * Get single service by ID or Slug
   */
  static async getServiceById(req, res, next) {
    try {
      const { identifier } = req.params;
      const whereCondition = /^\d+$/.test(identifier)
        ? { id: identifier }
        : { slug: identifier };

      const service = await Service.findOne({ where: whereCondition });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'الخدمة غير موجودة',
        });
      }

      return res.status(200).json({
        success: true,
        data: service,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/services
   * Create new service
   */
  static async createService(req, res, next) {
    try {
      const {
        name_ar,
        name_en,
        slug,
        short_desc_ar,
        short_desc_en,
        details_ar,
        details_en,
        cover_image,
        theme_mode,
        preset_style,
        surface_finish,
        solid_color,
        gradient_color1,
        gradient_color2,
        gradient_angle,
        is_active,
        sort_order,
      } = req.body;

      if (!name_ar || !name_en) {
        return res.status(400).json({
          success: false,
          message: 'اسم الخدمة بالعربية والإنجليزية مطلوب',
        });
      }

      // Generate or sanitize slug
      let finalSlug = slugify(slug || name_en || name_ar);
      const existing = await Service.findOne({ where: { slug: finalSlug } });
      if (existing) {
        finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
      }

      const service = await Service.create({
        name_ar: name_ar.trim(),
        name_en: name_en.trim(),
        slug: finalSlug,
        short_desc_ar: short_desc_ar || '',
        short_desc_en: short_desc_en || '',
        details_ar: details_ar || '',
        details_en: details_en || '',
        cover_image: cover_image || null,
        theme_mode: theme_mode || 'preset',
        preset_style: preset_style || 'card-white-glass',
        surface_finish: surface_finish || 'glass',
        solid_color: solid_color || '#1d4ed8',
        gradient_color1: gradient_color1 || '#0284c7',
        gradient_color2: gradient_color2 || '#1d4ed8',
        gradient_angle: Number(gradient_angle) || 135,
        is_active: is_active !== undefined ? is_active : true,
        sort_order: Number(sort_order) || 0,
      });

      return res.status(201).json({
        success: true,
        message: 'تم إضافة الخدمة بنجاح',
        data: service,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/services/:id
   * Update service
   */
  static async updateService(req, res, next) {
    try {
      const { id } = req.params;
      const service = await Service.findByPk(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'الخدمة غير موجودة',
        });
      }

      const updateData = { ...req.body };
      if (updateData.slug) {
        updateData.slug = slugify(updateData.slug);
      }

      await service.update(updateData);

      return res.status(200).json({
        success: true,
        message: 'تم تحديث بيانات الخدمة بنجاح',
        data: service,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/services/:id/toggle
   * Toggle active status
   */
  static async toggleServiceStatus(req, res, next) {
    try {
      const { id } = req.params;
      const service = await Service.findByPk(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'الخدمة غير موجودة',
        });
      }

      service.is_active = !service.is_active;
      await service.save();

      return res.status(200).json({
        success: true,
        message: `تم ${service.is_active ? 'تفعيل' : 'تعطيل'} الخدمة بنجاح`,
        data: service,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/services/:id
   * Delete service
   */
  static async deleteService(req, res, next) {
    try {
      const { id } = req.params;
      const service = await Service.findByPk(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'الخدمة غير موجودة',
        });
      }

      await service.destroy();

      return res.status(200).json({
        success: true,
        message: 'تم حذف الخدمة بنجاح',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ServiceController;
