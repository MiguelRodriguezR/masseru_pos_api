// models/PosSession.js
const mongoose = require('mongoose');

const paymentTotalSchema = new mongoose.Schema({
  paymentMethod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod'
  },
  total: {
    type: Number,
    default: 0
  }
}, { _id: false });

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
  paymentTotals: [paymentTotalSchema],
  totalSales: {
    type: Number,
    default: 0
  },
  expectedCash: {
    type: Number,
    default: 0
  },
  expectedNonCash: {
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

const PosSession = mongoose.model('PosSession', posSessionSchema);
PosSession.getModel = (conn) => conn.model('PosSession', posSessionSchema);
module.exports = PosSession;
