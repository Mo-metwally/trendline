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
const { generateCategoryId, generateProductId } = require('../utils/idGenerator');

class CatalogController {
  // =================== PRODUCTS ===================

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
        page = 1,
        limit = 20,
        sort = 'created_at_desc',
      } = req.query;

      const whereClause = {};

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

      // Price filter
      if (min_price || max_price) {
        whereClause.original_price = {};
        if (min_price) whereClause.original_price[Op.gte] = Number(min_price);
        if (max_price) whereClause.original_price[Op.lte] = Number(max_price);
      }

      // Stock status filter
      if (stock_status === 'in_stock') {
        whereClause[Op.and] = sequelize.literal('products.stock_quantity > products.low_stock_threshold');
      } else if (stock_status === 'low_stock') {
        whereClause[Op.and] = sequelize.literal('products.stock_quantity > 0 AND products.stock_quantity <= products.low_stock_threshold');
      } else if (stock_status === 'out_of_stock') {
        whereClause.stock_quantity = 0;
      } else if (in_stock_only === 'true') {
        whereClause[Op.and] = sequelize.literal('products.stock_quantity - products.reserved_stock > 0');
      }

      // Comprehensive Sorting
      let order = [['created_at', 'DESC']];
      if (sort === 'created_at_desc') order = [['created_at', 'DESC']];
      if (sort === 'created_at_asc') order = [['created_at', 'ASC']];
      if (sort === 'price_asc') order = [['original_price', 'ASC']];
      if (sort === 'price_desc') order = [['original_price', 'DESC']];
      if (sort === 'stock_desc') order = [['stock_quantity', 'DESC']];
      if (sort === 'stock_asc') order = [['stock_quantity', 'ASC']];
      if (sort === 'rating') order = [['rating_avg', 'DESC']];
      if (sort === 'name_asc') order = [['name_ar', 'ASC']];
      if (sort === 'name_desc') order = [['name_ar', 'DESC']];

      const include = [
        { model: Brand, as: 'brand', attributes: ['id', 'name_ar', 'name_en', 'slug', 'logo_url'] },
        { model: ProductImage, as: 'images', attributes: ['id', 'image_url', 'alt_text_ar', 'alt_text_en', 'is_primary', 'sort_order'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name_ar', 'name_en', 'slug'], through: { attributes: [] } },
      ];

      // Join Category if specified
      if (category_id) {
        include.push({
          model: Category,
          as: 'categories',
          where: { id: category_id },
          attributes: ['id', 'name_ar', 'name_en', 'slug'],
          through: { attributes: [] },
        });
      } else {
        include.push({
          model: Category,
          as: 'categories',
          attributes: ['id', 'name_ar', 'name_en', 'slug'],
          through: { attributes: ['is_primary', 'is_auto_assigned'] },
        });
      }

      const offset = (Number(page) - 1) * Number(limit);
      const { count, rows } = await Product.findAndCountAll({
        where: whereClause,
        include,
        order,
        limit: Number(limit),
        offset,
        distinct: true,
      });

      const localizedRows = rows.map((p) => res.localize(p));

      return res.status(200).json({
        success: true,
        count,
        page: Number(page),
        total_pages: Math.ceil(count / limit),
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
          { model: Category, as: 'categories', through: { attributes: ['is_primary', 'is_auto_assigned'] } },
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

      return res.status(200).json({
        success: true,
        data: res.localize(product),
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

      const generatedId = await generateProductId({ Product }, t);

      const product = await Product.create({
        id: generatedId,
        brand_id: brand_id || null,
        name_ar,
        name_en,
        slug,
        sku,
        barcode: barcode || null,
        short_desc_ar: short_desc_ar || null,
        short_desc_en: short_desc_en || null,
        description_ar: description_ar || null,
        description_en: description_en || null,
        specifications: specifications || null,
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
      let categories = await Category.findAll({
        where: { is_active: true, show_in_home_grid: true },
        order: [['sort_order', 'ASC'], ['id', 'ASC']],
        include: [
          {
            model: Product,
            as: 'products',
            where: { is_active: true },
            required: false,
            include: [{ model: ProductImage, as: 'images', required: false }],
          },
        ],
      });

      if (!categories || categories.length === 0) {
        categories = await Category.findAll({
          where: { is_active: true, parent_id: null },
          order: [['sort_order', 'ASC'], ['id', 'ASC']],
          limit: 6,
          include: [
            {
              model: Product,
              as: 'products',
              where: { is_active: true },
              required: false,
              include: [{ model: ProductImage, as: 'images', required: false }],
            },
          ],
        });
      }

      const data = categories.map((cat) => {
        const sortedProducts = [...(cat.products || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
   * Get All Categories with full admin details (flat & hierarchical)
   * GET /api/v1/catalog/categories
   */
  static async getAllCategories(req, res, next) {
    try {
      const categories = await Category.findAll({
        include: [
          { model: Category, as: 'parent', attributes: ['id', 'name_ar', 'name_en', 'slug'] },
          { model: Category, as: 'subcategories', attributes: ['id', 'name_ar', 'name_en', 'slug', 'is_active'] },
          { model: Tag, as: 'tags', through: { attributes: [] } },
          { model: Product, as: 'products', attributes: ['id'] },
        ],
        order: [
          ['parent_id', 'ASC NULLS FIRST'],
          ['sort_order', 'ASC'],
          ['name_ar', 'ASC'],
        ],
      });

      const formatted = categories.map((cat) => {
        const json = cat.toJSON();
        json.products_count = json.products ? json.products.length : 0;
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
   * Get Single Category by ID
   * GET /api/v1/catalog/categories/:id
   */
  static async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await Category.findByPk(id, {
        include: [
          { model: Category, as: 'parent', attributes: ['id', 'name_ar', 'name_en', 'slug'] },
          { model: Category, as: 'subcategories', attributes: ['id', 'name_ar', 'name_en', 'slug', 'is_active', 'starting_price', 'icon_url', 'sort_order'] },
          { model: Tag, as: 'tags', through: { attributes: [] } },
        ],
      });
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      return res.status(200).json({ success: true, data: category });
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
   * Get Bundles with dynamically computed component stocks
   * GET /api/v1/catalog/bundles
   */
  static async getBundles(req, res, next) {
    try {
      const bundles = await Bundle.findAll({
        where: { is_active: true },
        include: [
          {
            model: BundleItem,
            as: 'items',
            include: [{ model: Product, as: 'product', attributes: ['id', 'name_ar', 'name_en', 'stock_quantity', 'reserved_stock'] }],
          },
          { model: Category, as: 'categories', through: { attributes: [] } },
        ],
      });

      const bundlesWithStock = await Promise.all(
        bundles.map(async (b) => {
          const { available_stock, items_breakdown } = await BundleService.calculateBundleStock(b.id);
          const plain = b.toJSON();
          plain.dynamic_available_stock = available_stock;
          plain.items_breakdown = items_breakdown;
          return res.localize(plain);
        })
      );

      return res.status(200).json({ success: true, data: bundlesWithStock });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create Bundle
   * POST /api/v1/catalog/bundles
   */
  static async createBundle(req, res, next) {
    const t = await sequelize.transaction();
    try {
      const {
        name_ar,
        name_en,
        slug,
        sku,
        description_ar,
        description_en,
        image_url,
        bundle_price,
        is_featured,
        starts_at,
        expires_at,
        category_ids = [],
        items = [], // [{ product_id, quantity }]
      } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Bundle must include at least one product item' });
      }

      // Compute original total price from component products
      let originalTotal = 0;
      for (const it of items) {
        const prod = await Product.findByPk(it.product_id, { transaction: t });
        if (!prod) throw new Error(`Product #${it.product_id} not found`);
        originalTotal += Number(prod.original_price) * Number(it.quantity);
      }

      const discountPercent = Math.round(((originalTotal - bundle_price) / originalTotal) * 100);

      const bundle = await Bundle.create({
        name_ar,
        name_en,
        slug,
        sku,
        description_ar,
        description_en,
        image_url,
        original_total_price: originalTotal,
        bundle_price,
        discount_percent: discountPercent,
        is_featured: !!is_featured,
        starts_at,
        expires_at,
        is_active: true,
      }, { transaction: t });

      for (const it of items) {
        await BundleItem.create({
          bundle_id: bundle.id,
          product_id: it.product_id,
          quantity: it.quantity || 1,
        }, { transaction: t });
      }

      for (const catId of category_ids) {
        await bundle.addCategory(catId, { transaction: t });
      }

      await t.commit();
      return res.status(201).json({ success: true, message: 'Bundle created successfully', data: bundle });
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
