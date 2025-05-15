// tests/mocks/productMock.js
const mongoose = require('mongoose');
const { validUserId } = require('./userMock');

// Create valid ObjectIds for testing
const validProductId1 = new mongoose.Types.ObjectId();
const validProductId2 = new mongoose.Types.ObjectId();
const validProductId3 = new mongoose.Types.ObjectId();

// Mock data for a basic product
const mockProduct = {
  _id: validProductId1,
  name: 'Test Product',
  barcode: '123456789',
  description: 'This is a test product',
  salePrice: 100,
  purchaseCost: 70,
  quantity: 50,
  images: ['/uploads/products/test-image.jpg'],
  variants: [],
  createdBy: validUserId,
  createdAt: new Date('2023-01-01T08:00:00Z'),
  updatedAt: new Date('2023-01-01T08:00:00Z'),
  toObject: function() { return { ...this, _id: this._id.toString(), createdBy: this.createdBy.toString() }; },
  toJSON: function() { return this.toObject(); }
};

// Use string literals instead of recursive toString calls
mockProduct._id.toString = () => '5f7e3c6a8ea7c8362a5c8b4b';
mockProduct.createdBy.toString = () => '5f7e3c6a8ea7c8362a5c8b1b';

// Mock data for a product with variants
const mockProductWithVariants = {
  _id: validProductId2,
  name: 'Test Product with Variants',
  barcode: '987654321',
  description: 'This is a test product with variants',
  salePrice: 150,
  purchaseCost: 100,
  quantity: 100,
  images: ['/uploads/products/test-image-2.jpg', '/uploads/products/test-image-3.jpg'],
  variants: [
    {
      color: 'Red',
      size: 'M',
      quantity: 30
    },
    {
      color: 'Blue',
      size: 'L',
      quantity: 20
    }
  ],
  createdBy: validUserId,
  createdAt: new Date('2023-01-01T09:00:00Z'),
  updatedAt: new Date('2023-01-01T09:00:00Z'),
  toJSON: function() { return this; }
};

// Use string literals instead of recursive toString calls
mockProductWithVariants._id.toString = () => '5f7e3c6a8ea7c8362a5c8b5b';
mockProductWithVariants.createdBy.toString = () => '5f7e3c6a8ea7c8362a5c8b1b';

// Mock data for a product with low stock
const mockLowStockProduct = {
  _id: validProductId3,
  name: 'Low Stock Product',
  barcode: '555555555',
  description: 'This product has low stock',
  salePrice: 200,
  purchaseCost: 150,
  quantity: 5,
  images: ['/uploads/products/low-stock.jpg'],
  variants: [],
  createdBy: validUserId,
  createdAt: new Date('2023-01-01T10:00:00Z'),
  updatedAt: new Date('2023-01-01T10:00:00Z'),
  toJSON: function() { return this; }
};

// Use string literals instead of recursive toString calls
mockLowStockProduct._id.toString = () => '5f7e3c6a8ea7c8362a5c8b6b';
mockLowStockProduct.createdBy.toString = () => '5f7e3c6a8ea7c8362a5c8b1b';

// Multiple products mock data for pagination tests
const mockProductsList = [
  { ...mockProduct, 
    toJSON: function() { return this; } 
  },
  { ...mockProductWithVariants, 
    toJSON: function() { return this; } 
  },
  { ...mockLowStockProduct, 
    toJSON: function() { return this; } 
  }
];

module.exports = {
  mockProduct,
  mockProductWithVariants,
  mockLowStockProduct,
  mockProductsList,
  validProductId1,
  validProductId2,
  validProductId3
};
