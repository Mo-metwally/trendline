const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.get('/', (req, res) => cartController.getCart(req, res));
router.post('/items', (req, res) => cartController.addItem(req, res));
router.patch('/items/:id', (req, res) => cartController.updateItem(req, res));
router.delete('/items/:id', (req, res) => cartController.removeItem(req, res));
router.delete('/', (req, res) => cartController.clearCart(req, res));

module.exports = router;
