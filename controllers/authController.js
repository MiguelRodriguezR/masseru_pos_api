// controllers/authController.js
const UserModel = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { secret, expiresIn } = require('../config/jwt');

exports.register = async (req, res) => {
  try {
    const User = UserModel.getModel(req.db);
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if(existingUser) return res.status(400).json({ msg: 'Usuario ya existe' });

    // Check if this is the first user in the system
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name, 
      email, 
      password: hashedPassword, 
      role: isFirstUser ? 'admin' : role, // First user is always admin
      approved: isFirstUser // First user is automatically approved
    });
    
    await user.save();
    
    // Return appropriate message based on approval status
    const message = isFirstUser 
      ? 'Usuario administrador registrado y aprobado' 
      : 'Usuario registrado. Pendiente de aprobación por un administrador';
    
    res.status(201).json({ msg: message, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const User = UserModel.getModel(req.db);
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if(!user) return res.status(400).json({ msg: 'Credenciales inválidas' });

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) return res.status(400).json({ msg: 'Credenciales inválidas' });

    // Check if user is approved
    if(!user.approved) {
      return res.status(403).json({ 
        msg: 'Tu cuenta está pendiente de aprobación por un administrador' 
      });
    }

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, secret, { expiresIn });
    res.json({ token, user: {...user.toObject(), password: undefined} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
