// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'editor', 'seller'], default: 'seller' },
  approved: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
User.getModel = (conn) => conn.model('User', userSchema);
module.exports = User;
