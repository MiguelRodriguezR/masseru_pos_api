// models/Purchase.js
const mongoose = require('mongoose');

const purchasedItemSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  purchasePrice: {
    type: Number,
    required: true
  }
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
  items: [purchasedItemSchema],
  total: {
    type: Number,
    required: true
  },
  supplier: {
    type: String
  },
  invoiceNumber: {
    type: String
  },
  notes: {
    type: String
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Update product quantities when a purchase is saved
purchaseSchema.post('save', async function(doc) {
  const Product = mongoose.model('Product');
  
  for (const item of doc.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { quantity: item.quantity }
    });
  }
});

// Update product quantities when a purchase is deleted
purchaseSchema.post('remove', async function(doc) {
  const Product = mongoose.model('Product');
  
  for (const item of doc.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { quantity: -item.quantity }
    });
  }
});

module.exports = mongoose.model('Purchase', purchaseSchema);
