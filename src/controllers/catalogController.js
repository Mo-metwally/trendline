const { Op } = require('sequelize');
const {
  Product,
  Category,
  Brand,
  Tag,
  CategoryTag,
  ProductCategory,
  ProductTag,
  ProductImage,
  ProductReview,
  Bundle,
  BundleItem,
  sequelize,
} = require('../models');
const AutoCategorizationService = require('../services/autoCategorizationService');
const BundleService = require('../services/bundleService');
const {
  generateCategoryId,
  generateProductId,
  generateBundleId,
  generateProductSku,
  generateProductBarcodeEAN13,
  calculateEAN13CheckDigit,
} = require('../utils/idGenerator');

class CatalogController {
  // =================== PRODUCTS ===================

  /**
   * Auto-generate unique Product SKU & EAN-13 Barcode
   * GET /api/v1/catalog/products/generate-codes
   */
  static async generateProductCodes(req, res, next) {
    try {
      const { category_id, category_code } = req.query;
      let catCode = category_code || 'GEN';
      if (category_id && !category_code) {
        const cat = await Category.findByPk(category_id, { attributes: ['slug', 'id'] });
        if (cat?.slug) {
          catCode = cat.slug.slice(0, 4).toUpperCase();
        }
      }

      const sku = await generateProductSku({ Product }, catCode);
      const barcode = await generateProductBarcodeEAN13({ Product });

      return res.json({
        success: true,
        data: {
          sku,
          barcode,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Live uniqueness validator for SKU, Barcode, Slug, Name AR, Name EN
   * GET /api/v1/catalog/products/check-unique
   */
  static async checkProductUnique(req, res, next) {
    try {
      const { sku, barcode, slug, name_ar, name_en, exclude_id } = req.query;
      const conflicts = {};
      const baseWhere = exclude_id ? { id: { [Op.ne]: exclude_id } } : {};

      if (sku && sku.trim()) {
        const existsSku = await Product.findOne({
          where: { ...baseWhere, sku: sku.trim() },
          attributes: ['id', 'name_ar', 'name_en'],
        });
        if (existsSku) conflicts.sku = 'رمز SKU التعريفي مسجل مسبقاً لمنتج آخر';
      }

      if (barcode && barcode.trim()) {
        const existsBarcode = await Product.findOne({
          where: { ...baseWhere, barcode: barcode.trim() },
          attributes: ['id', 'name_ar', 'name_en'],
        });
        if (existsBarcode) conflicts.barcode = 'الباركود الدولي (EAN-13) مسجل مسبقاً لمنتج آخر';
      }

      if (slug && slug.trim()) {
        const existsSlug = await Product.findOne({
          where: { ...baseWhere, slug: slug.trim() },
          attributes: ['id'],
        });
        if (existsSlug) conflicts.slug = 'الرابط الدائم (Slug) مستخدم بالفعل لمنتج آخر';
      }

      if (name_ar && name_ar.trim()) {
        const existsNameAr = await Product.findOne({
          where: { ...baseWhere, name_ar: name_ar.trim() },
          attributes: ['id'],
        });
        if (existsNameAr) conflicts.name_ar = 'اسم المنتج بالعربية مسجل بالفعل لمنتج آخر';
      }

      if (name_en && name_en.trim()) {
        const existsNameEn = await Product.findOne({
          where: { ...baseWhere, name_en: name_en.trim() },
          attributes: ['id'],
        });
        if (existsNameEn) conflicts.name_en = 'اسم المنتج بالإنجليزية مسجل بالفعل لمنتج آخر';
      }

      const isUnique = Object.keys(conflicts).length === 0;
      return res.json({
        success: true,
        isUnique,
        conflicts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List Products with Filtering, Search & Pagination
   * GET /api/v1/catalog/products
   */
  static async getProducts(req, res, next) {
    try {
      const {
        search,
        category_id,
        brand_id,
        is_featured,
        is_active,
        stock_status,
        min_price,
        max_price,
        in_stock_only,
        on_sale_only,
        page = 1,
        limit = 12,
        sort = 'created_at_desc',
      } = req.query;

      const whereClause = {};
      const andConditions = [];

      // Filter by is_active status: 'true', 'false', or 'all'
      if (is_active !== undefined && is_active !== 'all') {
        whereClause.is_active = is_active === 'true' || is_active === true;
      } else if (is_active === undefined) {
        // Default to active only for storefront public view
        whereClause.is_active = true;
      }

      // Search across bilingual name, short desc, sku, barcode, and custom Base64 ID
      if (search && search.trim()) {
        const trimmed = search.trim();
        const query = `%${trimmed}%`;
        whereClause[Op.or] = [
          { id: trimmed },
          { name_ar: { [Op.iLike]: query } },
          { name_en: { [Op.iLike]: query } },
          { short_desc_ar: { [Op.iLike]: query } },
          { short_desc_en: { [Op.iLike]: query } },
          { sku: { [Op.iLike]: query } },
          { barcode: { [Op.iLike]: query } },
        ];
      }

      if (brand_id && brand_id !== 'all') whereClause.brand_id = brand_id;
      if (is_featured !== undefined && is_featured !== 'all') whereClause.is_featured = is_featured === 'true';

      // Effective Price filter (COALESCE(sale_price, original_price))
      if (min_price !== undefined && min_price !== '' && !Number.isNaN(Number(min_price))) {
        andConditions.push(
          sequelize.literal(`COALESCE("Product"."sale_price", "Product"."original_price") >= ${Number(min_price)}`)
        );
      }
      if (max_price !== undefined && max_price !== '' && !Number.isNaN(Number(max_price))) {
        andConditions.push(
          sequelize.literal(`COALESCE("Product"."sale_price", "Product"."original_price") <= ${Number(max_price)}`)
        );
      }

      // Stock status filter
      if (stock_status === 'in_stock') {
        andConditions.push(sequelize.literal('"Product"."stock_quantity" > "Product"."low_stock_threshold"'));
      } else if (stock_status === 'low_stock') {
        andConditions.push(
          sequelize.literal('"Product"."stock_quantity" > 0 AND "Product"."stock_quantity" <= "Product"."low_stock_threshold"')
        );
      } else if (stock_status === 'out_of_stock') {
        whereClause.stock_quantity = 0;
      } else if (in_stock_only === 'true') {
        andConditions.push(sequelize.literal('("Product"."stock_quantity" - "Product"."reserved_stock") > 0'));
      }

      // On sale / discounted filter
      if (on_sale_only === 'true') {
        andConditions.push(
          sequelize.literal(
            '(("Product"."sale_price" IS NOT NULL AND "Product"."sale_price" > 0 AND "Product"."sale_price" < "Product"."original_price") OR "Product"."discount_percent" > 0)'
          )
        );
      }

      // Category filter (supports root category + its subcategories safely with pagination)
      if (category_id && category_id !== 'all') {
        const targetCat = await Category.findOne({
          where: {
            [Op.or]: [
              { id: String(category_id) },
              { slug: String(category_id) },
            ],
          },
          include: [{ model: Category, as: 'subcategories', attributes: ['id'] }],
        });

        const matchingCatIds = targetCat
          ? [targetCat.id, ...(targetCat.subcategories || []).map((s) => s.id)]
          : [String(category_id)];

        const prodCatLinks = await ProductCategory.findAll({
          where: { category_id: { [Op.in]: matchingCatIds } },
          attributes: ['product_id'],
          raw: true,
        });

        const matchingProductIds = [...new Set(prodCatLinks.map((row) => row.product_id))];
        whereClause.id = { [Op.in]: matchingProductIds.length > 0 ? matchingProductIds : ['__NONE__'] };
      }

      if (andConditions.length > 0) {
        whereClause[Op.and] = andConditions;
      }

      // Comprehensive Sorting
      let order = [['created_at', 'DESC']];
      if (sort === 'created_at_desc') order = [['created_at', 'DESC']];
      if (sort === 'created_at_asc') order = [['created_at', 'ASC']];
      if (sort === 'price_asc') order = [[sequelize.literal('COALESCE("Product"."sale_price", "Product"."original_price")'), 'ASC']];
      if (sort === 'price_desc') order = [[sequelize.literal('COALESCE("Product"."sale_price", "Product"."original_price")'), 'DESC']];
      if (sort === 'discount_desc') order = [['discount_percent', 'DESC']];
      if (sort === 'stock_desc') order = [['stock_quantity', 'DESC']];
      if (sort === 'stock_asc') order = [['stock_quantity', 'ASC']];
      if (sort === 'rating') order = [['rating_avg', 'DESC']];
      if (sort === 'name_asc') order = [['name_ar', 'ASC']];
      if (sort === 'name_desc') order = [['name_ar', 'DESC']];

      const include = [
        { model: Brand, as: 'brand', attributes: ['id', 'name_ar', 'name_en', 'slug', 'logo_url'] },
        { model: ProductImage, as: 'images', attributes: ['id', 'image_url', 'alt_text_ar', 'alt_text_en', 'is_primary', 'sort_order'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name_ar', 'name_en', 'slug'], through: { attributes: [] } },
        {
          model: Category,
          as: 'categories',
          attributes: ['id', 'name_ar', 'name_en', 'slug', 'parent_id'],
          through: { attributes: ['is_primary', 'is_auto_assigned'] },
        },
      ];

      const safePage = Math.max(1, Number(page) || 1);
      const safeLimit = Math.max(1, Math.min(200, Number(limit) || 12));
      const offset = (safePage - 1) * safeLimit;

      const { count, rows } = await Product.findAndCountAll({
        where: whereClause,
        include,
        order,
        limit: safeLimit,
        offset,
        distinct: true,
      });

      const localizedRows = rows.map((p) => res.localize(p));

      return res.status(200).json({
        success: true,
        count,
        page: safePage,
        limit: safeLimit,
        total_pages: Math.max(1, Math.ceil(count / safeLimit)),
        data: localizedRows,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Single Product by Slug or ID
   * GET /api/v1/catalog/products/:identifier
   */
  static async getProductByIdentifier(req, res, next) {
    try {
      const { identifier } = req.params;

      const product = await Product.findOne({
        where: {
          [Op.or]: [
            { id: identifier },
            { slug: identifier },
          ],
        },
        include: [
          { model: Brand, as: 'brand' },
          {
            model: Category,
            as: 'categories',
            through: { attributes: ['is_primary', 'is_auto_assigned'] },
            include: [
              { model: Category, as: 'parent', attributes: ['id', 'name_ar', 'name_en', 'slug'] },
            ],
          },
          { model: Tag, as: 'tags', through: { attributes: [] } },
          { model: ProductImage, as: 'images' },
          {
            model: ProductReview,
            as: 'reviews',
            where: { is_approved: true },
            required: false,
          },
        ],
      });

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      const localized = res.localize(product);
      if (Array.isArray(localized.images)) {
        localized.images.sort((a, b) => {
          if (a.is_primary && !b.is_primary) return -1;
          if (!a.is_primary && b.is_primary) return 1;
          return (a.sort_order || 0) - (b.sort_order || 0);
        });
      }

      return res.status(200).json({
        success: true,
        data: localized,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create Product (Admin & ERP)
   * Automatically executes Hybrid Tag-to-Category synchronization
   * POST /api/v1/catalog/products
   */
  static async createProduct(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const {
        brand_id,
        name_ar,
        name_en,
        slug,
        sku,
        barcode,
        short_desc_ar,
        short_desc_en,
        description_ar,
        description_en,
        specifications,
        showcase_tabs,
        cost_price,
        original_price,
        sale_price,
        sale_ends_at,
        stock_quantity,
        low_stock_threshold = 5,
        is_featured,
        is_active,
        category_ids = [],
        primary_category_id,
        tag_ids = [],
        image_urls = [],
        video_urls = [],
      } = req.body;

      // Validate category requirement: at least one category is mandatory
      const allCategoryIds = Array.isArray(category_ids) && category_ids.length > 0
        ? category_ids
        : (primary_category_id ? [primary_category_id] : []);

      if (allCategoryIds.length === 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'يجب اختيار قسم واحد على الأقل للمنتج (Category is required)',
        });
      }

      const activePrimaryId = primary_category_id || allCategoryIds[0];

      let discount_percent = 0;
      if (sale_price && original_price && Number(original_price) > Number(sale_price)) {
        discount_percent = Math.round(((original_price - sale_price) / original_price) * 100);
      }

      // ================= UNICITY VALIDATION & AUTO-GENERATION =================
      // 1. Validate name_ar uniqueness
      if (name_ar && name_ar.trim()) {
        const dupNameAr = await Product.findOne({
          where: { name_ar: name_ar.trim() },
          attributes: ['id'],
          transaction: t,
        });
        if (dupNameAr) {
          await t.rollback();
          return res.status(409).json({
            success: false,
            field: 'name_ar',
            message: `اسم المنتج بالعربية "${name_ar.trim()}" مسجل مسبقاً لمنتج آخر! يرجى اختيار اسم غير مكرر.`,
          });
        }
      }

      // 2. Validate name_en uniqueness
      if (name_en && name_en.trim()) {
        const dupNameEn = await Product.findOne({
          where: { name_en: name_en.trim() },
          attributes: ['id'],
          transaction: t,
        });
        if (dupNameEn) {
          await t.rollback();
          return res.status(409).json({
            success: false,
            field: 'name_en',
            message: `اسم المنتج بالإنجليزية "${name_en.trim()}" مسجل مسبقاً لمنتج آخر (English name already exists)!`,
          });
        }
      }

      // 3. Validate slug uniqueness
      if (slug && slug.trim()) {
        const dupSlug = await Product.findOne({
          where: { slug: slug.trim() },
          attributes: ['id'],
          transaction: t,
        });
        if (dupSlug) {
          await t.rollback();
          return res.status(409).json({
            success: false,
            field: 'slug',
            message: `الرابط الدائم (Slug) "${slug.trim()}" مستخدم بالفعل لمنتج آخر!`,
          });
        }
      }

      // 4. SKU: Auto-generate if empty, otherwise validate uniqueness
      let finalSku = sku && sku.trim() ? sku.trim() : '';
      if (!finalSku) {
        let catCode = 'GEN';
        if (activePrimaryId) {
          const primCat = await Category.findByPk(activePrimaryId, { attributes: ['slug'], transaction: t });
          if (primCat?.slug) catCode = primCat.slug.slice(0, 4).toUpperCase();
        }
        finalSku = await generateProductSku({ Product }, catCode, t);
      } else {
        const dupSku = await Product.findOne({
          where: { sku: finalSku },
          attributes: ['id'],
          transaction: t,
        });
        if (dupSku) {
          await t.rollback();
          return res.status(409).json({
            success: false,
            field: 'sku',
            message: `رمز SKU التعريفي "${finalSku}" مسجل مسبقاً لمنتج آخر! يجب أن يكون كود SKU فريداً تماماً.`,
          });
        }
      }

      // 5. Barcode (EAN-13): Auto-generate if empty, otherwise validate uniqueness
      let finalBarcode = barcode && barcode.trim() ? barcode.trim() : '';
      if (!finalBarcode) {
        finalBarcode = await generateProductBarcodeEAN13({ Product }, t);
      } else {
        const dupBarcode = await Product.findOne({
          where: { barcode: finalBarcode },
          attributes: ['id'],
          transaction: t,
        });
        if (dupBarcode) {
          await t.rollback();
          return res.status(409).json({
            success: false,
            field: 'barcode',
            message: `الباركود الدولي (EAN-13) "${finalBarcode}" مسجل مسبقاً لمنتج آخر! يجب أن يكون الباركود فريداً تماماً.`,
          });
        }
      }

      const generatedId = await generateProductId({ Product }, t);

      const product = await Product.create({
        id: generatedId,
        brand_id: brand_id || null,
        name_ar,
        name_en,
        slug,
        sku: finalSku,
        barcode: finalBarcode,
        short_desc_ar: short_desc_ar || null,
        short_desc_en: short_desc_en || null,
        description_ar: description_ar || null,
        description_en: description_en || null,
        specifications: specifications || null,
        showcase_tabs: showcase_tabs || null,
        video_urls: Array.isArray(video_urls) ? video_urls : [],
        cost_price: cost_price || 0.00,
        original_price,
        sale_price: sale_price || null,
        sale_ends_at: sale_ends_at ? new Date(sale_ends_at) : null,
        discount_percent,
        stock_quantity: stock_quantity || 0,
        low_stock_threshold: low_stock_threshold || 5,
        is_featured: !!is_featured,
        is_active: is_active !== undefined ? !!is_active : true,
      }, { transaction: t });

      // Link All Assigned Categories (with primary designation)
      for (const catId of allCategoryIds) {
        await ProductCategory.findOrCreate({
          where: { product_id: product.id, category_id: catId },
          defaults: {
            product_id: product.id,
            category_id: catId,
            is_primary: String(catId) === String(activePrimaryId),
            is_auto_assigned: false,
          },
          transaction: t,
        });
      }

      // Link Explicit Tags
      for (const tagId of tag_ids) {
        await ProductTag.create({
          product_id: product.id,
          tag_id: tagId,
        }, { transaction: t });
      }

      // Save Images
      for (let i = 0; i < image_urls.length; i++) {
        const img = image_urls[i];
        await ProductImage.create({
          product_id: product.id,
          image_url: typeof img === 'string' ? img : img.image_url,
          alt_text_ar: img.alt_text_ar || name_ar,
          alt_text_en: img.alt_text_en || name_en,
          is_primary: i === 0,
          sort_order: i,
        }, { transaction: t });
      }

      // Execute Hybrid Tag-to-Category auto-linking
      if (activePrimaryId) {
        await AutoCategorizationService.copyCategoryTagsToProduct(product.id, activePrimaryId, t);
      } else if (tag_ids.length > 0) {
        await AutoCategorizationService.syncCategoriesFromTags(product.id, t);
      }

      await t.commit();

      const created = await Product.findByPk(product.id, {
        include: [
          { model: Category, as: 'categories' },
          { model: Tag, as: 'tags' },
          { model: ProductImage, as: 'images' },
        ],
      });

      return res.status(201).json({
        success: true,
        message: 'Product created and auto-categorized successfully',
        data: created,
      });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }

  /**
   * Update Existing Product (Admin & ERP Full Edit)
   * PUT /api/v1/catalog/products/:id
   */
  static async updateProduct(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const product = await Product.findByPk(id, { transaction: t });

      if (!product) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'المنتج غير موجود (Product not found)',
        });
      }

      const {
        brand_id,
        name_ar,
        name_en,
        slug,
        sku,
        barcode,
        short_desc_ar,
        short_desc_en,
        description_ar,
        description_en,
        specifications,
        showcase_tabs,
        cost_price,
        original_price,
        sale_price,
        sale_ends_at,
        stock_quantity,
        low_stock_threshold = 5,
        is_featured,
        is_active,
        category_ids = [],
        primary_category_id,
        tag_ids = [],
        image_urls,
        video_urls,
      } = req.body;

      const allCategoryIds =
        Array.isArray(category_ids) && category_ids.length > 0
          ? [...new Set(category_ids.map(String))]
          : primary_category_id
            ? [String(primary_category_id)]
            : [];

      if (allCategoryIds.length === 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'يجب اختيار قسم واحد على الأقل للمنتج (Category is required)',
        });
      }

      const activePrimaryId = String(primary_category_id || allCategoryIds[0]);

      let discount_percent = 0;
      const effectiveOriginal =
        original_price !== undefined ? Number(original_price) : Number(product.original_price);
      const effectiveSale =
        sale_price !== undefined ? (sale_price ? Number(sale_price) : null) : product.sale_price;

      if (effectiveSale && effectiveOriginal && effectiveOriginal > effectiveSale) {
        discount_percent = Math.round(((effectiveOriginal - effectiveSale) / effectiveOriginal) * 100);
      }

      // ================= UNICITY VALIDATION FOR UPDATE =================
      if (name_ar && name_ar.trim() && name_ar.trim() !== product.name_ar) {
        const dupNameAr = await Product.findOne({
          where: { id: { [Op.ne]: id }, name_ar: name_ar.trim() },
          attributes: ['id'],
          transaction: t,
        });
        if (dupNameAr) {
          await t.rollback();
          return res.status(409).json({
            success: false,
            field: 'name_ar',
            message: `اسم المنتج بالعربية "${name_ar.trim()}" مسجل مسبقاً لمنتج آخر!`,
          });
        }
      }

      if (name_en && name_en.trim() && name_en.trim() !== product.name_en) {
        const dupNameEn = await Product.findOne({
          where: { id: { [Op.ne]: id }, name_en: name_en.trim() },
          attributes: ['id'],
          transaction: t,
        });
        if (dupNameEn) {
          await t.rollback();
          return res.status(409).json({
            success: false,
            field: 'name_en',
            message: `اسم المنتج بالإنجليزية "${name_en.trim()}" مسجل مسبقاً لمنتج آخر!`,
          });
        }
      }

      if (slug && slug.trim() && slug.trim() !== product.slug) {
        const dupSlug = await Product.findOne({
          where: { id: { [Op.ne]: id }, slug: slug.trim() },
          attributes: ['id'],
          transaction: t,
        });
        if (dupSlug) {
          await t.rollback();
          return res.status(409).json({
            success: false,
            field: 'slug',
            message: `الرابط الدائم (Slug) "${slug.trim()}" مستخدم بالفعل لمنتج آخر!`,
          });
        }
      }

      let updatedSku = product.sku;
      if (sku !== undefined) {
        const cleanSku = sku ? sku.trim() : '';
        if (cleanSku && cleanSku !== product.sku) {
          const dupSku = await Product.findOne({
            where: { id: { [Op.ne]: id }, sku: cleanSku },
            attributes: ['id'],
            transaction: t,
          });
          if (dupSku) {
            await t.rollback();
            return res.status(409).json({
              success: false,
              field: 'sku',
              message: `رمز SKU التعريفي "${cleanSku}" مسجل مسبقاً لمنتج آخر!`,
            });
          }
          updatedSku = cleanSku;
        } else if (!cleanSku) {
          updatedSku = await generateProductSku({ Product }, 'GEN', t);
        }
      }

      let updatedBarcode = product.barcode;
      if (barcode !== undefined) {
        const cleanBarcode = barcode ? barcode.trim() : '';
        if (cleanBarcode && cleanBarcode !== product.barcode) {
          const dupBarcode = await Product.findOne({
            where: { id: { [Op.ne]: id }, barcode: cleanBarcode },
            attributes: ['id'],
            transaction: t,
          });
          if (dupBarcode) {
            await t.rollback();
            return res.status(409).json({
              success: false,
              field: 'barcode',
              message: `الباركود الدولي "${cleanBarcode}" مسجل مسبقاً لمنتج آخر!`,
            });
          }
          updatedBarcode = cleanBarcode;
        } else if (!cleanBarcode) {
          updatedBarcode = await generateProductBarcodeEAN13({ Product }, t);
        }
      }

      await product.update(
        {
          brand_id: brand_id !== undefined ? brand_id || null : product.brand_id,
          name_ar: name_ar !== undefined ? name_ar : product.name_ar,
          name_en: name_en !== undefined ? name_en : product.name_en,
          slug: slug !== undefined ? slug : product.slug,
          sku: updatedSku,
          barcode: updatedBarcode,
          short_desc_ar: short_desc_ar !== undefined ? short_desc_ar || null : product.short_desc_ar,
          short_desc_en: short_desc_en !== undefined ? short_desc_en || null : product.short_desc_en,
          description_ar:
            description_ar !== undefined ? description_ar || null : product.description_ar,
          description_en:
            description_en !== undefined ? description_en || null : product.description_en,
          specifications:
            specifications !== undefined ? specifications || null : product.specifications,
          showcase_tabs:
            showcase_tabs !== undefined ? showcase_tabs || null : product.showcase_tabs,
          video_urls: Array.isArray(video_urls) ? video_urls : product.video_urls || [],
          cost_price: cost_price !== undefined ? Number(cost_price) || 0 : product.cost_price,
          original_price: effectiveOriginal,
          sale_price: effectiveSale,
          sale_ends_at:
            sale_ends_at !== undefined
              ? sale_ends_at
                ? new Date(sale_ends_at)
                : null
              : product.sale_ends_at,
          discount_percent,
          stock_quantity:
            stock_quantity !== undefined ? Number(stock_quantity) || 0 : product.stock_quantity,
          low_stock_threshold:
            low_stock_threshold !== undefined
              ? Number(low_stock_threshold) || 5
              : product.low_stock_threshold,
          is_featured: is_featured !== undefined ? !!is_featured : product.is_featured,
          is_active: is_active !== undefined ? !!is_active : product.is_active,
        },
        { transaction: t }
      );

      // Sync Assigned Categories
      await ProductCategory.destroy({
        where: { product_id: product.id },
        transaction: t,
      });

      for (const catId of allCategoryIds) {
        await ProductCategory.findOrCreate({
          where: { product_id: product.id, category_id: catId },
          defaults: {
            product_id: product.id,
            category_id: catId,
            is_primary: String(catId) === activePrimaryId,
            is_auto_assigned: false,
          },
          transaction: t,
        });
      }

      // Sync Explicit Tags
      await ProductTag.destroy({
        where: { product_id: product.id },
        transaction: t,
      });

      const uniqueTagIds = [...new Set((Array.isArray(tag_ids) ? tag_ids : []).filter(Boolean))];
      for (const tagId of uniqueTagIds) {
        await ProductTag.findOrCreate({
          where: { product_id: product.id, tag_id: tagId },
          defaults: {
            product_id: product.id,
            tag_id: tagId,
          },
          transaction: t,
        });
      }

      // Sync Images if provided
      if (Array.isArray(image_urls)) {
        await ProductImage.destroy({
          where: { product_id: product.id },
          transaction: t,
        });

        for (let i = 0; i < image_urls.length; i++) {
          const img = image_urls[i];
          const urlStr = typeof img === 'string' ? img : img?.image_url;
          if (!urlStr) continue;
          await ProductImage.create(
            {
              product_id: product.id,
              image_url: urlStr,
              alt_text_ar: (typeof img === 'object' && img?.alt_text_ar) || product.name_ar,
              alt_text_en: (typeof img === 'object' && img?.alt_text_en) || product.name_en,
              is_primary: i === 0,
              sort_order: i,
            },
            { transaction: t }
          );
        }
      }

      // Execute Hybrid Tag-to-Category auto-linking
      if (activePrimaryId) {
        await AutoCategorizationService.copyCategoryTagsToProduct(product.id, activePrimaryId, t);
      }

      await t.commit();

      const updated = await Product.findByPk(product.id, {
        include: [
          { model: Brand, as: 'brand' },
          { model: Category, as: 'categories' },
          { model: Tag, as: 'tags' },
          { model: ProductImage, as: 'images' },
        ],
      });

      return res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: updated,
      });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }

  /**
   * Get Product Analytics / KPI counts for Admin
   * GET /api/v1/catalog/products/analytics
   */
  static async getProductAnalytics(req, res, next) {
    try {
      const totalCount = await Product.count();
      const activeCount = await Product.count({ where: { is_active: true } });
      const inactiveCount = await Product.count({ where: { is_active: false } });
      const featuredCount = await Product.count({ where: { is_featured: true } });

      const lowStockCount = await Product.count({
        where: sequelize.literal('stock_quantity > 0 AND stock_quantity <= low_stock_threshold'),
      });
      const outOfStockCount = await Product.count({
        where: { stock_quantity: 0 },
      });

      const [financials] = await sequelize.query(`
        SELECT 
          COALESCE(SUM(cost_price * stock_quantity), 0) AS total_cost_value,
          COALESCE(SUM(original_price * stock_quantity), 0) AS total_retail_value,
          COALESCE(SUM(stock_quantity), 0) AS total_inventory_units
        FROM products
      `);

      return res.status(200).json({
        success: true,
        data: {
          total: totalCount,
          active: activeCount,
          inactive: inactiveCount,
          featured: featuredCount,
          low_stock: lowStockCount,
          out_of_stock: outOfStockCount,
          inventory_units: Number(financials[0]?.total_inventory_units || 0),
          inventory_cost_value: Number(financials[0]?.total_cost_value || 0),
          inventory_retail_value: Number(financials[0]?.total_retail_value || 0),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle Product Active/Inactive Status
   * PATCH /api/v1/catalog/products/:id/toggle
   */
  static async toggleProductStatus(req, res, next) {
    try {
      const { id } = req.params;
      const product = await Product.findByPk(id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      await product.update({ is_active: !product.is_active });
      return res.status(200).json({ success: true, message: 'Status updated', data: product });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle Product Featured Status
   * PATCH /api/v1/catalog/products/:id/featured
   */
  static async toggleProductFeatured(req, res, next) {
    try {
      const { id } = req.params;
      const product = await Product.findByPk(id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      await product.update({ is_featured: !product.is_featured });
      return res.status(200).json({ success: true, message: 'Featured status updated', data: product });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Quick Update Product (Price, Sale Price, Stock, Flags)
   * PATCH /api/v1/catalog/products/:id/quick-update
   */
  static async quickUpdateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const { stock_quantity, original_price, sale_price, is_active, is_featured } = req.body;
      const product = await Product.findByPk(id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

      const updates = {};
      if (stock_quantity !== undefined) updates.stock_quantity = Number(stock_quantity);
      if (original_price !== undefined) updates.original_price = Number(original_price);
      if (sale_price !== undefined) {
        updates.sale_price = sale_price ? Number(sale_price) : null;
        if (updates.sale_price && (updates.original_price || product.original_price)) {
          const orig = updates.original_price || product.original_price;
          updates.discount_percent = Math.round(((orig - updates.sale_price) / orig) * 100);
        } else {
          updates.discount_percent = 0;
        }
      }
      if (is_active !== undefined) updates.is_active = !!is_active;
      if (is_featured !== undefined) updates.is_featured = !!is_featured;

      await product.update(updates);
      return res.status(200).json({ success: true, message: 'Product updated successfully', data: product });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete Product
   * DELETE /api/v1/catalog/products/:id
   */
  static async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const product = await Product.findByPk(id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      await product.destroy();
      return res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk Actions on Products (activate, deactivate, feature, unfeature, delete)
   * POST /api/v1/catalog/products/bulk-action
   */
  static async bulkProductAction(req, res, next) {
    try {
      const { action, product_ids = [] } = req.body;
      if (!Array.isArray(product_ids) || product_ids.length === 0) {
        return res.status(400).json({ success: false, message: 'No product IDs provided' });
      }

      if (action === 'activate') {
        await Product.update({ is_active: true }, { where: { id: product_ids } });
      } else if (action === 'deactivate') {
        await Product.update({ is_active: false }, { where: { id: product_ids } });
      } else if (action === 'feature') {
        await Product.update({ is_featured: true }, { where: { id: product_ids } });
      } else if (action === 'unfeature') {
        await Product.update({ is_featured: false }, { where: { id: product_ids } });
      } else if (action === 'delete') {
        await Product.destroy({ where: { id: product_ids } });
      } else {
        return res.status(400).json({ success: false, message: 'Invalid action' });
      }

      return res.status(200).json({ success: true, message: `Bulk action '${action}' applied successfully` });
    } catch (error) {
      next(error);
    }
  }

  // =================== CATEGORIES ===================

  /**
   * Get Hierarchical Category Tree
   * GET /api/v1/catalog/categories/tree
   */
  static async getCategoryTree(req, res, next) {
    try {
      const tree = await Category.findAll({
        where: { parent_id: null, is_active: true },
        include: [
          {
            model: Category,
            as: 'subcategories',
            where: { is_active: true },
            required: false,
            include: [{ model: Tag, as: 'tags', through: { attributes: [] } }],
          },
          { model: Tag, as: 'tags', through: { attributes: [] } },
        ],
        order: [
          ['sort_order', 'ASC'],
          [{ model: Category, as: 'subcategories' }, 'sort_order', 'ASC'],
        ],
      });

      return res.status(200).json({
        success: true,
        data: res.localize(tree),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Categories with their Latest 4 Products for Home Screen Grid
   * GET /api/v1/catalog/home-categories
   */
  static async getHomeCategories(req, res, next) {
    try {
      const catInclude = [
        {
          model: Product,
          as: 'products',
          where: { is_active: true },
          required: false,
          include: [{ model: ProductImage, as: 'images', required: false }],
        },
        {
          model: Category,
          as: 'subcategories',
          where: { is_active: true },
          required: false,
          include: [
            {
              model: Product,
              as: 'products',
              where: { is_active: true },
              required: false,
              include: [{ model: ProductImage, as: 'images', required: false }],
            },
          ],
        },
      ];

      let categories = await Category.findAll({
        where: { is_active: true, show_in_home_grid: true },
        order: [['sort_order', 'ASC'], ['id', 'ASC']],
        include: catInclude,
      });

      if (!categories || categories.length === 0) {
        categories = await Category.findAll({
          where: { is_active: true, parent_id: null },
          order: [['sort_order', 'ASC'], ['id', 'ASC']],
          limit: 6,
          include: catInclude,
        });
      }

      const data = categories.map((cat) => {
        const directProducts = cat.products || [];
        const subProducts = (cat.subcategories || []).flatMap((sub) => sub.products || []);
        const uniqueMap = new Map();
        [...directProducts, ...subProducts].forEach((p) => {
          if (p && p.id && !uniqueMap.has(p.id)) {
            uniqueMap.set(p.id, p);
          }
        });
        const sortedProducts = Array.from(uniqueMap.values()).sort(
          (a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0)
        );
        return {
          id: cat.id,
          name_ar: cat.name_ar,
          name_en: cat.name_en,
          slug: cat.slug,
          icon_url: cat.icon_url,
          image_url: cat.image_url,
          starting_price: cat.starting_price,
          sort_order: cat.sort_order,
          products: sortedProducts.slice(0, 4).map((p) => ({
            id: p.id,
            name_ar: p.name_ar,
            name_en: p.name_en,
            slug: p.slug,
            sale_price: p.sale_price,
            original_price: p.original_price,
            image: p.images?.find((img) => img.is_primary)?.image_url || p.images?.[0]?.image_url || '/assets/placeholder-tech.png',
          })),
        };
      });

      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create Category with Rule Tags
   * POST /api/v1/catalog/categories
   */
  static async createCategory(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const {
        parent_id,
        name_ar,
        name_en,
        slug,
        description_ar,
        description_en,
        icon_url,
        image_url,
        starting_price,
        show_in_home_grid,
        sort_order,
        tag_ids = [],
      } = req.body;

      const isSub = !!parent_id;
      const categoryId = await generateCategoryId(isSub, { Category }, t);

      const category = await Category.create({
        id: categoryId,
        parent_id: parent_id || null,
        name_ar,
        name_en,
        slug,
        description_ar,
        description_en,
        icon_url,
        image_url,
        starting_price,
        show_in_home_grid: !!show_in_home_grid,
        sort_order: sort_order || 0,
        is_active: true,
      }, { transaction: t });

      for (const tagId of tag_ids) {
        await CategoryTag.create({
          category_id: category.id,
          tag_id: tagId,
        }, { transaction: t });
      }

      // Support inline subcategories creation
      const { subcategories = [] } = req.body;
      if (Array.isArray(subcategories) && subcategories.length > 0) {
        for (const sub of subcategories) {
          if (sub.name_ar && sub.name_en) {
            const subSlug = sub.slug || sub.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            const subId = await generateCategoryId(true, { Category }, t);
            const createdSub = await Category.create({
              id: subId,
              parent_id: category.id,
              name_ar: sub.name_ar,
              name_en: sub.name_en,
              slug: subSlug,
              description_ar: sub.description_ar || null,
              description_en: sub.description_en || null,
              icon_url: sub.icon_url || null,
              starting_price: sub.starting_price || null,
              sort_order: sub.sort_order || 0,
              show_in_home_grid: !!sub.show_in_home_grid,
              is_active: true,
            }, { transaction: t });

            if (Array.isArray(sub.tag_ids)) {
              for (const tid of sub.tag_ids) {
                await CategoryTag.create({ category_id: createdSub.id, tag_id: tid }, { transaction: t });
              }
            }
          }
        }
      }

      await t.commit();

      const created = await Category.findByPk(category.id, {
        include: [
          { model: Category, as: 'parent' },
          { model: Tag, as: 'tags', through: { attributes: [] } },
        ],
      });

      return res.status(201).json({
        success: true,
        message: 'Category created successfully with tag mapping rules',
        data: created,
      });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }

  /**
   * Get All Categories with full admin & storefront details (flat & hierarchical)
   * GET /api/v1/catalog/categories
   */
  static async getAllCategories(req, res, next) {
    try {
      const categories = await Category.findAll({
        include: [
          { model: Category, as: 'parent', attributes: ['id', 'name_ar', 'name_en', 'slug'] },
          {
            model: Category,
            as: 'subcategories',
            attributes: ['id', 'name_ar', 'name_en', 'slug', 'is_active', 'starting_price', 'icon_url', 'image_url', 'description_ar', 'description_en', 'sort_order'],
          },
          { model: Tag, as: 'tags', through: { attributes: [] } },
          { model: Product, as: 'products', attributes: ['id'] },
        ],
        order: [
          ['parent_id', 'ASC NULLS FIRST'],
          ['sort_order', 'ASC'],
          ['name_ar', 'ASC'],
        ],
      });

      // Map category ID -> Set of product IDs for accurate rollup on root categories
      const catProductIdsMap = new Map();
      categories.forEach((cat) => {
        const set = new Set((cat.products || []).map((p) => p.id));
        catProductIdsMap.set(cat.id, set);
      });

      const formatted = categories.map((cat) => {
        const json = cat.toJSON();
        const directSet = new Set(catProductIdsMap.get(cat.id) || []);
        const directCount = directSet.size;

        if (Array.isArray(json.subcategories) && json.subcategories.length > 0) {
          json.subcategories = json.subcategories.map((sub) => {
            const subSet = catProductIdsMap.get(sub.id) || new Set();
            subSet.forEach((pid) => directSet.add(pid));
            return {
              ...sub,
              products_count: subSet.size,
            };
          });
        }

        json.direct_products_count = directCount;
        json.products_count = directSet.size;
        delete json.products;
        return json;
      });

      return res.status(200).json({
        success: true,
        count: formatted.length,
        data: formatted,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Single Category by ID or Slug
   * GET /api/v1/catalog/categories/:id
   */
  static async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await Category.findOne({
        where: {
          [Op.or]: [
            { id: String(id) },
            { slug: String(id) },
          ],
        },
        include: [
          {
            model: Category,
            as: 'parent',
            attributes: ['id', 'name_ar', 'name_en', 'slug', 'icon_url', 'image_url'],
            include: [
              {
                model: Category,
                as: 'subcategories',
                attributes: ['id', 'name_ar', 'name_en', 'slug', 'is_active', 'starting_price', 'icon_url', 'image_url', 'sort_order'],
              },
            ],
          },
          {
            model: Category,
            as: 'subcategories',
            attributes: ['id', 'name_ar', 'name_en', 'slug', 'is_active', 'starting_price', 'icon_url', 'image_url', 'description_ar', 'description_en', 'sort_order'],
            include: [
              { model: Product, as: 'products', attributes: ['id'] },
            ],
          },
          { model: Tag, as: 'tags', through: { attributes: [] } },
          { model: Product, as: 'products', attributes: ['id'] },
        ],
      });
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      const json = category.toJSON();
      const allProductIds = new Set((json.products || []).map((p) => p.id));
      if (Array.isArray(json.subcategories)) {
        json.subcategories = json.subcategories.map((sub) => {
          const subIds = (sub.products || []).map((p) => p.id);
          subIds.forEach((pid) => allProductIds.add(pid));
          const { products, ...restSub } = sub;
          return {
            ...restSub,
            products_count: subIds.length,
          };
        });
      }
      json.products_count = allProductIds.size;
      delete json.products;

      return res.status(200).json({ success: true, data: json });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Category
   * PUT /api/v1/catalog/categories/:id
   */
  static async updateCategory(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const {
        parent_id,
        name_ar,
        name_en,
        slug,
        description_ar,
        description_en,
        icon_url,
        image_url,
        starting_price,
        show_in_home_grid,
        sort_order,
        is_active,
        tag_ids,
      } = req.body;

      const category = await Category.findByPk(id, { transaction: t });
      if (!category) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      // Prevent category from being its own parent
      if (parent_id && String(parent_id) === String(id)) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Category cannot be its own parent' });
      }

      await category.update({
        parent_id: parent_id !== undefined ? (parent_id ? parent_id : null) : category.parent_id,
        name_ar: name_ar || category.name_ar,
        name_en: name_en || category.name_en,
        slug: slug || category.slug,
        description_ar: description_ar !== undefined ? description_ar : category.description_ar,
        description_en: description_en !== undefined ? description_en : category.description_en,
        icon_url: icon_url !== undefined ? icon_url : category.icon_url,
        image_url: image_url !== undefined ? image_url : category.image_url,
        starting_price: starting_price !== undefined ? starting_price : category.starting_price,
        show_in_home_grid: show_in_home_grid !== undefined ? !!show_in_home_grid : category.show_in_home_grid,
        sort_order: sort_order !== undefined ? Number(sort_order) : category.sort_order,
        is_active: is_active !== undefined ? !!is_active : category.is_active,
      }, { transaction: t });

      // Update Tag mappings if provided
      if (Array.isArray(tag_ids)) {
        await CategoryTag.destroy({ where: { category_id: id }, transaction: t });
        for (const tagId of tag_ids) {
          await CategoryTag.create({
            category_id: id,
            tag_id: tagId,
          }, { transaction: t });
        }
      }

      // Handle subcategories creation/updating if provided
      const { subcategories } = req.body;
      if (Array.isArray(subcategories)) {
        for (const sub of subcategories) {
          if (sub.name_ar && sub.name_en) {
            const subSlug = sub.slug || sub.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            if (sub.id) {
              await Category.update({
                name_ar: sub.name_ar,
                name_en: sub.name_en,
                slug: subSlug,
                starting_price: sub.starting_price || null,
              }, { where: { id: sub.id, parent_id: id }, transaction: t });
            } else {
              const subId = await generateCategoryId(true, { Category }, t);
              await Category.create({
                id: subId,
                parent_id: id,
                name_ar: sub.name_ar,
                name_en: sub.name_en,
                slug: subSlug,
                starting_price: sub.starting_price || null,
                is_active: true,
              }, { transaction: t });
            }
          }
        }
      }

      await t.commit();

      const updated = await Category.findByPk(id, {
        include: [
          { model: Category, as: 'parent' },
          { model: Tag, as: 'tags', through: { attributes: [] } },
        ],
      });

      return res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: updated,
      });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }

  /**
   * Delete Category
   * DELETE /api/v1/catalog/categories/:id
   */
  static async deleteCategory(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const category = await Category.findByPk(id, { transaction: t });
      if (!category) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      // Check if subcategories exist, reassign them to parent or null
      await Category.update(
        { parent_id: category.parent_id || null },
        { where: { parent_id: id }, transaction: t }
      );

      // Remove tag mappings
      await CategoryTag.destroy({ where: { category_id: id }, transaction: t });

      // Delete the category
      await category.destroy({ transaction: t });

      await t.commit();

      return res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }

  /**
   * Toggle Category Status
   * PATCH /api/v1/catalog/categories/:id/toggle
   */
  static async toggleCategoryStatus(req, res, next) {
    try {
      const { id } = req.params;
      const category = await Category.findByPk(id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      const newState = !category.is_active;
      await category.update({ is_active: newState });

      return res.status(200).json({
        success: true,
        message: `Category ${newState ? 'activated' : 'deactivated'} successfully`,
        data: { id: category.id, is_active: newState },
      });
    } catch (error) {
      next(error);
    }
  }

  // =================== BRANDS & TAGS ===================

  static async getBrands(req, res, next) {
    try {
      const { all } = req.query;
      const where = {};
      if (all !== 'true') {
        where.is_active = true;
      }
      const brands = await Brand.findAll({
        where,
        include: [
          {
            model: Product,
            as: 'products',
            attributes: ['id'],
          },
        ],
        order: [['sort_order', 'ASC'], ['name_en', 'ASC'], ['id', 'DESC']],
      });

      const formatted = brands.map((b) => {
        const json = b.toJSON();
        json.products_count = json.products ? json.products.length : 0;
        delete json.products;
        return json;
      });

      return res.status(200).json({ success: true, count: formatted.length, data: formatted });
    } catch (error) {
      next(error);
    }
  }

  static async createBrand(req, res, next) {
    try {
      const { name_ar, name_en, slug, logo_url, description_ar, description_en, website_url, is_featured, is_active, sort_order } = req.body;
      if (!name_ar || !name_en) {
        return res.status(400).json({ success: false, message: 'Both Arabic and English brand names are required' });
      }
      const finalLogo = logo_url || '/icons/category-default.svg';
      const brandSlug = slug || name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const brand = await Brand.create({
        name_ar: name_ar.trim(),
        name_en: name_en.trim(),
        slug: brandSlug,
        logo_url: finalLogo,
        description_ar: description_ar || null,
        description_en: description_en || null,
        website_url: website_url || null,
        is_featured: !!is_featured,
        is_active: is_active !== undefined ? !!is_active : true,
        sort_order: Number(sort_order) || 0,
      });
      return res.status(201).json({ success: true, data: brand });
    } catch (error) {
      next(error);
    }
  }

  static async updateBrand(req, res, next) {
    try {
      const { id } = req.params;
      const brand = await Brand.findByPk(id);
      if (!brand) {
        return res.status(404).json({ success: false, message: 'Brand not found' });
      }
      const { name_ar, name_en, slug, logo_url, description_ar, description_en, website_url, is_featured, is_active, sort_order } = req.body;
      const updateData = {};
      if (name_ar !== undefined) updateData.name_ar = name_ar.trim();
      if (name_en !== undefined) updateData.name_en = name_en.trim();
      if (slug !== undefined) updateData.slug = slug.trim();
      if (logo_url !== undefined) updateData.logo_url = logo_url;
      if (description_ar !== undefined) updateData.description_ar = description_ar;
      if (description_en !== undefined) updateData.description_en = description_en;
      if (website_url !== undefined) updateData.website_url = website_url;
      if (is_featured !== undefined) updateData.is_featured = !!is_featured;
      if (is_active !== undefined) updateData.is_active = !!is_active;
      if (sort_order !== undefined) updateData.sort_order = Number(sort_order);

      await brand.update(updateData);
      return res.status(200).json({ success: true, message: 'Brand updated successfully', data: brand });
    } catch (error) {
      next(error);
    }
  }

  static async deleteBrand(req, res, next) {
    try {
      const { id } = req.params;
      const brand = await Brand.findByPk(id);
      if (!brand) {
        return res.status(404).json({ success: false, message: 'Brand not found' });
      }
      // Check if products are tied to this brand
      const productsCount = await Product.count({ where: { brand_id: id } });
      if (productsCount > 0) {
        // Disassociate products from this brand
        await Product.update({ brand_id: null }, { where: { brand_id: id } });
      }
      await brand.destroy();
      return res.status(200).json({ success: true, message: 'Brand deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getTags(req, res, next) {
    try {
      const include = [
        { model: Category, as: 'categories', attributes: ['id', 'name_ar', 'name_en', 'slug'], through: { attributes: [] } },
        { model: Product, as: 'products', attributes: ['id'], through: { attributes: [] } },
      ];

      const tags = await Tag.findAll({
        include,
        order: [['id', 'DESC']],
      });

      const formatted = tags.map((t) => {
        const json = t.toJSON();
        json.categories_count = json.categories ? json.categories.length : 0;
        json.products_count = json.products ? json.products.length : 0;
        delete json.products;
        return json;
      });

      return res.status(200).json({ success: true, count: formatted.length, data: formatted });
    } catch (error) {
      next(error);
    }
  }

  static async createTag(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { name_ar, name_en, slug, category_ids = [] } = req.body;
      if (!name_ar || !name_en) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'Both Arabic and English tag names are required' });
      }
      const tagSlug = slug || name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const [tag, created] = await Tag.findOrCreate({
        where: { slug: tagSlug },
        defaults: { name_ar: name_ar.trim(), name_en: name_en.trim(), slug: tagSlug },
        transaction: t,
      });

      // Link categories if provided
      if (Array.isArray(category_ids) && category_ids.length > 0) {
        for (const catId of category_ids) {
          await CategoryTag.findOrCreate({
            where: { category_id: catId, tag_id: tag.id },
            transaction: t,
          });
        }
      }

      await t.commit();
      return res.status(201).json({ success: true, data: tag, isNew: created });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }

  static async updateTag(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { name_ar, name_en, slug, category_ids } = req.body;

      const tag = await Tag.findByPk(id, { transaction: t });
      if (!tag) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Tag not found' });
      }

      const updateData = {};
      if (name_ar) updateData.name_ar = name_ar.trim();
      if (name_en) updateData.name_en = name_en.trim();
      if (slug) updateData.slug = slug.trim();

      await tag.update(updateData, { transaction: t });

      if (Array.isArray(category_ids)) {
        await CategoryTag.destroy({ where: { tag_id: id }, transaction: t });
        for (const catId of category_ids) {
          await CategoryTag.create({ category_id: catId, tag_id: id }, { transaction: t });
        }
      }

      await t.commit();

      const updated = await Tag.findByPk(id, {
        include: [
          { model: Category, as: 'categories', attributes: ['id', 'name_ar', 'name_en', 'slug'], through: { attributes: [] } },
          { model: Product, as: 'products', attributes: ['id'], through: { attributes: [] } },
        ],
      });

      const json = updated.toJSON();
      json.categories_count = json.categories ? json.categories.length : 0;
      json.products_count = json.products ? json.products.length : 0;
      delete json.products;

      return res.status(200).json({ success: true, message: 'Tag updated successfully', data: json });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }

  static async deleteTag(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const tag = await Tag.findByPk(id, { transaction: t });
      if (!tag) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Tag not found' });
      }

      await CategoryTag.destroy({ where: { tag_id: id }, transaction: t });
      await ProductTag.destroy({ where: { tag_id: id }, transaction: t });
      await tag.destroy({ transaction: t });

      await t.commit();
      return res.status(200).json({ success: true, message: 'Tag deleted successfully' });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }

  static async bulkCreateTags(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { tags = [] } = req.body;
      const createdTags = [];

      for (const item of tags) {
        if (item.name_ar && item.name_en) {
          const tagSlug = item.slug || item.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          const [tag] = await Tag.findOrCreate({
            where: { slug: tagSlug },
            defaults: { name_ar: item.name_ar.trim(), name_en: item.name_en.trim(), slug: tagSlug },
            transaction: t,
          });
          createdTags.push(tag);
        }
      }

      await t.commit();
      return res.status(201).json({ success: true, count: createdTags.length, data: createdTags });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }

  // =================== BUNDLES ===================

  /**
   * Helper to format and enrich a Bundle instance with real-time pricing, discount validity, and stock
   */
  static async formatBundleResponse(bundleInstance) {
    const plain = typeof bundleInstance.toJSON === 'function' ? bundleInstance.toJSON() : bundleInstance;
    const items = Array.isArray(plain.items) ? plain.items : [];

    let computedOriginalTotal = 0;
    let minAvailable = items.length > 0 ? Infinity : 0;

    const enrichedItems = items
      .filter((it) => it && it.product)
      .map((it) => {
        const prod = it.product;
        const unitSellingPrice = Number(prod.sale_price || prod.original_price || 0);
        const qty = Math.max(1, Number(it.quantity || 1));
        const lineTotal = unitSellingPrice * qty;
        computedOriginalTotal += lineTotal;

        const ats = Math.max(0, Number(prod.stock_quantity || 0) - Number(prod.reserved_stock || 0));
        const possible = Math.floor(ats / qty);
        if (possible < minAvailable) minAvailable = possible;

        const primaryImage =
          prod.images?.find((img) => img.is_primary)?.image_url ||
          prod.images?.[0]?.image_url ||
          '/assets/placeholder-tech.png';

        return {
          id: it.id,
          product_id: prod.id,
          quantity: qty,
          unit_price: unitSellingPrice,
          line_total: lineTotal,
          product: {
            ...prod,
            unit_selling_price: unitSellingPrice,
            primary_image: primaryImage,
          },
        };
      });

    const originalTotal = computedOriginalTotal > 0 ? computedOriginalTotal : Number(plain.original_total_price || 0);
    const savedBundlePrice = Number(plain.bundle_price || originalTotal);
    const savedDiscountPercent = Number(plain.discount_percent || 0);

    const now = new Date();
    const isDiscountExpired = plain.expires_at ? new Date(plain.expires_at) < now : false;
    const hasConfiguredDiscount = savedDiscountPercent > 0 || (savedBundlePrice > 0 && savedBundlePrice < originalTotal);
    const isDiscountActive = hasConfiguredDiscount && !isDiscountExpired;

    let effectiveBundlePrice = originalTotal;
    if (isDiscountActive) {
      if (savedBundlePrice > 0 && savedBundlePrice < originalTotal) {
        effectiveBundlePrice = savedBundlePrice;
      } else if (savedDiscountPercent > 0) {
        effectiveBundlePrice = Math.round(originalTotal * (1 - savedDiscountPercent / 100));
      }
    }

    const savingsAmount = Math.max(0, originalTotal - effectiveBundlePrice);
    const effectiveDiscountPercent =
      originalTotal > 0 && savingsAmount > 0
        ? Math.round((savingsAmount / originalTotal) * 100)
        : 0;

    return {
      ...plain,
      items: enrichedItems,
      products_count: enrichedItems.length,
      computed_original_total: originalTotal,
      effective_bundle_price: effectiveBundlePrice,
      savings_amount: savingsAmount,
      effective_discount_percent: effectiveDiscountPercent,
      has_discount: hasConfiguredDiscount,
      is_discount_expired: isDiscountExpired,
      is_discount_active: isDiscountActive,
      dynamic_available_stock: minAvailable === Infinity ? 0 : minAvailable,
    };
  }

  /**
   * Get Bundles with dynamically computed component stocks & prices
   * Supports ?all=true (admin) and ?product_id=XXX (storefront product page)
   * GET /api/v1/catalog/bundles
   */
  static async getBundles(req, res, next) {
    try {
      const { all, product_id, search } = req.query;
      const whereClause = {};

      if (all !== 'true') {
        whereClause.is_active = true;
      }

      if (search && search.trim()) {
        const q = `%${search.trim()}%`;
        whereClause[Op.or] = [
          { id: { [Op.iLike]: q } },
          { name_ar: { [Op.iLike]: q } },
          { name_en: { [Op.iLike]: q } },
          { sku: { [Op.iLike]: q } },
        ];
      }

      const bundles = await Bundle.findAll({
        where: whereClause,
        include: [
          {
            model: BundleItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: [
                  'id',
                  'name_ar',
                  'name_en',
                  'slug',
                  'sku',
                  'original_price',
                  'sale_price',
                  'discount_percent',
                  'stock_quantity',
                  'reserved_stock',
                  'is_active',
                ],
                include: [
                  { model: ProductImage, as: 'images' },
                  { model: Brand, as: 'brand', attributes: ['id', 'name_ar', 'name_en', 'slug'] },
                ],
              },
            ],
          },
          { model: Category, as: 'categories', through: { attributes: [] } },
        ],
        order: [['createdAt', 'DESC']],
      });

      let formattedBundles = await Promise.all(
        bundles.map((b) => CatalogController.formatBundleResponse(b))
      );

      // Filter by product_id if requested (returns all bundles containing this product)
      if (product_id) {
        formattedBundles = formattedBundles.filter(
          (b) =>
            b.items &&
            b.items.length > 0 &&
            b.items.some((it) => String(it.product_id) === String(product_id))
        );
      }

      return res.status(200).json({
        success: true,
        count: formattedBundles.length,
        data: formattedBundles,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Single Bundle by ID or Slug
   * GET /api/v1/catalog/bundles/:id
   */
  static async getBundleById(req, res, next) {
    try {
      const { id } = req.params;
      const bundle = await Bundle.findOne({
        where: {
          [Op.or]: [{ id: String(id) }, { slug: String(id) }],
        },
        include: [
          {
            model: BundleItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                include: [
                  { model: ProductImage, as: 'images' },
                  { model: Brand, as: 'brand' },
                ],
              },
            ],
          },
          { model: Category, as: 'categories', through: { attributes: [] } },
        ],
      });

      if (!bundle) {
        return res.status(404).json({ success: false, message: 'Bundle not found' });
      }

      const formatted = await CatalogController.formatBundleResponse(bundle);
      return res.status(200).json({ success: true, data: formatted });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create Bundle
   * Mandatory: name_ar (or name). Auto-generates unique Bundle ID.
   * Optional: discount (percentage, fixed amount, or bundle_price) & expires_at.
   * POST /api/v1/catalog/bundles
   */
  static async createBundle(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const {
        name,
        name_ar,
        name_en,
        slug,
        sku,
        description_ar,
        description_en,
        image_url,
        discount_type = 'percentage', // 'percentage' | 'fixed' | 'custom_price' | 'none'
        discount_value,
        discount_percent,
        bundle_price,
        is_featured,
        is_active = true,
        starts_at,
        expires_at,
        category_ids = [],
        items = [], // [{ product_id, quantity }]
      } = req.body;

      const finalNameAr = (name_ar || name || '').trim();
      if (!finalNameAr) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'اسم الباندل إجباري (Bundle name is required)',
        });
      }
      const finalNameEn = (name_en || finalNameAr).trim();

      if (!Array.isArray(items) || items.length === 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'يجب اختيار منتج واحد على الأقل داخل الباندل',
        });
      }

      // Deduplicate products inside the same bundle
      const uniqueItemsMap = new Map();
      for (const it of items) {
        if (it && it.product_id) {
          const pid = String(it.product_id);
          const qty = Math.max(1, Number(it.quantity || 1));
          uniqueItemsMap.set(pid, { product_id: pid, quantity: qty });
        }
      }
      const cleanItems = Array.from(uniqueItemsMap.values());

      // Compute original total price from component products' active store prices
      let originalTotal = 0;
      let firstProductImage = null;

      for (const it of cleanItems) {
        const prod = await Product.findByPk(it.product_id, {
          include: [{ model: ProductImage, as: 'images' }],
          transaction: t,
        });
        if (!prod) {
          await t.rollback();
          return res.status(404).json({
            success: false,
            message: `المنتج ذو المعرف (${it.product_id}) غير موجود`,
          });
        }
        const unitPrice = Number(prod.sale_price || prod.original_price || 0);
        originalTotal += unitPrice * it.quantity;

        if (!firstProductImage && prod.images?.length > 0) {
          firstProductImage =
            prod.images.find((img) => img.is_primary)?.image_url || prod.images[0]?.image_url;
        }
      }

      // Calculate Optional Discount
      let finalBundlePrice = originalTotal;
      let finalDiscountPercent = 0;

      if (discount_type === 'percentage' && Number(discount_value) > 0) {
        finalDiscountPercent = Math.min(99, Math.max(0, Math.round(Number(discount_value))));
        finalBundlePrice = Math.round(originalTotal * (1 - finalDiscountPercent / 100));
      } else if (discount_type === 'fixed' && Number(discount_value) > 0) {
        const fixedOff = Math.min(originalTotal, Math.max(0, Number(discount_value)));
        finalBundlePrice = Math.max(0, originalTotal - fixedOff);
        finalDiscountPercent =
          originalTotal > 0 ? Math.round(((originalTotal - finalBundlePrice) / originalTotal) * 100) : 0;
      } else if (
        (discount_type === 'custom_price' || bundle_price !== undefined) &&
        bundle_price !== '' &&
        bundle_price !== null &&
        Number(bundle_price) > 0 &&
        Number(bundle_price) < originalTotal
      ) {
        finalBundlePrice = Number(bundle_price);
        finalDiscountPercent =
          originalTotal > 0 ? Math.round(((originalTotal - finalBundlePrice) / originalTotal) * 100) : 0;
      } else if (discount_percent !== undefined && Number(discount_percent) > 0) {
        finalDiscountPercent = Math.min(99, Math.max(0, Math.round(Number(discount_percent))));
        finalBundlePrice = Math.round(originalTotal * (1 - finalDiscountPercent / 100));
      }

      // Generate Unique Bundle ID
      const generatedId = await generateBundleId({ Bundle }, t);
      const generatedSlug =
        slug && slug.trim()
          ? `${slug.trim()}-${generatedId.toLowerCase()}`
          : `bundle-${generatedId.toLowerCase()}`;
      const generatedSku = sku && sku.trim() ? sku.trim() : generatedId;

      const bundle = await Bundle.create(
        {
          id: generatedId,
          name_ar: finalNameAr,
          name_en: finalNameEn,
          slug: generatedSlug,
          sku: generatedSku,
          description_ar: description_ar || null,
          description_en: description_en || null,
          image_url: image_url || firstProductImage || '/assets/placeholder-tech.png',
          original_total_price: originalTotal,
          bundle_price: finalBundlePrice,
          discount_percent: finalDiscountPercent,
          is_featured: !!is_featured,
          starts_at: starts_at ? new Date(starts_at) : null,
          expires_at: expires_at ? new Date(expires_at) : null,
          is_active: is_active !== undefined ? !!is_active : true,
        },
        { transaction: t }
      );

      for (const it of cleanItems) {
        await BundleItem.create(
          {
            bundle_id: bundle.id,
            product_id: it.product_id,
            quantity: it.quantity,
          },
          { transaction: t }
        );
      }

      if (Array.isArray(category_ids) && category_ids.length > 0) {
        for (const catId of category_ids) {
          await bundle.addCategory(catId, { transaction: t });
        }
      }

      await t.commit();

      const createdBundle = await Bundle.findByPk(bundle.id, {
        include: [
          {
            model: BundleItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                include: [{ model: ProductImage, as: 'images' }, { model: Brand, as: 'brand' }],
              },
            ],
          },
        ],
      });

      const formatted = await CatalogController.formatBundleResponse(createdBundle);

      return res.status(201).json({
        success: true,
        message: 'تم إنشاء الباندل بنجاح',
        data: formatted,
      });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }

  /**
   * Update Bundle
   * PUT /api/v1/catalog/bundles/:id
   */
  static async updateBundle(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const bundle = await Bundle.findByPk(id, { transaction: t });
      if (!bundle) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Bundle not found' });
      }

      const {
        name,
        name_ar,
        name_en,
        description_ar,
        description_en,
        image_url,
        discount_type,
        discount_value,
        discount_percent,
        bundle_price,
        is_featured,
        is_active,
        starts_at,
        expires_at,
        items,
      } = req.body;

      const finalNameAr = (name_ar || name || bundle.name_ar || '').trim();
      const finalNameEn = (name_en || finalNameAr || bundle.name_en || '').trim();

      let cleanItems = [];
      if (Array.isArray(items) && items.length > 0) {
        const uniqueItemsMap = new Map();
        for (const it of items) {
          if (it && it.product_id) {
            const pid = String(it.product_id);
            const qty = Math.max(1, Number(it.quantity || 1));
            uniqueItemsMap.set(pid, { product_id: pid, quantity: qty });
          }
        }
        cleanItems = Array.from(uniqueItemsMap.values());

        await BundleItem.destroy({ where: { bundle_id: bundle.id }, transaction: t });
        for (const it of cleanItems) {
          await BundleItem.create(
            {
              bundle_id: bundle.id,
              product_id: it.product_id,
              quantity: it.quantity,
            },
            { transaction: t }
          );
        }
      } else {
        const existingItems = await BundleItem.findAll({
          where: { bundle_id: bundle.id },
          transaction: t,
        });
        cleanItems = existingItems.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
        }));
      }

      // Recompute original total
      let originalTotal = 0;
      let firstProductImage = null;

      for (const it of cleanItems) {
        const prod = await Product.findByPk(it.product_id, {
          include: [{ model: ProductImage, as: 'images' }],
          transaction: t,
        });
        if (prod) {
          const unitPrice = Number(prod.sale_price || prod.original_price || 0);
          originalTotal += unitPrice * it.quantity;
          if (!firstProductImage && prod.images?.length > 0) {
            firstProductImage =
              prod.images.find((img) => img.is_primary)?.image_url || prod.images[0]?.image_url;
          }
        }
      }

      let finalBundlePrice = originalTotal;
      let finalDiscountPercent = 0;

      if (discount_type === 'none') {
        finalBundlePrice = originalTotal;
        finalDiscountPercent = 0;
      } else if (discount_type === 'percentage' && Number(discount_value) > 0) {
        finalDiscountPercent = Math.min(99, Math.max(0, Math.round(Number(discount_value))));
        finalBundlePrice = Math.round(originalTotal * (1 - finalDiscountPercent / 100));
      } else if (discount_type === 'fixed' && Number(discount_value) > 0) {
        const fixedOff = Math.min(originalTotal, Math.max(0, Number(discount_value)));
        finalBundlePrice = Math.max(0, originalTotal - fixedOff);
        finalDiscountPercent =
          originalTotal > 0 ? Math.round(((originalTotal - finalBundlePrice) / originalTotal) * 100) : 0;
      } else if (
        (discount_type === 'custom_price' || bundle_price !== undefined) &&
        bundle_price !== '' &&
        bundle_price !== null &&
        Number(bundle_price) > 0 &&
        Number(bundle_price) < originalTotal
      ) {
        finalBundlePrice = Number(bundle_price);
        finalDiscountPercent =
          originalTotal > 0 ? Math.round(((originalTotal - finalBundlePrice) / originalTotal) * 100) : 0;
      } else if (discount_percent !== undefined) {
        finalDiscountPercent = Math.min(99, Math.max(0, Math.round(Number(discount_percent))));
        finalBundlePrice = Math.round(originalTotal * (1 - finalDiscountPercent / 100));
      }

      await bundle.update(
        {
          name_ar: finalNameAr,
          name_en: finalNameEn,
          description_ar: description_ar !== undefined ? description_ar : bundle.description_ar,
          description_en: description_en !== undefined ? description_en : bundle.description_en,
          image_url: image_url || firstProductImage || bundle.image_url,
          original_total_price: originalTotal,
          bundle_price: finalBundlePrice,
          discount_percent: finalDiscountPercent,
          is_featured: is_featured !== undefined ? !!is_featured : bundle.is_featured,
          is_active: is_active !== undefined ? !!is_active : bundle.is_active,
          starts_at: starts_at !== undefined ? (starts_at ? new Date(starts_at) : null) : bundle.starts_at,
          expires_at: expires_at !== undefined ? (expires_at ? new Date(expires_at) : null) : bundle.expires_at,
        },
        { transaction: t }
      );

      await t.commit();

      const updatedBundle = await Bundle.findByPk(bundle.id, {
        include: [
          {
            model: BundleItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                include: [{ model: ProductImage, as: 'images' }, { model: Brand, as: 'brand' }],
              },
            ],
          },
        ],
      });

      const formatted = await CatalogController.formatBundleResponse(updatedBundle);

      return res.status(200).json({
        success: true,
        message: 'تم تحديث الباندل بنجاح',
        data: formatted,
      });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }

  /**
   * Toggle Bundle Active Status
   * PATCH /api/v1/catalog/bundles/:id/toggle
   */
  static async toggleBundleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const bundle = await Bundle.findByPk(id);
      if (!bundle) {
        return res.status(404).json({ success: false, message: 'Bundle not found' });
      }
      await bundle.update({ is_active: !bundle.is_active });
      return res.status(200).json({
        success: true,
        message: 'تم تحديث حالة الباندل',
        data: { id: bundle.id, is_active: bundle.is_active },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete Bundle
   * DELETE /api/v1/catalog/bundles/:id
   */
  static async deleteBundle(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const bundle = await Bundle.findByPk(id, { transaction: t });
      if (!bundle) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Bundle not found' });
      }

      await BundleItem.destroy({ where: { bundle_id: id }, transaction: t });
      await bundle.destroy({ transaction: t });

      await t.commit();
      return res.status(200).json({
        success: true,
        message: 'تم حذف الباندل بنجاح',
      });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }

  // =================== REVIEWS ===================

  static async submitReview(req, res, next) {
    try {
      const { product_id, guest_name, guest_phone, rating, comment, language } = req.body;
      const review = await ProductReview.create({
        product_id,
        guest_name,
        guest_phone,
        rating,
        comment,
        language: language || 'ar',
        is_approved: false, // Moderated by default
      });
      return res.status(201).json({
        success: true,
        message: 'Review submitted and waiting for moderation approval',
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CatalogController;
