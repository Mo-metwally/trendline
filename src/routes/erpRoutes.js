const express = require('express');
const router = express.Router();
const ErpController = require('../controllers/erpController');
const authMiddleware = require('../middleware/authMiddleware');
const { permitRoles } = require('../middleware/rbacMiddleware');

// All ERP routes require authenticated admin access
router.use(authMiddleware);

// Inventory & WMS
router.get(
  '/inventory/ledger',
  permitRoles('super_admin', 'erp_manager', 'warehouse', 'accountant'),
  ErpController.getInventoryLedger
);

router.post(
  '/inventory/adjust',
  permitRoles('super_admin', 'erp_manager', 'warehouse'),
  ErpController.adjustStock
);

// Suppliers & Purchase Orders
router.get(
  '/suppliers',
  permitRoles('super_admin', 'erp_manager', 'warehouse', 'accountant'),
  ErpController.getSuppliers
);

router.post(
  '/suppliers',
  permitRoles('super_admin', 'erp_manager'),
  ErpController.createSupplier
);

router.post(
  '/purchase-orders',
  permitRoles('super_admin', 'erp_manager'),
  ErpController.createPurchaseOrder
);

router.post(
  '/purchase-orders/:id/receive',
  permitRoles('super_admin', 'erp_manager', 'warehouse'),
  ErpController.receivePurchaseOrder
);

// RMA QC Inspection
router.post(
  '/rma/:id/inspect',
  permitRoles('super_admin', 'erp_manager', 'warehouse'),
  ErpController.inspectRMA
);

// Accounting & Financial Ledger
router.get(
  '/financials',
  permitRoles('super_admin', 'erp_manager', 'accountant'),
  ErpController.getFinancialOverview
);

module.exports = router;
