// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const { getUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const validate = require('../middlewares/validationMiddleware');

router.use(auth);
router.get('/', role('admin'), getUsers);
router.get('/:id', role('admin'), getUserById);
router.put('/:id', role('admin'), validate(['name', 'email', 'role']), updateUser);
router.delete('/:id', role('admin'), deleteUser);

module.exports = router;
