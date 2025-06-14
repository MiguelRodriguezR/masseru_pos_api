// models/Receipt.js
const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
  receiptData: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Receipt = mongoose.model('Receipt', receiptSchema);
Receipt.getModel = (conn) => conn.model('Receipt', receiptSchema);
module.exports = Receipt;
