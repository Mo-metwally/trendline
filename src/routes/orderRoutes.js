const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const { permitRoles } = require('../middleware/rbacMiddleware');

// Guest Storefront Endpoints
router.post('/checkout', OrderController.checkout);
router.get('/track', OrderController.trackOrder);
router.post('/:id/rma', OrderController.createRMA);

// Admin / Sales Agent Endpoints
router.get(
  '/',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager', 'sales_agent', 'warehouse', 'accountant'),
  OrderController.listOrders
);

router.patch(
  '/:id/status',
  authMiddleware,
  permitRoles('super_admin', 'erp_manager', 'sales_agent', 'warehouse'),
  OrderController.updateOrderStatus
);

module.exports = router;
