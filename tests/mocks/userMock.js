// tests/mocks/userMock.js
const mongoose = require('mongoose');

// Create valid ObjectIds for testing
const validUserId = new mongoose.Types.ObjectId();
const validAdminId = new mongoose.Types.ObjectId();

// Base user data used by factories
const baseUser = {
  name: 'Existing User',
  email: 'existing@example.com'
};

// Mock data for regular user
const mockUser = {
  _id: validUserId,
  name: 'Test User',
  email: 'test@example.com',
  password: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC', // hashed 'password123'
  role: 'user',
  approved: true,
  createdAt: new Date('2023-01-01T08:00:00Z'),
  updatedAt: new Date('2023-01-01T08:00:00Z'),
  toObject: function() { return { ...this, password: undefined }; },
  toJSON: function() { return this; }
};

// Use string literals instead of recursive toString calls
mockUser._id.toString = () => '5f7e3c6a8ea7c8362a5c8b1b';

// Mock data for admin user
const mockAdmin = {
  _id: validAdminId,
  name: 'Admin User',
  email: 'admin@example.com',
  password: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC', // hashed 'password123'
  role: 'admin',
  approved: true,
  createdAt: new Date('2023-01-01T08:00:00Z'),
  updatedAt: new Date('2023-01-01T08:00:00Z'),
  toObject: function() { return { ...this, password: undefined }; },
  toJSON: function() { return this; }
};

// Use string literals instead of recursive toString calls
mockAdmin._id.toString = () => '5f7e3c6a8ea7c8362a5c8b2b';

// Mock data for unapproved user
const mockUnapprovedUser = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Unapproved User',
  email: 'unapproved@example.com',
  password: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC', // hashed 'password123'
  role: 'user',
  approved: false,
  createdAt: new Date('2023-01-01T08:00:00Z'),
  updatedAt: new Date('2023-01-01T08:00:00Z'),
  toObject: function() { return { ...this, password: undefined }; },
  toJSON: function() { return this; }
};

// Use string literals instead of recursive toString calls
mockUnapprovedUser._id.toString = () => '5f7e3c6a8ea7c8362a5c8b3b';

// Multiple users mock data for pagination tests
const mockUsersList = [
  { ...mockUser, 
    toObject: function() { return { ...this, password: undefined }; },
    toJSON: function() { return this; } 
  },
  { ...mockAdmin, 
    toObject: function() { return { ...this, password: undefined }; },
    toJSON: function() { return this; } 
  },
  { ...mockUnapprovedUser, 
    toObject: function() { return { ...this, password: undefined }; },
    toJSON: function() { return this; } 
  }
];

module.exports = {
  baseUser,
  mockUser,
  mockAdmin,
  mockUnapprovedUser,
  mockUsersList,
  validUserId,
  validAdminId
};
