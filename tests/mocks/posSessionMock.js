// tests/mocks/posSessionMock.js
const mongoose = require('mongoose');

// Create valid ObjectIds for testing
const validUserId = new mongoose.Types.ObjectId();
const validSessionId = new mongoose.Types.ObjectId();
const validClosedSessionId = new mongoose.Types.ObjectId();
const validSaleId1 = new mongoose.Types.ObjectId();
const validSaleId2 = new mongoose.Types.ObjectId();
const validPaymentMethodId1 = new mongoose.Types.ObjectId();
const validPaymentMethodId2 = new mongoose.Types.ObjectId();

// Mock data for PosSession with proper toString methods
const mockPosSession = {
  _id: validSessionId,
  user: validUserId,
  status: 'open',
  initialCash: 1000,
  expectedCash: 1000,
  expectedNonCash: 0,
  actualCash: 0,
  cashDifference: 0,
  totalSales: 0,
  sales: [],
  paymentTotals: [],
  openingDate: new Date('2023-01-01T08:00:00Z'),
  closingDate: null,
  notes: '',
  save: jest.fn().mockResolvedValue(this),
  toJSON: function() { return this; },
  createdAt: new Date('2023-01-01T08:00:00Z'),
  updatedAt: new Date('2023-01-01T08:00:00Z')
};

// Use string literals instead of recursive toString calls
mockPosSession.user.toString = () => '5f7e3c6a8ea7c8362a5c8b1b';
mockPosSession._id.toString = () => '5f7e3c6a8ea7c8362a5c8b1a';

// Mock data for closed PosSession
const mockClosedPosSession = {
  _id: validClosedSessionId,
  user: validUserId,
  status: 'closed',
  initialCash: 1000,
  expectedCash: 1200,
  expectedNonCash: 500,
  actualCash: 1190,
  cashDifference: -10, // $10 missing from cash
  totalSales: 700,
  sales: [
    validSaleId1,
    validSaleId2
  ],
  paymentTotals: [
    {
      paymentMethod: validPaymentMethodId1,
      total: 200
    },
    {
      paymentMethod: validPaymentMethodId2,
      total: 500
    }
  ],
  openingDate: new Date('2023-01-01T08:00:00Z'),
  closingDate: new Date('2023-01-01T18:00:00Z'),
  notes: 'Day closed successfully',
  save: jest.fn().mockResolvedValue(this),
  toJSON: function() { return this; },
  createdAt: new Date('2023-01-01T08:00:00Z'),
  updatedAt: new Date('2023-01-01T18:00:00Z')
};

// Use string literals instead of recursive toString calls
mockClosedPosSession.user.toString = () => '5f7e3c6a8ea7c8362a5c8b1b';
mockClosedPosSession._id.toString = () => '5f7e3c6a8ea7c8362a5c8b1c';

// Multiple session mock data for pagination tests
const mockPosSessionsList = [
  { ...mockPosSession, 
    toJSON: function() { return this; },
    _id: { ...mockPosSession._id, toString: () => '5f7e3c6a8ea7c8362a5c8b1a' }, 
    user: { ...mockPosSession.user, toString: () => '5f7e3c6a8ea7c8362a5c8b1b' } 
  },
  { ...mockClosedPosSession, 
    toJSON: function() { return this; }, 
    _id: { ...mockClosedPosSession._id, toString: () => '5f7e3c6a8ea7c8362a5c8b1c' }, 
    user: { ...mockClosedPosSession.user, toString: () => '5f7e3c6a8ea7c8362a5c8b1b' } 
  },
  {
    _id: new mongoose.Types.ObjectId(),
    user: validUserId,
    status: 'closed',
    initialCash: 1000,
    expectedCash: 1500,
    expectedNonCash: 800,
    actualCash: 1505,
    cashDifference: 5, // $5 over in cash
    totalSales: 1305,
    openingDate: new Date('2023-01-02T08:00:00Z'),
    closingDate: new Date('2023-01-02T18:00:00Z'),
    toJSON: function() { return this; },
    createdAt: new Date('2023-01-02T08:00:00Z'),
    updatedAt: new Date('2023-01-02T18:00:00Z')
  }
];

module.exports = {
  mockPosSession,
  mockClosedPosSession,
  mockPosSessionsList,
  validUserId,
  validSessionId,
  validClosedSessionId,
  validSaleId1,
  validSaleId2,
  validPaymentMethodId1,
  validPaymentMethodId2
};
