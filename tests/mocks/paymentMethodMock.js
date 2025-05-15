// tests/mocks/paymentMethodMock.js
const mongoose = require('mongoose');

// Create valid ObjectIds for testing
const validPaymentMethodId1 = new mongoose.Types.ObjectId();
const validPaymentMethodId2 = new mongoose.Types.ObjectId();
const validPaymentMethodId3 = new mongoose.Types.ObjectId();

// Mock data for cash payment method
const mockCashPaymentMethod = {
  _id: validPaymentMethodId1,
  name: 'Efectivo',
  code: 'CASH',
  description: 'Pago en efectivo',
  color: '#4CAF50',
  icon: 'mdi-cash',
  isActive: true,
  createdAt: new Date('2023-01-01T08:00:00Z'),
  updatedAt: new Date('2023-01-01T08:00:00Z'),
  toJSON: function() { return this; }
};

// Use string literals instead of recursive toString calls
mockCashPaymentMethod._id.toString = () => '5f7e3c6a8ea7c8362a5c8b1f';

// Mock data for card payment method
const mockCardPaymentMethod = {
  _id: validPaymentMethodId2,
  name: 'Tarjeta de crédito',
  code: 'CARD',
  description: 'Pago con tarjeta de crédito',
  color: '#2196F3',
  icon: 'mdi-credit-card',
  isActive: true,
  createdAt: new Date('2023-01-01T08:00:00Z'),
  updatedAt: new Date('2023-01-01T08:00:00Z'),
  toJSON: function() { return this; }
};

// Use string literals instead of recursive toString calls
mockCardPaymentMethod._id.toString = () => '5f7e3c6a8ea7c8362a5c8b20';

// Mock data for inactive payment method
const mockInactivePaymentMethod = {
  _id: validPaymentMethodId3,
  name: 'Cheque',
  code: 'CHECK',
  description: 'Pago con cheque',
  color: '#9E9E9E',
  icon: 'mdi-file-document-outline',
  isActive: false,
  createdAt: new Date('2023-01-01T08:00:00Z'),
  updatedAt: new Date('2023-01-01T08:00:00Z'),
  toJSON: function() { return this; }
};

// Use string literals instead of recursive toString calls
mockInactivePaymentMethod._id.toString = () => '5f7e3c6a8ea7c8362a5c8b21';

// Multiple payment methods mock data for pagination tests
const mockPaymentMethodsList = [
  { ...mockCashPaymentMethod, 
    toJSON: function() { return this; } 
  },
  { ...mockCardPaymentMethod, 
    toJSON: function() { return this; } 
  },
  { ...mockInactivePaymentMethod, 
    toJSON: function() { return this; } 
  }
];

// Active payment methods only
const mockActivePaymentMethodsList = [
  { ...mockCashPaymentMethod, 
    toJSON: function() { return this; } 
  },
  { ...mockCardPaymentMethod, 
    toJSON: function() { return this; } 
  }
];

module.exports = {
  mockCashPaymentMethod,
  mockCardPaymentMethod,
  mockInactivePaymentMethod,
  mockPaymentMethodsList,
  mockActivePaymentMethodsList,
  validPaymentMethodId1,
  validPaymentMethodId2,
  validPaymentMethodId3
};
