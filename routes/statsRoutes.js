// routes/statsRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { 
  getSalesStats, 
  getProductStats, 
  getCustomerStats, 
  getPosSessionStats,
  getDashboardStats
} = require('../controllers/statsController');

router.use(auth);

// Individual stats endpoints
router.get('/sales', getSalesStats);
router.get('/products', getProductStats);
router.get('/customers', getCustomerStats);
router.get('/pos-sessions', getPosSessionStats);

// Combined dashboard stats endpoint
router.get('/dashboard', getDashboardStats);

// Legacy endpoint for backward compatibility
router.get('/', getSalesStats);

module.exports = router;
