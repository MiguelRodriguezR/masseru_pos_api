// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const { getUsers, getUserById, updateUser, deleteUser, approveUser } = require('../controllers/userController');
const validate = require('../middlewares/validationMiddleware');

router.use(auth);
router.get('/', role('admin'), getUsers);
router.get('/:id', getUserById);
router.put('/:id', role('admin'), validate(['name', 'email', 'role']), updateUser);
router.delete('/:id', role('admin'), deleteUser);
router.patch('/:id/approve', role('admin'), approveUser);

module.exports = router;
