const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const catalogRoutes = require('./catalogRoutes');
const orderRoutes = require('./orderRoutes');
const erpRoutes = require('./erpRoutes');
const cmsRoutes = require('./cmsRoutes');

router.use('/auth', authRoutes);
router.use('/catalog', catalogRoutes);
router.use('/orders', orderRoutes);
router.use('/erp', erpRoutes);
router.use('/cms', cmsRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'Trendline Tech ERP & E-Commerce API',
  });
});

module.exports = router;
