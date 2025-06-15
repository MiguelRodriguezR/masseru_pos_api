// Imports
// Tests use helper mocks defined in tests/mocks/mockUtils
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authController = require('../../../controllers/authController');
const User = require('../../../models/User');
// Helper utilities to mock Mongoose methods
const {
  mockFind,
  mockFindById,
  mockCountDocuments,
  mockSave
} = require('../../mocks/mockUtils');

const { mockUser, mockUnapprovedUser } = require('../../mocks/userMock');
const { makeSavedUser } = require('../../mocks/userFactory');
const { mockRegister } = require('../../utils/userControllerHelpers');
const { MESSAGES } = require('../../../config/messages');
const { secret, expiresIn } = require('../../../config/jwt');

// Mock the mongoose models and external libraries
jest.mock('../../../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
  let userData;

  beforeEach(() => {
    userData = {
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
        role: 'user'
      };
  });

  describe('register', () => {
    test.each([
      { 
        isFirst: true, 
        count: 0, 
        expectedRole: 'admin', 
        expectedApproved: true,
        expectedMessage: MESSAGES.REGISTER_FIRST
      },
      { 
        isFirst: false, 
        count: 1, 
        expectedRole: 'user', 
        expectedApproved: false,
        expectedMessage: MESSAGES.REGISTER_PENDING
      }
    ])('should register new user when isFirst=$isFirst', async ({ isFirst, count, expectedRole, expectedApproved, expectedMessage }) => {
      
      req = mockRequest(userData);
      const savedUser = makeSavedUser({ isFirst });

      mockRegister({
        exists: false,
        count,
        hash: 'hashedpassword',
        savedUser
      });

      // Execute the controller
      await authController.register(req, res);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.countDocuments).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(User).toHaveBeenCalledWith({
        name: userData.name,
        email: userData.email,
        password: 'hashedpassword',
        role: expectedRole, // First user should be admin
        approved: expectedApproved // First user should be approved
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        msg: expectedMessage,
        user: expect.objectContaining({
          ...savedUser,
          save: expect.any(Function)
        })
      });
    });

    test('should return 400 if user already exists', async () => {

      // Mock request
      req = mockRequest(userData);

      // Mock User.findOne to return an existing user
      User.findOne = jest.fn().mockResolvedValue(mockUser);

      // Execute the controller
      await authController.register(req, res);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.ALREADY_EXISTS });
    });

    test('should handle server errors', async () => {
      // Mock user data

      // Mock request
      req = mockRequest(userData);

      // Mock User.findOne to throw an error
      const errorMessage = 'Database connection error';
      User.findOne = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await authController.register(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('login', () => {
    test('should login a user successfully', async () => {
      // Mock login data
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock request
      req = mockRequest(loginData);

      // Mock User.findOne to return a user
      User.findOne = jest.fn().mockResolvedValue({
        ...mockUser,
        toObject: () => ({ ...mockUser, password: undefined })
      });

      // Mock bcrypt.compare to return true (password matches)
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      // Mock jwt.sign to return a token
      const token = 'mocktoken';
      jwt.sign = jest.fn().mockReturnValue(token);

      // Execute the controller
      await authController.login(req, res);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser._id, role: mockUser.role },
        secret,
        { expiresIn }
      );
      expect(res.json).toHaveBeenCalledWith({
        token,
        user: expect.objectContaining({
          _id: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          approved: mockUser.approved
        })
      });
      // Ensure password is not returned
      expect(res.json.mock.calls[0][0].user.password).toBeUndefined();
    });

    test('should return 400 if user does not exist', async () => {
      // Mock login data
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      // Mock request
      req = mockRequest(loginData);

      // Mock User.findOne to return null (user doesn't exist)
      User.findOne = jest.fn().mockResolvedValue(null);

      // Execute the controller
      await authController.login(req, res);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.INVALID_CREDENTIALS });
    });

    test('should return 400 if password is incorrect', async () => {
      // Mock login data
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Mock request
      req = mockRequest(loginData);

      // Mock User.findOne to return a user
      User.findOne = jest.fn().mockResolvedValue(mockUser);

      // Mock bcrypt.compare to return false (password doesn't match)
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      // Execute the controller
      await authController.login(req, res);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.INVALID_CREDENTIALS });
    });

    test('should return 403 if user is not approved', async () => {
      // Mock login data
      const loginData = {
        email: 'unapproved@example.com',
        password: 'password123'
      };

      // Mock request
      req = mockRequest(loginData);

      // Mock User.findOne to return an unapproved user
      User.findOne = jest.fn().mockResolvedValue(mockUnapprovedUser);

      // Mock bcrypt.compare to return true (password matches)
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      // Execute the controller
      await authController.login(req, res);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUnapprovedUser.password);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        msg: MESSAGES.PENDING_APPROVAL
      });
    });

    test('should handle server errors', async () => {
      // Mock login data
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock request
      req = mockRequest(loginData);

      // Mock User.findOne to throw an error
      const errorMessage = 'Database connection error';
      User.findOne = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await authController.login(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
});
