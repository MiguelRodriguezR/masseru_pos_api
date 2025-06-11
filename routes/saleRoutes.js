// routes/saleRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const { createSale, getSales, getSaleById, updateSale } = require('../controllers/saleController');
const validate = require('../middlewares/validationMiddleware');

router.use(auth);
router.post('/', validate(['items', 'paymentDetails']), createSale);
router.put('/:id', role(['admin']), validate(['items', 'paymentDetails']), updateSale);
router.get('/', getSales);
router.get('/:id', getSaleById);

module.exports = router;
