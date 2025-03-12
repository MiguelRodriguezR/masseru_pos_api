// routes/paymentMethodRoutes.js
const express = require('express');
const router = express.Router();
const paymentMethodController = require('../controllers/paymentMethodController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { check } = require('express-validator');
const validationMiddleware = require('../middlewares/validationMiddleware');

router.use(authMiddleware);

// Validation rules
const paymentMethodValidation = [
  check('name', 'El nombre es obligatorio').not().isEmpty(),
  check('code', 'El código es obligatorio').not().isEmpty(),
  check('color', 'El color es obligatorio').not().isEmpty()
];

// Get all payment methods
router.get(
  '/',
  paymentMethodController.getPaymentMethods
);

// Get active payment methods
router.get(
  '/active',
  paymentMethodController.getActivePaymentMethods
);

// Get payment method by ID
router.get(
  '/:id',
  paymentMethodController.getPaymentMethodById
);

// Create payment method
router.post(
  '/',
  roleMiddleware(['admin']),
  paymentMethodValidation,
  paymentMethodController.createPaymentMethod
);

// Update payment method
router.put(
  '/:id',
  roleMiddleware(['admin']),
  paymentMethodValidation,
  paymentMethodController.updatePaymentMethod
);

// Delete payment method
router.delete(
  '/:id',
  roleMiddleware(['admin']),
  paymentMethodController.deletePaymentMethod
);

module.exports = router;
