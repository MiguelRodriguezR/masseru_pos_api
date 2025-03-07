// routes/saleRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { createSale, getSales, getSaleById } = require('../controllers/saleController');
const validate = require('../middlewares/validationMiddleware');

router.use(auth);
router.post('/', validate(['items', 'paymentAmount']), createSale);
router.get('/', getSales);
router.get('/:id', getSaleById);

module.exports = router;
