// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const validate = require('../middlewares/validationMiddleware');

// Registro de usuario
router.post('/register', validate(['name', 'email', 'password', 'role']), register);
// Login
router.post('/login', validate(['email', 'password']), login);

module.exports = router;
