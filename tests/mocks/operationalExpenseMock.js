// tests/mocks/operationalExpenseMock.js
const mongoose = require('mongoose');
const { validUserId } = require('./userMock');

// Create valid ObjectIds for testing
const validExpenseId1 = new mongoose.Types.ObjectId();
const validExpenseId2 = new mongoose.Types.ObjectId();
const validExpenseId3 = new mongoose.Types.ObjectId();

// Mock data for a basic operational expense
const mockOperationalExpense = {
  _id: validExpenseId1,
  reason: 'Rent Payment',
  totalAmount: 1000,
  notes: 'Monthly rent for store',
  date: new Date('2023-01-01T08:00:00Z'),
  createdBy: validUserId,
  createdAt: new Date('2023-01-01T08:00:00Z'),
  updatedAt: new Date('2023-01-01T08:00:00Z'),
  toJSON: function() { return this; }
};

// Use string literals instead of recursive toString calls
mockOperationalExpense._id.toString = () => '5f7e3c6a8ea7c8362a5c8c1b';
mockOperationalExpense.createdBy.toString = () => '5f7e3c6a8ea7c8362a5c8b1b';

// Mock data for another operational expense
const mockOperationalExpense2 = {
  _id: validExpenseId2,
  reason: 'Utilities',
  totalAmount: 250,
  notes: 'Electricity and water bills',
  date: new Date('2023-01-15T10:00:00Z'),
  createdBy: validUserId,
  createdAt: new Date('2023-01-15T10:00:00Z'),
  updatedAt: new Date('2023-01-15T10:00:00Z'),
  toJSON: function() { return this; }
};

// Use string literals instead of recursive toString calls
mockOperationalExpense2._id.toString = () => '5f7e3c6a8ea7c8362a5c8c2b';
mockOperationalExpense2.createdBy.toString = () => '5f7e3c6a8ea7c8362a5c8b1b';

// Mock data for a third operational expense
const mockOperationalExpense3 = {
  _id: validExpenseId3,
  reason: 'Supplies',
  totalAmount: 150,
  notes: 'Office supplies and cleaning materials',
  date: new Date('2023-01-20T14:00:00Z'),
  createdBy: validUserId,
  createdAt: new Date('2023-01-20T14:00:00Z'),
  updatedAt: new Date('2023-01-20T14:00:00Z'),
  toJSON: function() { return this; }
};

// Use string literals instead of recursive toString calls
mockOperationalExpense3._id.toString = () => '5f7e3c6a8ea7c8362a5c8c3b';
mockOperationalExpense3.createdBy.toString = () => '5f7e3c6a8ea7c8362a5c8b1b';

// Multiple operational expenses mock data for pagination tests
const mockOperationalExpensesList = [
  { ...mockOperationalExpense, 
    toJSON: function() { return this; } 
  },
  { ...mockOperationalExpense2, 
    toJSON: function() { return this; } 
  },
  { ...mockOperationalExpense3, 
    toJSON: function() { return this; } 
  }
];

module.exports = {
  mockOperationalExpense,
  mockOperationalExpense2,
  mockOperationalExpense3,
  mockOperationalExpensesList,
  validExpenseId1,
  validExpenseId2,
  validExpenseId3
};
