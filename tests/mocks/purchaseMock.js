// tests/mocks/purchaseMock.js
const mongoose = require('mongoose');
const { validUserId } = require('./userMock');
const { validProductId1, validProductId2 } = require('./productMock');

// Create valid ObjectIds for testing
const validPurchaseId1 = new mongoose.Types.ObjectId();
const validPurchaseId2 = new mongoose.Types.ObjectId();

// Mock data for a basic purchase
const mockPurchase = {
  _id: validPurchaseId1,
  items: [
    {
      product: validProductId1,
      quantity: 10,
      purchasePrice: 50
    },
    {
      product: validProductId2,
      quantity: 5,
      purchasePrice: 80
    }
  ],
  total: 900, // (10 * 50) + (5 * 80)
  supplier: 'Test Supplier',
  invoiceNumber: 'INV-001',
  notes: 'Regular stock purchase',
  createdBy: validUserId,
  createdAt: new Date('2023-01-01T08:00:00Z'),
  updatedAt: new Date('2023-01-01T08:00:00Z'),
  toJSON: function() { return this; }
};

// Use string literals instead of recursive toString calls
mockPurchase._id.toString = () => '5f7e3c6a8ea7c8362a5c8d1b';
mockPurchase.createdBy.toString = () => '5f7e3c6a8ea7c8362a5c8b1b';
mockPurchase.items[0].product.toString = () => '5f7e3c6a8ea7c8362a5c8b4b';
mockPurchase.items[1].product.toString = () => '5f7e3c6a8ea7c8362a5c8b5b';

// Mock data for a purchase with populated product details
const mockPurchaseWithPopulatedProducts = {
  _id: validPurchaseId1,
  items: [
    {
      product: {
        _id: validProductId1,
        name: 'Test Product',
        barcode: '123456789',
        salePrice: 100,
        purchaseCost: 70,
        toString: () => '5f7e3c6a8ea7c8362a5c8b4b'
      },
      quantity: 10,
      purchasePrice: 50
    },
    {
      product: {
        _id: validProductId2,
        name: 'Test Product with Variants',
        barcode: '987654321',
        salePrice: 150,
        purchaseCost: 100,
        toString: () => '5f7e3c6a8ea7c8362a5c8b5b'
      },
      quantity: 5,
      purchasePrice: 80
    }
  ],
  total: 900, // (10 * 50) + (5 * 80)
  supplier: 'Test Supplier',
  invoiceNumber: 'INV-001',
  notes: 'Regular stock purchase',
  createdBy: {
    _id: validUserId,
    name: 'Test User',
    toString: () => '5f7e3c6a8ea7c8362a5c8b1b'
  },
  createdAt: new Date('2023-01-01T08:00:00Z'),
  updatedAt: new Date('2023-01-01T08:00:00Z'),
  toJSON: function() { return this; }
};

// Mock data for another purchase
const mockPurchase2 = {
  _id: validPurchaseId2,
  items: [
    {
      product: validProductId1,
      quantity: 20,
      purchasePrice: 45
    }
  ],
  total: 900, // 20 * 45
  supplier: 'Another Supplier',
  invoiceNumber: 'INV-002',
  notes: 'Bulk purchase with discount',
  createdBy: validUserId,
  createdAt: new Date('2023-01-15T10:00:00Z'),
  updatedAt: new Date('2023-01-15T10:00:00Z'),
  toJSON: function() { return this; }
};

// Use string literals instead of recursive toString calls
mockPurchase2._id.toString = () => '5f7e3c6a8ea7c8362a5c8d2b';
mockPurchase2.createdBy.toString = () => '5f7e3c6a8ea7c8362a5c8b1b';
mockPurchase2.items[0].product.toString = () => '5f7e3c6a8ea7c8362a5c8b4b';

// Multiple purchases mock data for pagination tests
const mockPurchasesList = [
  { ...mockPurchase, 
    toJSON: function() { return this; } 
  },
  { ...mockPurchase2, 
    toJSON: function() { return this; } 
  }
];

module.exports = {
  mockPurchase,
  mockPurchaseWithPopulatedProducts,
  mockPurchase2,
  mockPurchasesList,
  validPurchaseId1,
  validPurchaseId2
};
