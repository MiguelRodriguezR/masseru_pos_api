// models/PosSession.js
const mongoose = require('mongoose');

const posSessionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  openingDate: { 
    type: Date, 
    default: Date.now,
    required: true 
  },
  closingDate: { 
    type: Date, 
    default: null 
  },
  initialCash: { 
    type: Number, 
    required: true 
  },
  sales: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Sale' 
  }],
  cashSalesTotal: {
    type: Number,
    default: 0
  },
  cardSalesTotal: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  expectedCash: {
    type: Number,
    default: 0
  },
  actualCash: {
    type: Number,
    default: null
  },
  cashDifference: {
    type: Number,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  }
}, { timestamps: true });

module.exports = mongoose.model('PosSession', posSessionSchema);
