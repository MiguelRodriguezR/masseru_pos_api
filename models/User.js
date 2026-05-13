// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'editor', 'seller'], default: 'seller' },
  approved: { type: Boolean, default: false },
  settings: {
    friPercentage: { type: Number, default: 15, min: 0, max: 100 }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
