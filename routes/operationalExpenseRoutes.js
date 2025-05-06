// routes/operationalExpenseRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const { 
  getOperationalExpenses, 
  getOperationalExpenseById, 
  createOperationalExpense, 
  updateOperationalExpense, 
  deleteOperationalExpense 
} = require('../controllers/operationalExpenseController');
const validate = require('../middlewares/validationMiddleware');

// Apply authentication middleware to all routes
router.use(auth);

router.get('/', getOperationalExpenses);
router.get('/:id', getOperationalExpenseById);

// Only admin and editor can create, update or delete operational expenses
router.post('/', 
  auth, 
  role(['admin', 'editor']), 
  validate(['reason', 'totalAmount']), 
  createOperationalExpense
);

router.put('/:id', 
  auth, 
  role(['admin', 'editor']), 
  updateOperationalExpense
);

router.delete('/:id', 
  auth, 
  role(['admin', 'editor']), 
  deleteOperationalExpense
);

module.exports = router;
