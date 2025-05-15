// Imports
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authController = require('../../../controllers/authController');
const User = require('../../../models/User');
const { mockRequest, mockResponse } = require('../../mocks/mockUtils');
const { mockUser, mockUnapprovedUser } = require('../../mocks/userMock');
const { secret, expiresIn } = require('../../../config/jwt');

// Mock the mongoose models and external libraries
jest.mock('../../../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
    req = mockRequest();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    test('should register a new user successfully when it is the first user', async () => {
      // Mock user data
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'user'
      };

      // Mock request
      req = mockRequest(userData);

      // Mock User.findOne to return null (user doesn't exist)
      User.findOne = jest.fn().mockResolvedValue(null);

      // Mock User.countDocuments to return 0 (first user)
      User.countDocuments = jest.fn().mockResolvedValue(0);

      // Mock bcrypt.hash
      bcrypt.hash = jest.fn().mockResolvedValue('hashedpassword');

      // Mock User constructor and save method
      const savedUser = {
        ...userData,
        password: 'hashedpassword',
        role: 'admin', // First user should be admin
        approved: true, // First user should be approved
        _id: new mongoose.Types.ObjectId()
      };

      const mockUserInstance = {
        ...savedUser,
        save: jest.fn().mockResolvedValue(savedUser)
      };
      User.mockImplementation(() => mockUserInstance);

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
        role: 'admin', // First user should be admin
        approved: true // First user should be approved
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Usuario administrador registrado y aprobado',
        user: expect.objectContaining({
          ...savedUser,
          save: expect.any(Function)
        })
      });
    });

    test('should register a new user successfully when it is not the first user', async () => {
      // Mock user data
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'user'
      };

      // Mock request
      req = mockRequest(userData);

      // Mock User.findOne to return null (user doesn't exist)
      User.findOne = jest.fn().mockResolvedValue(null);

      // Mock User.countDocuments to return 1 (not first user)
      User.countDocuments = jest.fn().mockResolvedValue(1);

      // Mock bcrypt.hash
      bcrypt.hash = jest.fn().mockResolvedValue('hashedpassword');

      // Mock User constructor and save method
      const savedUser = {
        ...userData,
        password: 'hashedpassword',
        role: 'user', // Not first user, so role remains as provided
        approved: false, // Not first user, so needs approval
        _id: new mongoose.Types.ObjectId()
      };

      const mockUserInstance = {
        ...savedUser,
        save: jest.fn().mockResolvedValue(savedUser)
      };
      User.mockImplementation(() => mockUserInstance);

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
        role: userData.role, // Role remains as provided
        approved: false // Needs approval
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Usuario registrado. Pendiente de aprobación por un administrador',
        user: expect.objectContaining({
          ...savedUser,
          save: expect.any(Function)
        })
      });
    });

    test('should return 400 if user already exists', async () => {
      // Mock user data
      const userData = {
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
        role: 'user'
      };

      // Mock request
      req = mockRequest(userData);

      // Mock User.findOne to return an existing user
      User.findOne = jest.fn().mockResolvedValue(mockUser);

      // Execute the controller
      await authController.register(req, res);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Usuario ya existe' });
    });

    test('should handle server errors', async () => {
      // Mock user data
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'user'
      };

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
      expect(res.json).toHaveBeenCalledWith({ msg: 'Credenciales inválidas' });
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
      expect(res.json).toHaveBeenCalledWith({ msg: 'Credenciales inválidas' });
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
        msg: 'Tu cuenta está pendiente de aprobación por un administrador'
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
