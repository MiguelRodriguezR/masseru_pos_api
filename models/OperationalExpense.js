// models/OperationalExpense.js
const mongoose = require('mongoose');

const operationalExpenseSchema = new mongoose.Schema({
  reason: {
    type: String,
    required: true,
    trim: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('OperationalExpense', operationalExpenseSchema);
