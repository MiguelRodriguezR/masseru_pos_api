// routes/purchaseRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const { 
  getPurchases, 
  getPurchaseById, 
  createPurchase, 
  updatePurchase, 
  deletePurchase 
} = require('../controllers/purchaseController');
const validate = require('../middlewares/validationMiddleware');

// Apply authentication middleware to all routes
router.use(auth);

router.get('/', getPurchases);
router.get('/:id', getPurchaseById);

// Only admin and editor can create, update or delete purchases
router.post('/', 
  auth, 
  role(['admin', 'editor']), 
  validate(['items']), 
  createPurchase
);

router.put('/:id', 
  auth, 
  role(['admin', 'editor']), 
  updatePurchase
);

router.delete('/:id', 
  auth, 
  role(['admin', 'editor']), 
  deletePurchase
);

module.exports = router;
