const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { permitRoles } = require('../middleware/rbacMiddleware');

// Public Auth Endpoints
router.post('/login', AuthController.login);
router.post('/nextauth-verify', AuthController.nextAuthVerify);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Protected Admin Endpoints
router.get('/me', authMiddleware, AuthController.getProfile);
router.put('/preferences', authMiddleware, AuthController.updatePreferences);

// Super Admin Management Endpoints
router.get('/admins', authMiddleware, permitRoles('super_admin'), AuthController.listAdmins);
router.post('/admins', authMiddleware, permitRoles('super_admin'), AuthController.createAdmin);

module.exports = router;
