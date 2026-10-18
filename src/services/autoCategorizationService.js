const { CategoryTag, ProductCategory, ProductTag } = require('../models');

/**
 * Hybrid Tag-to-Category Auto-Linking Service
 * Ensures fast read performance by synchronizing junction tables.
 */
class AutoCategorizationService {
  /**
   * Synchronize product categories based on its assigned tags.
   * Scans category_tags and auto-populates product_categories with is_auto_assigned = true.
   * @param {number|string} productId 
   * @param {object} transaction - Sequelize transaction
   */
  static async syncCategoriesFromTags(productId, transaction = null) {
    // 1. Get all tags assigned to this product
    const productTags = await ProductTag.findAll({
      where: { product_id: productId },
      attributes: ['tag_id'],
      transaction,
    });

    if (!productTags.length) return;

    const tagIds = productTags.map((pt) => pt.tag_id);

    // 2. Find categories mapped to these tags
    const matchingCategories = await CategoryTag.findAll({
      where: { tag_id: tagIds },
      attributes: ['category_id'],
      group: ['category_id'],
      transaction,
    });

    for (const match of matchingCategories) {
      const existing = await ProductCategory.findOne({
        where: {
          product_id: productId,
          category_id: match.category_id,
        },
        transaction,
      });

      if (!existing) {
        await ProductCategory.create({
          product_id: productId,
          category_id: match.category_id,
          is_primary: false,
          is_auto_assigned: true,
        }, { transaction });
      }
    }
  }

  /**
   * When a primary category is explicitly assigned, auto-assign its mapped tags to the product.
   * @param {number|string} productId 
   * @param {number|string} categoryId 
   * @param {object} transaction 
   */
  static async copyCategoryTagsToProduct(productId, categoryId, transaction = null) {
    const categoryTags = await CategoryTag.findAll({
      where: { category_id: categoryId },
      attributes: ['tag_id'],
      transaction,
    });

    for (const ct of categoryTags) {
      const existing = await ProductTag.findOne({
        where: {
          product_id: productId,
          tag_id: ct.tag_id,
        },
        transaction,
      });

      if (!existing) {
        await ProductTag.create({
          product_id: productId,
          tag_id: ct.tag_id,
        }, { transaction });
      }
    }

    // Run reverse sync to link any other matching categories as well
    await this.syncCategoriesFromTags(productId, transaction);
  }
}

module.exports = AutoCategorizationService;
