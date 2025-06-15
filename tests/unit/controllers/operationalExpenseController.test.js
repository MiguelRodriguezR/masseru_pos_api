// Imports
const mongoose = require('mongoose');
const { MESSAGES } = require('../../../config/messages');
const operationalExpenseController = require('../../../controllers/operationalExpenseController');
const OperationalExpense = require('../../../models/OperationalExpense');
const { 
  mockOperationalExpense, 
  mockOperationalExpense2, 
  mockOperationalExpensesList 
} = require('../../mocks/operationalExpenseMock');
const { mockUser } = require('../../mocks/userMock');

// Mock the mongoose models
jest.mock('../../../models/OperationalExpense');

describe('Operational Expense Controller', () => {

  describe('getOperationalExpenses', () => {
    test('should get operational expenses with pagination and search', async () => {
      // Mock pagination and search parameters
      const page = 1;
      const limit = 10;
      const search = 'rent';
      req = mockRequest({}, {}, {}, { page, limit, search });

      // Mock OperationalExpense.countDocuments to return count
      OperationalExpense.countDocuments = jest.fn().mockResolvedValue(3);

      // Mock OperationalExpense.find with chained methods
      OperationalExpense.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockOperationalExpensesList)
      });

      // Execute the controller
      await operationalExpenseController.getOperationalExpenses(req, res);

      // Assertions
      expect(OperationalExpense.countDocuments).toHaveBeenCalledWith({
        $or: [
          { reason: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } }
        ]
      });
      expect(OperationalExpense.find).toHaveBeenCalledWith({
        $or: [
          { reason: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } }
        ]
      });
      expect(res.json).toHaveBeenCalledWith({
        operationalExpenses: mockOperationalExpensesList,
        pagination: {
          total: 3,
          page,
          limit,
          pages: Math.ceil(3 / limit)
        }
      });
    });

    test('should get all operational expenses without search', async () => {
      // Mock pagination parameters without search
      const page = 1;
      const limit = 10;
      req = mockRequest({}, {}, {}, { page, limit });

      // Mock OperationalExpense.countDocuments to return count
      OperationalExpense.countDocuments = jest.fn().mockResolvedValue(3);

      // Mock OperationalExpense.find with chained methods
      OperationalExpense.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockOperationalExpensesList)
      });

      // Execute the controller
      await operationalExpenseController.getOperationalExpenses(req, res);

      // Assertions
      expect(OperationalExpense.countDocuments).toHaveBeenCalledWith({});
      expect(OperationalExpense.find).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith({
        operationalExpenses: mockOperationalExpensesList,
        pagination: {
          total: 3,
          page,
          limit,
          pages: Math.ceil(3 / limit)
        }
      });
    });

    test('should handle server errors', async () => {
      // Mock OperationalExpense.countDocuments to throw an error
      const errorMessage = 'Database connection error';
      OperationalExpense.countDocuments = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await operationalExpenseController.getOperationalExpenses(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('getOperationalExpenseById', () => {
    test('should get an operational expense by ID successfully', async () => {
      // Mock request with expense ID
      req = mockRequest({}, {}, { id: mockOperationalExpense._id.toString() });

      // Mock OperationalExpense.findById with chained populate
      OperationalExpense.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOperationalExpense)
      });

      // Execute the controller
      await operationalExpenseController.getOperationalExpenseById(req, res);

      // Assertions
      expect(OperationalExpense.findById).toHaveBeenCalledWith(mockOperationalExpense._id.toString());
      expect(res.json).toHaveBeenCalledWith(mockOperationalExpense);
    });

    test('should return 404 if operational expense not found', async () => {
      // Mock request with non-existent expense ID
      req = mockRequest({}, {}, { id: 'nonexistent-id' });

      // Mock OperationalExpense.findById to return null
      OperationalExpense.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      // Execute the controller
      await operationalExpenseController.getOperationalExpenseById(req, res);

      // Assertions
      expect(OperationalExpense.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.OPERATIONAL_EXPENSE_NOT_FOUND });
    });

    test('should handle server errors', async () => {
      // Mock request with expense ID
      req = mockRequest({}, {}, { id: mockOperationalExpense._id.toString() });

      // Mock OperationalExpense.findById to throw an error
      const errorMessage = 'Database connection error';
      OperationalExpense.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockImplementation(() => {
          throw new Error(errorMessage);
        })
      });

      // Execute the controller
      await operationalExpenseController.getOperationalExpenseById(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('createOperationalExpense', () => {
    test('should create an operational expense successfully', async () => {
      // Mock expense data
      const expenseData = {
        reason: 'New Expense',
        totalAmount: 500,
        notes: 'New expense notes',
        date: new Date('2023-02-01T10:00:00Z')
      };

      // Mock request with user
      req = mockRequest(expenseData, { id: mockUser._id.toString() });

      // Mock OperationalExpense constructor and save method
      const savedExpense = {
        ...expenseData,
        _id: new mongoose.Types.ObjectId(),
        createdBy: mockUser._id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockExpenseInstance = {
        ...savedExpense,
        save: jest.fn().mockResolvedValue(savedExpense)
      };
      OperationalExpense.mockImplementation(() => mockExpenseInstance);

      // Execute the controller
      await operationalExpenseController.createOperationalExpense(req, res);

      // Assertions
      expect(OperationalExpense).toHaveBeenCalledWith({
        reason: expenseData.reason,
        totalAmount: expenseData.totalAmount,
        notes: expenseData.notes,
        date: expenseData.date,
        createdBy: mockUser._id.toString()
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Gasto operativo creado',
        operationalExpense: expect.objectContaining({
          ...savedExpense,
          save: expect.any(Function)
        })
      });
    });

    test('should create an operational expense with current date if not provided', async () => {
      // Mock expense data without date
      const expenseData = {
        reason: 'New Expense',
        totalAmount: 500,
        notes: 'New expense notes'
      };

      // Mock request with user
      req = mockRequest(expenseData, { id: mockUser._id.toString() });

      // Mock Date.now
      const mockDate = new Date('2023-02-01T10:00:00Z');
      jest.spyOn(Date, 'now').mockImplementation(() => mockDate);

      // Mock OperationalExpense constructor and save method
      const savedExpense = {
        ...expenseData,
        date: mockDate,
        _id: new mongoose.Types.ObjectId(),
        createdBy: mockUser._id,
        createdAt: mockDate,
        updatedAt: mockDate
      };

      const mockExpenseInstance = {
        ...savedExpense,
        save: jest.fn().mockResolvedValue(savedExpense)
      };
      OperationalExpense.mockImplementation(() => mockExpenseInstance);

      // Execute the controller
      await operationalExpenseController.createOperationalExpense(req, res);

      // Assertions
      expect(OperationalExpense).toHaveBeenCalledWith({
        reason: expenseData.reason,
        totalAmount: expenseData.totalAmount,
        notes: expenseData.notes,
        date: mockDate,
        createdBy: mockUser._id.toString()
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Gasto operativo creado',
        operationalExpense: expect.objectContaining({
          ...savedExpense,
          save: expect.any(Function)
        })
      });

      // Restore Date
      // global.Date.mockRestore();
    });

    test('should return 400 if required fields are missing', async () => {
      // Mock expense data with missing required fields
      const expenseData = {
        notes: 'New expense notes'
        // Missing reason and totalAmount
      };

      // Mock request
      req = mockRequest(expenseData, { id: mockUser._id.toString() });

      // Execute the controller
      await operationalExpenseController.createOperationalExpense(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Razón y monto total son campos requeridos' });
    });

    test('should handle server errors', async () => {
      // Mock expense data
      const expenseData = {
        reason: 'New Expense',
        totalAmount: 500,
        notes: 'New expense notes'
      };

      // Mock request
      req = mockRequest(expenseData, { id: mockUser._id.toString() });

      // Mock OperationalExpense constructor to throw an error
      const errorMessage = 'Database connection error';
      OperationalExpense.mockImplementation(() => ({
        save: jest.fn().mockImplementation(() => {
          throw new Error(errorMessage);
        })
      }));

      // Execute the controller
      await operationalExpenseController.createOperationalExpense(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('updateOperationalExpense', () => {
    test('should update an operational expense successfully', async () => {
      // Mock update data
      const updateData = {
        reason: 'Updated Expense',
        totalAmount: 600,
        notes: 'Updated notes',
        date: new Date('2023-02-15T10:00:00Z')
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: mockOperationalExpense._id.toString() });

      // Mock OperationalExpense.findById to return an expense
      const expenseToUpdate = {
        ...mockOperationalExpense,
        reason: mockOperationalExpense.reason,
        totalAmount: mockOperationalExpense.totalAmount,
        notes: mockOperationalExpense.notes,
        date: mockOperationalExpense.date,
        save: jest.fn().mockResolvedValue({
          ...mockOperationalExpense,
          ...updateData
        })
      };
      OperationalExpense.findById = jest.fn().mockResolvedValue(expenseToUpdate);

      // Execute the controller
      await operationalExpenseController.updateOperationalExpense(req, res);

      // Assertions
      expect(OperationalExpense.findById).toHaveBeenCalledWith(mockOperationalExpense._id.toString());
      expect(expenseToUpdate.reason).toBe(updateData.reason);
      expect(expenseToUpdate.totalAmount).toBe(updateData.totalAmount);
      expect(expenseToUpdate.notes).toBe(updateData.notes);
      expect(expenseToUpdate.date).toBe(updateData.date);
      expect(expenseToUpdate.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        msg: MESSAGES.OPERATIONAL_EXPENSE_UPDATED,
        operationalExpense: expect.objectContaining(updateData)
      });
    });

    test('should update only provided fields', async () => {
      // Mock update data with only some fields
      const updateData = {
        reason: 'Updated Expense'
        // totalAmount and notes not provided
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: mockOperationalExpense._id.toString() });

      // Mock OperationalExpense.findById to return an expense
      const originalExpense = { ...mockOperationalExpense };
      const expenseToUpdate = {
        ...mockOperationalExpense,
        reason: mockOperationalExpense.reason,
        totalAmount: mockOperationalExpense.totalAmount,
        notes: mockOperationalExpense.notes,
        date: mockOperationalExpense.date,
        save: jest.fn().mockResolvedValue({
          ...mockOperationalExpense,
          reason: updateData.reason
        })
      };
      OperationalExpense.findById = jest.fn().mockResolvedValue(expenseToUpdate);

      // Execute the controller
      await operationalExpenseController.updateOperationalExpense(req, res);

      // Assertions
      expect(OperationalExpense.findById).toHaveBeenCalledWith(mockOperationalExpense._id.toString());
      expect(expenseToUpdate.reason).toBe(updateData.reason);
      expect(expenseToUpdate.totalAmount).toBe(originalExpense.totalAmount); // Unchanged
      expect(expenseToUpdate.notes).toBe(originalExpense.notes); // Unchanged
      expect(expenseToUpdate.date).toBe(originalExpense.date); // Unchanged
      expect(expenseToUpdate.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        msg: MESSAGES.OPERATIONAL_EXPENSE_UPDATED,
        operationalExpense: expect.objectContaining({
          reason: updateData.reason
        })
      });
    });

    test('should return 404 if operational expense not found', async () => {
      // Mock update data
      const updateData = {
        reason: 'Updated Expense'
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: 'nonexistent-id' });

      // Mock OperationalExpense.findById to return null
      OperationalExpense.findById = jest.fn().mockResolvedValue(null);

      // Execute the controller
      await operationalExpenseController.updateOperationalExpense(req, res);

      // Assertions
      expect(OperationalExpense.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.OPERATIONAL_EXPENSE_NOT_FOUND });
    });

    test('should handle server errors', async () => {
      // Mock update data
      const updateData = {
        reason: 'Updated Expense'
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: mockOperationalExpense._id.toString() });

      // Mock OperationalExpense.findById to throw an error
      const errorMessage = 'Database connection error';
      OperationalExpense.findById = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await operationalExpenseController.updateOperationalExpense(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('deleteOperationalExpense', () => {
    test('should delete an operational expense successfully', async () => {
      // Mock request
      req = mockRequest({}, {}, { id: mockOperationalExpense._id.toString() });

      // Mock OperationalExpense.findById to return an expense
      OperationalExpense.findById = jest.fn().mockResolvedValue(mockOperationalExpense);

      // Mock OperationalExpense.findByIdAndDelete
      OperationalExpense.findByIdAndDelete = jest.fn().mockResolvedValue(mockOperationalExpense);

      // Execute the controller
      await operationalExpenseController.deleteOperationalExpense(req, res);

      // Assertions
      expect(OperationalExpense.findById).toHaveBeenCalledWith(mockOperationalExpense._id.toString());
      expect(OperationalExpense.findByIdAndDelete).toHaveBeenCalledWith(mockOperationalExpense._id.toString());
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.OPERATIONAL_EXPENSE_DELETED });
    });

    test('should return 404 if operational expense not found', async () => {
      // Mock request
      req = mockRequest({}, {}, { id: 'nonexistent-id' });

      // Mock OperationalExpense.findById to return null
      OperationalExpense.findById = jest.fn().mockResolvedValue(null);

      // Execute the controller
      await operationalExpenseController.deleteOperationalExpense(req, res);

      // Assertions
      expect(OperationalExpense.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.OPERATIONAL_EXPENSE_NOT_FOUND });
    });

    test('should handle server errors', async () => {
      // Mock request
      req = mockRequest({}, {}, { id: mockOperationalExpense._id.toString() });

      // Mock OperationalExpense.findById to throw an error
      const errorMessage = 'Database connection error';
      OperationalExpense.findById = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await operationalExpenseController.deleteOperationalExpense(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
});
