// routes/posSessionRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { 
  openSession, 
  closeSession, 
  getSessions, 
  getSessionById, 
  updateSession 
} = require('../controllers/posSessionController');

// Apply authentication middleware to all routes
router.use(auth);

// GET all POS sessions
router.get('/', getSessions);

// GET a specific POS session by ID
router.get('/:id', getSessionById);

// POST - Open a new POS session (cash register)
router.post('/open', validate(['initialCash']), openSession);

// POST - Close a POS session
router.post('/close', validate(['sessionId', 'actualCash']), closeSession);

// PUT - Update a POS session
router.put('/:id', updateSession);

module.exports = router;
