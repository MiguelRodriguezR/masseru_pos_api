// models/Product.js
const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  color: { type: String },
  size: { type: String },
  quantity: { type: Number, default: 0 }
}, { _id: false });

const productSchema = new mongoose.Schema({
  salePrice: { type: Number, required: true },
  purchaseCost: { type: Number, required: true },
  barcode: { type: String, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  images: [{ type: String }],
  quantity: { type: Number, required: true },
  variants: [variantSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
Product.getModel = (conn) => conn.model('Product', productSchema);
module.exports = Product;
