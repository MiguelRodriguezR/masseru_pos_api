// routes/receiptRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { getReceipt } = require('../controllers/receiptController');

router.use(auth);
router.get('/:saleId', getReceipt);

module.exports = router;
