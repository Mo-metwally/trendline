const { Bundle, BundleItem, Product } = require('../models');

/**
 * Dynamic Bundle Stock & Availability Service
 * Prevents overselling by computing real-time component-level availability.
 */
class BundleService {
  /**
   * Calculate real-time available stock for a bundle.
   * Formula: MIN(FLOOR((stock_quantity - reserved_stock) / bundle_item.quantity))
   * @param {number|string} bundleId 
   * @param {object} transaction 
   * @returns {Promise<{available_stock: number, items_breakdown: Array}>}
   */
  static async calculateBundleStock(bundleId, transaction = null) {
    const bundle = await Bundle.findByPk(bundleId, {
      include: [
        {
          model: BundleItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name_ar', 'name_en', 'sku', 'stock_quantity', 'reserved_stock'],
            },
          ],
        },
      ],
      transaction,
    });

    if (!bundle || !bundle.items || bundle.items.length === 0) {
      return { available_stock: 0, items_breakdown: [] };
    }

    let minAvailable = Infinity;
    const itemsBreakdown = [];

    for (const item of bundle.items) {
      const product = item.product;
      const ats = Math.max(0, (product.stock_quantity || 0) - (product.reserved_stock || 0));
      const possibleBundles = Math.floor(ats / item.quantity);

      if (possibleBundles < minAvailable) {
        minAvailable = possibleBundles;
      }

      itemsBreakdown.push({
        product_id: product.id,
        name_ar: product.name_ar,
        name_en: product.name_en,
        sku: product.sku,
        required_per_bundle: item.quantity,
        product_ats: ats,
        possible_bundles: possibleBundles,
      });
    }

    const availableStock = minAvailable === Infinity ? 0 : minAvailable;

    return {
      bundle_id: bundle.id,
      available_stock: availableStock,
      items_breakdown: itemsBreakdown,
    };
  }

  /**
   * Verify whether the bundle has sufficient stock for a requested quantity.
   * @param {number|string} bundleId 
   * @param {number} requestedQuantity 
   * @param {object} transaction 
   * @returns {Promise<boolean>}
   */
  static async hasSufficientStock(bundleId, requestedQuantity, transaction = null) {
    const { available_stock } = await this.calculateBundleStock(bundleId, transaction);
    return available_stock >= requestedQuantity;
  }
}

module.exports = BundleService;
