// tests/mocks/receiptMock.js
const mongoose = require('mongoose');
const { validSaleId1 } = require('./saleMock');

// Create valid ObjectIds for testing
const validReceiptId = new mongoose.Types.ObjectId();

// Mock receipt data
const mockReceipt = {
  _id: validReceiptId,
  sale: validSaleId1,
  receiptData: {
    businessName: 'Test Store',
    address: '123 Test Street',
    phone: '123-456-7890',
    receiptNumber: 'R-001',
    date: new Date('2023-01-01T10:30:00Z').toISOString(),
    items: [
      {
        name: 'Test Product',
        quantity: 2,
        price: 50,
        total: 100
      }
    ],
    subtotal: 100,
    tax: 0,
    discount: 0,
    total: 100,
    paymentMethod: 'Efectivo',
    amountPaid: 120,
    change: 20,
    cashier: 'Test User',
    footer: 'Thank you for your purchase!'
  },
  createdAt: new Date('2023-01-01T10:30:00Z'),
  updatedAt: new Date('2023-01-01T10:30:00Z'),
  toJSON: function() { return this; }
};

// Use string literals instead of recursive toString calls
mockReceipt._id.toString = () => '5f7e3c6a8ea7c8362a5c8e1b';
// Ensure sale is properly defined before setting toString
mockReceipt.sale = {
  ...mockReceipt.sale,
  toString: () => '5f7e3c6a8ea7c8362a5c8b1d'
};

// Mock receipt with populated sale data
const mockReceiptWithPopulatedSale = {
  _id: validReceiptId,
  sale: {
    _id: validSaleId1,
    totalAmount: 100,
    paymentDetails: [
      {
        paymentMethod: {
          name: 'Efectivo',
          code: 'CASH'
        },
        amount: 120
      }
    ],
    changeAmount: 20,
    items: [
      {
        product: {
          name: 'Test Product',
          salePrice: 50
        },
        quantity: 2,
        salePrice: 50
      }
    ],
    user: {
      name: 'Test User'
    },
    saleDate: new Date('2023-01-01T10:30:00Z'),
    toString: () => '5f7e3c6a8ea7c8362a5c8b1d'
  },
  receiptData: {
    businessName: 'Test Store',
    address: '123 Test Street',
    phone: '123-456-7890',
    receiptNumber: 'R-001',
    date: new Date('2023-01-01T10:30:00Z').toISOString(),
    items: [
      {
        name: 'Test Product',
        quantity: 2,
        price: 50,
        total: 100
      }
    ],
    subtotal: 100,
    tax: 0,
    discount: 0,
    total: 100,
    paymentMethod: 'Efectivo',
    amountPaid: 120,
    change: 20,
    cashier: 'Test User',
    footer: 'Thank you for your purchase!'
  },
  createdAt: new Date('2023-01-01T10:30:00Z'),
  updatedAt: new Date('2023-01-01T10:30:00Z'),
  toJSON: function() { return this; }
};

// Use string literals instead of recursive toString calls
mockReceiptWithPopulatedSale._id.toString = () => '5f7e3c6a8ea7c8362a5c8e1b';

module.exports = {
  mockReceipt,
  mockReceiptWithPopulatedSale,
  validReceiptId
};
