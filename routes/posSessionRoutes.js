// routes/posSessionRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { 
  openSession, 
  closeSession, 
  getSessions, 
  getSessionById, 
  updateSession,
  getUserOpenSession
} = require('../controllers/posSessionController');

// Apply authentication middleware to all routes
router.use(auth);

// GET all POS sessions
router.get('/', role('admin'), getSessions);

// GET the currently open session for a specific user
router.get('/user/:userId/open', getUserOpenSession);

// GET a specific POS session by ID
router.get('/:id', getSessionById);

// POST - Open a new POS session (cash register)
router.post('/open', validate(['initialCash']), openSession);

// POST - Close a POS session
router.post('/close', validate(['sessionId', 'actualCash']), closeSession);

// PUT - Update a POS session
router.put('/:id', role('admin'), updateSession);

module.exports = router;
