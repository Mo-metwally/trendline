const express = require('express');
const router = express.Router();
const CmsController = require('../controllers/cmsController');
const authMiddleware = require('../middleware/authMiddleware');
const { permitRoles } = require('../middleware/rbacMiddleware');

// Storefront Public CMS
router.get('/banners', CmsController.getBanners);
router.get('/special-offers', CmsController.getSpecialOffers);
router.get('/store-features', CmsController.getStoreFeatures);
router.get('/shipping-zones', CmsController.getShippingZones);
router.get('/pages/:slug', CmsController.getPageBySlug);
router.get('/settings', CmsController.getSiteSettings);
router.post('/contact', CmsController.submitContact);
router.post('/newsletter', CmsController.subscribeNewsletter);

// Admin CMS Management
router.get('/admin/banners', authMiddleware, permitRoles('super_admin', 'erp_manager'), CmsController.getAllBannersAdmin);
router.post('/banners', authMiddleware, permitRoles('super_admin', 'erp_manager'), CmsController.createBanner);
router.put('/banners/reorder', authMiddleware, permitRoles('super_admin', 'erp_manager'), CmsController.reorderBanners);
router.put('/banners/:id', authMiddleware, permitRoles('super_admin', 'erp_manager'), CmsController.updateBanner);
router.delete('/banners/:id', authMiddleware, permitRoles('super_admin', 'erp_manager'), CmsController.deleteBanner);
router.patch('/shipping-zones/:id', authMiddleware, permitRoles('super_admin', 'erp_manager'), CmsController.updateShippingZone);
router.get('/coupons', authMiddleware, permitRoles('super_admin', 'erp_manager'), CmsController.getCoupons);
router.post('/coupons', authMiddleware, permitRoles('super_admin', 'erp_manager'), CmsController.createCoupon);
router.get('/contact-messages', authMiddleware, permitRoles('super_admin', 'erp_manager', 'sales_agent'), CmsController.getContactMessages);
router.post('/settings', authMiddleware, permitRoles('super_admin', 'erp_manager'), CmsController.upsertSiteSetting);

module.exports = router;

