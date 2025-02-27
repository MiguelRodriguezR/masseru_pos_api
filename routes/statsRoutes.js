// routes/statsRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { getSalesStats } = require('../controllers/statsController');

router.use(auth);
router.get('/', getSalesStats);

module.exports = router;
