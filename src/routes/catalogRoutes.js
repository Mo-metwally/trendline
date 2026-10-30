const express = require('express');
const router = express.Router();
const CatalogController = require('../controllers/catalogController');
const authMiddleware = require('../middleware/authMiddleware');
const { permitRoles } = require('../middleware/rbacMiddleware');

// Storefront & Public Catalog Endpoints
router.get('/products', CatalogController.getProducts);
router.get('/products/analytics', CatalogController.getProductAnalytics);
router.get('/products/generate-codes', CatalogController.generateProductCodes);
router.get('/products/check-unique', CatalogController.checkProductUnique);
router.get('/home-categories', CatalogController.getHomeCategories);
router.get('/products/:identifier', CatalogController.getProductByIdentifier);
router.get('/categories', CatalogController.getAllCategories);
router.get('/categories/tree', CatalogController.getCategoryTree);
router.get('/categories/:id', CatalogController.getCategoryById);
router.get('/brands', CatalogController.getBrands);
router.get('/tags', CatalogController.getTags);
router.get('/bundles', CatalogController.getBundles);
router.get('/bundles/:id', CatalogController.getBundleById);
router.post('/reviews', CatalogController.submitReview);

// Admin & ERP Product Endpoints
router.post(
  '/products',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.createProduct
);

router.put(
  '/products/:id',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.updateProduct
);

router.patch(
  '/products/:id/toggle',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.toggleProductStatus
);

router.patch(
  '/products/:id/featured',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.toggleProductFeatured
);

router.patch(
  '/products/:id/quick-update',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.quickUpdateProduct
);

router.delete(
  '/products/:id',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.deleteProduct
);

router.post(
  '/products/bulk-action',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.bulkProductAction
);

router.post(
  '/categories',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.createCategory
);

router.put(
  '/categories/:id',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.updateCategory
);

router.delete(
  '/categories/:id',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.deleteCategory
);

router.patch(
  '/categories/:id/toggle',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.toggleCategoryStatus
);

router.post(
  '/brands',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.createBrand
);

router.put(
  '/brands/:id',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.updateBrand
);

router.delete(
  '/brands/:id',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.deleteBrand
);

router.post(
  '/tags',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.createTag
);

router.post(
  '/tags/bulk',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.bulkCreateTags
);

router.put(
  '/tags/:id',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.updateTag
);

router.delete(
  '/tags/:id',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.deleteTag
);

router.post(
  '/bundles',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.createBundle
);

router.put(
  '/bundles/:id',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.updateBundle
);

router.patch(
  '/bundles/:id/toggle',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.toggleBundleStatus
);

router.delete(
  '/bundles/:id',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager'),
  CatalogController.deleteBundle
);

module.exports = router;
