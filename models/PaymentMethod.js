// models/PaymentMethod.js
const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    unique: true
  },
  code: { 
    type: String, 
    required: true,
    trim: true,
    unique: true
  },
  description: { 
    type: String, 
    trim: true 
  },
  color: { 
    type: String, 
    required: true,
    default: 'rgba(138, 107, 206, 0.8)' // Default purple color
  },
  icon: { 
    type: String, 
    default: 'payments' // Default material icon
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
PaymentMethod.getModel = (conn) => conn.model('PaymentMethod', paymentMethodSchema);
module.exports = PaymentMethod;
