const express = require('express');
const router = express.Router();
const ServiceController = require('../controllers/serviceController');

// Public & Admin List and Detail
router.get('/', ServiceController.getServices);
router.get('/:identifier', ServiceController.getServiceById);

// Admin Management (Create, Update, Toggle, Delete)
router.post('/', ServiceController.createService);
router.put('/:id', ServiceController.updateService);
router.patch('/:id/toggle', ServiceController.toggleServiceStatus);
router.delete('/:id', ServiceController.deleteService);

module.exports = router;
