// tests/mocks/saleMock.js
const mongoose = require('mongoose');
const { validUserId, validSaleId1, validSaleId2, validPaymentMethodId1, validPaymentMethodId2 } = require('./posSessionMock');

// Mock payment methods with toString methods
const mockPaymentMethods = {
  cash: {
    _id: validPaymentMethodId1,
    name: 'Efectivo',
    code: 'CASH',
    color: '#4CAF50',
    icon: 'mdi-cash',
    toString: function() { return this._id.toString(); }
  },
  card: {
    _id: validPaymentMethodId2,
    name: 'Tarjeta de crédito',
    code: 'CARD',
    color: '#2196F3',
    icon: 'mdi-credit-card',
    toString: function() { return this._id.toString(); }
  }
};

// Use string literals for IDs instead of recursive toString calls
mockPaymentMethods.cash._id.toString = () => '5f7e3c6a8ea7c8362a5c8b1f';
mockPaymentMethods.card._id.toString = () => '5f7e3c6a8ea7c8362a5c8b20';

// Mock single sale with cash payment
const mockCashSale = {
  _id: validSaleId1,
  user: validUserId,
  items: [
    {
      product: new mongoose.Types.ObjectId(),
      quantity: 2,
      price: 50,
      subtotal: 100
    }
  ],
  subtotal: 100,
  tax: 0,
  discount: 0,
  totalAmount: 100,
  paymentDetails: [
    {
      paymentMethod: mockPaymentMethods.cash,
      amount: 120
    }
  ],
  changeAmount: 20,
  date: new Date('2023-01-01T10:30:00Z'),
  toJSON: function() { return this; },
  createdAt: new Date('2023-01-01T10:30:00Z'),
  updatedAt: new Date('2023-01-01T10:30:00Z')
};

// Use string literals for IDs instead of recursive toString calls
mockCashSale._id.toString = () => '5f7e3c6a8ea7c8362a5c8b1d';
mockCashSale.user.toString = () => '5f7e3c6a8ea7c8362a5c8b1b';

// Mock single sale with card payment
const mockCardSale = {
  _id: validSaleId2,
  user: validUserId,
  items: [
    {
      product: new mongoose.Types.ObjectId(),
      quantity: 1,
      price: 500,
      subtotal: 500
    }
  ],
  subtotal: 500,
  tax: 0,
  discount: 0,
  totalAmount: 500,
  paymentDetails: [
    {
      paymentMethod: mockPaymentMethods.card,
      amount: 500
    }
  ],
  changeAmount: 0,
  date: new Date('2023-01-01T11:45:00Z'),
  toJSON: function() { return this; },
  createdAt: new Date('2023-01-01T11:45:00Z'),
  updatedAt: new Date('2023-01-01T11:45:00Z')
};

// Use string literals for IDs instead of recursive toString calls
mockCardSale._id.toString = () => '5f7e3c6a8ea7c8362a5c8b1e';
mockCardSale.user.toString = () => '5f7e3c6a8ea7c8362a5c8b1b';

// Mock sale with mixed payment methods
const mockMixedPaymentSale = {
  _id: new mongoose.Types.ObjectId(),
  user: validUserId,
  items: [
    {
      product: new mongoose.Types.ObjectId(),
      quantity: 1,
      price: 800,
      subtotal: 800
    }
  ],
  subtotal: 800,
  tax: 0,
  discount: 0,
  totalAmount: 800,
  paymentDetails: [
    {
      paymentMethod: mockPaymentMethods.cash,
      amount: 300
    },
    {
      paymentMethod: mockPaymentMethods.card,
      amount: 500
    }
  ],
  changeAmount: 0,
  date: new Date('2023-01-01T14:15:00Z'),
  toJSON: function() { return this; },
  createdAt: new Date('2023-01-01T14:15:00Z'),
  updatedAt: new Date('2023-01-01T14:15:00Z')
};

// Use string literals for IDs instead of recursive toString calls
  mockMixedPaymentSale._id.toString = () => '5f7e3c6a8ea7c8362a5c8b27';
mockMixedPaymentSale.user.toString = () => '5f7e3c6a8ea7c8362a5c8b1b';

// Mock sale with cash payment and change
const mockCashSaleWithChange = {
  _id: new mongoose.Types.ObjectId(),
  user: validUserId,
  items: [
    {
      product: new mongoose.Types.ObjectId(),
      quantity: 1,
      price: 80,
      subtotal: 80
    }
  ],
  subtotal: 80,
  tax: 0,
  discount: 0,
  totalAmount: 80,
  paymentDetails: [
    {
      paymentMethod: mockPaymentMethods.cash,
      amount: 100
    }
  ],
  changeAmount: 20,
  date: new Date('2023-01-01T15:30:00Z'),
  toJSON: function() { return this; },
  createdAt: new Date('2023-01-01T15:30:00Z'),
  updatedAt: new Date('2023-01-01T15:30:00Z')
};

mockCashSaleWithChange._id.toString = () => '5f7e3c6a8ea7c8362a5c8b28';
mockCashSaleWithChange.user.toString = () => '5f7e3c6a8ea7c8362a5c8b1b';

// Mock sale with zero amount (edge case)
const mockZeroSale = {
  _id: new mongoose.Types.ObjectId(),
  user: validUserId,
  items: [],
  subtotal: 0,
  tax: 0,
  discount: 0,
  totalAmount: 0,
  paymentDetails: [
    {
      paymentMethod: mockPaymentMethods.cash,
      amount: 0
    }
  ],
  changeAmount: 0,
  date: new Date('2023-01-01T16:00:00Z'),
  toJSON: function() { return this; },
  createdAt: new Date('2023-01-01T16:00:00Z'),
  updatedAt: new Date('2023-01-01T16:00:00Z')
};

mockZeroSale._id.toString = () => '5f7e3c6a8ea7c8362a5c8b29';
mockZeroSale.user.toString = () => '5f7e3c6a8ea7c8362a5c8b1b';

module.exports = {
  mockPaymentMethods,
  mockCashSale,
  mockCardSale,
  mockMixedPaymentSale,
  mockCashSaleWithChange,
  mockZeroSale
};
