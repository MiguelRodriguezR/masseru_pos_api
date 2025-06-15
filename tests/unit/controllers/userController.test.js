// Imports
// Mongoose helper mocks from tests/mocks/mockUtils
const mongoose = require('mongoose');
const { MESSAGES } = require('../../../config/messages');
const userController = require('../../../controllers/userController');
const User = require('../../../models/User');
const {
  mockFind,
  mockFindById,
  mockCountDocuments,
  mockSave
} = require('../../mocks/mockUtils');
const { mockUser, mockAdmin, mockUnapprovedUser, mockUsersList } = require('../../mocks/userMock');

// Mock the mongoose models
jest.mock('../../../models/User');

describe('User Controller', () => {

  describe('getUsers', () => {
    test('should get all users successfully', async () => {
      mockFind(User, mockUsersList);

      // Execute the controller
      await userController.getUsers(req, res);

      // Assertions
      expect(User.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockUsersList);
    });

    test('should handle server errors', async () => {
      // Mock User.find to throw an error
      const errorMessage = 'Database connection error';
      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockImplementation(() => {
          throw new Error(errorMessage);
        })
      });

      // Execute the controller
      await userController.getUsers(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('getUserById', () => {
    test('should get a user by ID successfully', async () => {
      // Mock request with user ID
      req = mockRequest({}, {}, { id: mockUser._id.toString() });

      mockFindById(User, mockUser);

      // Execute the controller
      await userController.getUserById(req, res);

      // Assertions
      expect(User.findById).toHaveBeenCalledWith(mockUser._id.toString());
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    test('should return 404 if user not found', async () => {
      // Mock request with non-existent user ID
      req = mockRequest({}, {}, { id: 'nonexistent-id' });

      // Mock User.findById to return null
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Execute the controller
      await userController.getUserById(req, res);

      // Assertions
      expect(User.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.USER_NOT_FOUND });
    });

    test('should handle server errors', async () => {
      // Mock request with user ID
      req = mockRequest({}, {}, { id: mockUser._id.toString() });

      // Mock User.findById to throw an error
      const errorMessage = 'Database connection error';
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockImplementation(() => {
          throw new Error(errorMessage);
        })
      });

      // Execute the controller
      await userController.getUserById(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('updateUser', () => {
    test('should update a user successfully', async () => {
      // Mock update data
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        role: 'admin'
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: mockUser._id.toString() });

      // Mock User.findByIdAndUpdate to return updated user
      const updatedUser = {
        ...mockUser,
        ...updateData
      };
      User.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedUser);

      // Execute the controller
      await userController.updateUser(req, res);

      // Assertions
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id.toString(),
        updateData,
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        msg: MESSAGES.USER_UPDATED,
        user: updatedUser
      });
    });

    test('should update a user with approved status', async () => {
      // Mock update data with approved status
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        role: 'admin',
        approved: true
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: mockUser._id.toString() });

      // Mock User.findByIdAndUpdate to return updated user
      const updatedUser = {
        ...mockUser,
        ...updateData
      };
      User.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedUser);

      // Execute the controller
      await userController.updateUser(req, res);

      // Assertions
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id.toString(),
        updateData,
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        msg: MESSAGES.USER_UPDATED,
        user: updatedUser
      });
    });

    test('should return 404 if user not found', async () => {
      // Mock update data
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        role: 'admin'
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: 'nonexistent-id' });

      // Mock User.findByIdAndUpdate to return null
      User.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      // Execute the controller
      await userController.updateUser(req, res);

      // Assertions
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'nonexistent-id',
        updateData,
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.USER_NOT_FOUND });
    });

    test('should handle server errors', async () => {
      // Mock update data
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        role: 'admin'
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: mockUser._id.toString() });

      // Mock User.findByIdAndUpdate to throw an error
      const errorMessage = 'Database connection error';
      User.findByIdAndUpdate = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await userController.updateUser(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('approveUser', () => {
    test('should approve a user successfully', async () => {
      // Mock request
      req = mockRequest({}, {}, { id: mockUnapprovedUser._id.toString() });

      // Mock User.findById to return an unapproved user
      User.findById = jest.fn().mockResolvedValue(mockUnapprovedUser);

      // Mock User.findByIdAndUpdate to return approved user
      const approvedUser = {
        ...mockUnapprovedUser,
        approved: true
      };
      User.findByIdAndUpdate = jest.fn().mockResolvedValue(approvedUser);

      // Execute the controller
      await userController.approveUser(req, res);

      // Assertions
      expect(User.findById).toHaveBeenCalledWith(mockUnapprovedUser._id.toString());
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUnapprovedUser._id.toString(),
        { approved: true },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        msg: MESSAGES.USER_APPROVED,
        user: approvedUser
      });
    });

    test('should return success if user is already approved', async () => {
      // Mock request
      req = mockRequest({}, {}, { id: mockUser._id.toString() });

      // Mock User.findById to return an already approved user
      User.findById = jest.fn().mockResolvedValue(mockUser);

      // Execute the controller
      await userController.approveUser(req, res);

      // Assertions
      expect(User.findById).toHaveBeenCalledWith(mockUser._id.toString());
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        msg: MESSAGES.USER_ALREADY_APPROVED,
        user: mockUser
      });
    });

    test('should return 404 if user not found', async () => {
      // Mock request
      req = mockRequest({}, {}, { id: 'nonexistent-id' });

      // Mock User.findById to return null
      User.findById = jest.fn().mockResolvedValue(null);

      // Execute the controller
      await userController.approveUser(req, res);

      // Assertions
      expect(User.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.USER_NOT_FOUND });
    });

    test('should handle server errors', async () => {
      // Mock request
      req = mockRequest({}, {}, { id: mockUnapprovedUser._id.toString() });

      // Mock User.findById to throw an error
      const errorMessage = 'Database connection error';
      User.findById = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await userController.approveUser(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('deleteUser', () => {
    test('should delete a user successfully', async () => {
      // Mock request
      req = mockRequest({}, {}, { id: mockUser._id.toString() });

      // Mock User.findByIdAndDelete to return deleted user
      User.findByIdAndDelete = jest.fn().mockResolvedValue(mockUser);

      // Execute the controller
      await userController.deleteUser(req, res);

      // Assertions
      expect(User.findByIdAndDelete).toHaveBeenCalledWith(mockUser._id.toString());
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.USER_DELETED });
    });

    test('should return 404 if user not found', async () => {
      // Mock request
      req = mockRequest({}, {}, { id: 'nonexistent-id' });

      // Mock User.findByIdAndDelete to return null
      User.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      // Execute the controller
      await userController.deleteUser(req, res);

      // Assertions
      expect(User.findByIdAndDelete).toHaveBeenCalledWith('nonexistent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.USER_NOT_FOUND });
    });

    test('should handle server errors', async () => {
      // Mock request
      req = mockRequest({}, {}, { id: mockUser._id.toString() });

      // Mock User.findByIdAndDelete to throw an error
      const errorMessage = 'Database connection error';
      User.findByIdAndDelete = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await userController.deleteUser(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
});
