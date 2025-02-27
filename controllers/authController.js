// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { secret, expiresIn } = require('../config/jwt');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if(existingUser) return res.status(400).json({ msg: 'Usuario ya existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ msg: 'Usuario registrado', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if(!user) return res.status(400).json({ msg: 'Credenciales inválidas' });

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) return res.status(400).json({ msg: 'Credenciales inválidas' });

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, secret, { expiresIn });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
