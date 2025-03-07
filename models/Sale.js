// models/Sale.js
const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  variant: { type: Object, default: null },
  salePrice: { type: Number, required: true }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [saleItemSchema],
  totalAmount: { type: Number, required: true },
  paymentAmount: { type: Number, required: true },
  changeAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'credit_card'], required: true },
  saleDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
