const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const catalogRoutes = require('./catalogRoutes');
const orderRoutes = require('./orderRoutes');
const erpRoutes = require('./erpRoutes');
const cmsRoutes = require('./cmsRoutes');
const serviceRoutes = require('./serviceRoutes');
const cartRoutes = require('./cartRoutes');

router.use('/auth', authRoutes);
router.use('/catalog', catalogRoutes);
router.use('/orders', orderRoutes);
router.use('/erp', erpRoutes);
router.use('/cms', cmsRoutes);
router.use('/services', serviceRoutes);
router.use('/cart', cartRoutes);

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
