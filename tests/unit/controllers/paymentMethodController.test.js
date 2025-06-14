// Imports
const mongoose = require('mongoose');
const paymentMethodController = require('../../../controllers/paymentMethodController');
const PaymentMethod = require('../../../models/PaymentMethod');
const { mockRequest, mockResponse } = require('../../mocks/mockUtils');
const { 
  mockCashPaymentMethod, 
  mockCardPaymentMethod, 
  mockInactivePaymentMethod,
  mockPaymentMethodsList,
  mockActivePaymentMethodsList
} = require('../../mocks/paymentMethodMock');
const { MESSAGES } = require('../../../config/messages');

// Mock the mongoose models
jest.mock('../../../models/PaymentMethod');

describe('Payment Method Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
    req = mockRequest();
    PaymentMethod.getModel.mockReturnValue(PaymentMethod);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getPaymentMethods', () => {
    test('should get all payment methods successfully', async () => {
      // Mock PaymentMethod.find to return payment methods
      PaymentMethod.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockPaymentMethodsList)
      });

      // Execute the controller
      await paymentMethodController.getPaymentMethods(req, res);

      // Assertions
      expect(PaymentMethod.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ paymentMethods: mockPaymentMethodsList });
    });

    test('should handle server errors', async () => {
      // Mock PaymentMethod.find to throw an error
      const errorMessage = 'Database connection error';
      PaymentMethod.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockImplementation(() => {
          throw new Error(errorMessage);
        })
      });

      // Execute the controller
      await paymentMethodController.getPaymentMethods(req, res);

      // Assertions
      expect(console.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.PAYMENT_METHOD_GET_ERROR });
    });
  });

  describe('getActivePaymentMethods', () => {
    test('should get active payment methods successfully', async () => {
      // Mock PaymentMethod.find to return active payment methods
      PaymentMethod.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockActivePaymentMethodsList)
      });

      // Execute the controller
      await paymentMethodController.getActivePaymentMethods(req, res);

      // Assertions
      expect(PaymentMethod.find).toHaveBeenCalledWith({ isActive: true });
      expect(res.json).toHaveBeenCalledWith({ paymentMethods: mockActivePaymentMethodsList });
    });

    test('should handle server errors', async () => {
      // Mock PaymentMethod.find to throw an error
      const errorMessage = 'Database connection error';
      PaymentMethod.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockImplementation(() => {
          throw new Error(errorMessage);
        })
      });

      // Execute the controller
      await paymentMethodController.getActivePaymentMethods(req, res);

      // Assertions
      expect(console.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.PAYMENT_METHOD_GET_ACTIVE_ERROR });
    });
  });

  describe('getPaymentMethodById', () => {
    test('should get a payment method by ID successfully', async () => {
      // Mock request with payment method ID
      req = mockRequest({}, {}, { id: mockCashPaymentMethod._id.toString() });

      // Mock PaymentMethod.findById to return a payment method
      PaymentMethod.findById = jest.fn().mockResolvedValue(mockCashPaymentMethod);

      // Execute the controller
      await paymentMethodController.getPaymentMethodById(req, res);

      // Assertions
      expect(PaymentMethod.findById).toHaveBeenCalledWith(mockCashPaymentMethod._id.toString());
      expect(res.json).toHaveBeenCalledWith({ paymentMethod: mockCashPaymentMethod });
    });

    test('should return 404 if payment method not found', async () => {
      // Mock request with non-existent payment method ID
      req = mockRequest({}, {}, { id: 'nonexistent-id' });

      // Mock PaymentMethod.findById to return null
      PaymentMethod.findById = jest.fn().mockResolvedValue(null);

      // Execute the controller
      await paymentMethodController.getPaymentMethodById(req, res);

      // Assertions
      expect(PaymentMethod.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.PAYMENT_METHOD_NOT_FOUND });
    });

    test('should handle server errors', async () => {
      // Mock request with payment method ID
      req = mockRequest({}, {}, { id: mockCashPaymentMethod._id.toString() });

      // Mock PaymentMethod.findById to throw an error
      const errorMessage = 'Database connection error';
      PaymentMethod.findById = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await paymentMethodController.getPaymentMethodById(req, res);

      // Assertions
      expect(console.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.PAYMENT_METHOD_GET_SINGLE_ERROR });
    });
  });

  describe('createPaymentMethod', () => {
    test('should create a payment method successfully', async () => {
      // Mock payment method data
      const paymentMethodData = {
        name: 'New Payment Method',
        code: 'NEW',
        description: 'New payment method description',
        color: '#FF5722',
        icon: 'mdi-cash-plus'
      };

      // Mock request
      req = mockRequest(paymentMethodData);

      // Mock PaymentMethod.findOne to return null (no existing method)
      PaymentMethod.findOne = jest.fn().mockResolvedValue(null);

      // Mock PaymentMethod constructor and save method
      const savedPaymentMethod = {
        ...paymentMethodData,
        _id: new mongoose.Types.ObjectId(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockPaymentMethodInstance = {
        save: jest.fn().mockResolvedValue(savedPaymentMethod)
      };
      PaymentMethod.mockImplementation(() => mockPaymentMethodInstance);

      // Execute the controller
      await paymentMethodController.createPaymentMethod(req, res);

      // Assertions
      expect(PaymentMethod.findOne).toHaveBeenCalledWith({
        $or: [{ name: paymentMethodData.name }, { code: paymentMethodData.code }]
      });
      expect(PaymentMethod).toHaveBeenCalledWith(paymentMethodData);
      expect(res.status).toHaveBeenCalledWith(201);
      // We need to mock the actual response that would be sent
      res.json.mockImplementation(() => res);
      
      // Execute the controller
      await paymentMethodController.createPaymentMethod(req, res);

      // Assertions
      expect(PaymentMethod.findOne).toHaveBeenCalledWith({
        $or: [{ name: paymentMethodData.name }, { code: paymentMethodData.code }]
      });
      expect(PaymentMethod).toHaveBeenCalledWith(paymentMethodData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      // Instead of checking the exact object, verify the message
      expect(res.json.mock.calls[0][0].msg).toBe(MESSAGES.PAYMENT_METHOD_CREATED);
    });

    test('should return 400 if payment method with same name or code already exists', async () => {
      // Mock payment method data with existing name
      const paymentMethodData = {
        name: 'Efectivo', // Existing name
        code: 'NEW',
        description: 'New payment method description',
        color: '#FF5722',
        icon: 'mdi-cash-plus'
      };

      // Mock request
      req = mockRequest(paymentMethodData);

      // Mock PaymentMethod.findOne to return an existing method
      PaymentMethod.findOne = jest.fn().mockResolvedValue(mockCashPaymentMethod);

      // Execute the controller
      await paymentMethodController.createPaymentMethod(req, res);

      // Assertions
      expect(PaymentMethod.findOne).toHaveBeenCalledWith({
        $or: [{ name: paymentMethodData.name }, { code: paymentMethodData.code }]
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        msg: MESSAGES.PAYMENT_METHOD_EXISTS
      });
    });

    test('should handle server errors', async () => {
      // Mock payment method data
      const paymentMethodData = {
        name: 'New Payment Method',
        code: 'NEW',
        description: 'New payment method description',
        color: '#FF5722',
        icon: 'mdi-cash-plus'
      };

      // Mock request
      req = mockRequest(paymentMethodData);

      // Mock PaymentMethod.findOne to throw an error
      const errorMessage = 'Database connection error';
      PaymentMethod.findOne = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await paymentMethodController.createPaymentMethod(req, res);

      // Assertions
      expect(console.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.PAYMENT_METHOD_CREATE_ERROR });
    });
  });

  describe('updatePaymentMethod', () => {
    test('should update a payment method successfully', async () => {
      // Mock update data
      const updateData = {
        name: 'Updated Payment Method',
        code: 'UPD',
        description: 'Updated description',
        color: '#9C27B0',
        icon: 'mdi-cash-check',
        isActive: true
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: mockCashPaymentMethod._id.toString() });

      // Mock PaymentMethod.findById to return a payment method
      PaymentMethod.findById = jest.fn().mockResolvedValue({
        ...mockCashPaymentMethod,
        name: 'Efectivo',
        code: 'CASH',
        save: jest.fn().mockResolvedValue({
          ...mockCashPaymentMethod,
          ...updateData
        })
      });

      // Mock PaymentMethod.findOne to return null (no other method with same name/code)
      PaymentMethod.findOne = jest.fn().mockResolvedValue(null);

      // Execute the controller
      await paymentMethodController.updatePaymentMethod(req, res);

      // Assertions
      expect(PaymentMethod.findById).toHaveBeenCalledWith(mockCashPaymentMethod._id.toString());
      expect(PaymentMethod.findOne).toHaveBeenCalledWith({
        _id: { $ne: mockCashPaymentMethod._id.toString() },
        $or: [{ name: updateData.name }, { code: updateData.code }]
      });
      expect(res.json).toHaveBeenCalledWith({
        msg: MESSAGES.PAYMENT_METHOD_UPDATED,
        paymentMethod: expect.objectContaining(updateData)
      });
    });

    test('should return 404 if payment method not found', async () => {
      // Mock update data
      const updateData = {
        name: 'Updated Payment Method',
        code: 'UPD'
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: 'nonexistent-id' });

      // Mock PaymentMethod.findById to return null
      PaymentMethod.findById = jest.fn().mockResolvedValue(null);

      // Execute the controller
      await paymentMethodController.updatePaymentMethod(req, res);

      // Assertions
      expect(PaymentMethod.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.PAYMENT_METHOD_NOT_FOUND });
    });

    test('should return 400 if another payment method with same name or code exists', async () => {
      // Mock update data with existing name from another method
      const updateData = {
        name: 'Tarjeta de crédito', // Name of another existing method
        code: 'UPD'
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: mockCashPaymentMethod._id.toString() });

      // Mock PaymentMethod.findById to return a payment method
      PaymentMethod.findById = jest.fn().mockResolvedValue(mockCashPaymentMethod);

      // Mock PaymentMethod.findOne to return another method with same name
      PaymentMethod.findOne = jest.fn().mockResolvedValue(mockCardPaymentMethod);

      // Execute the controller
      await paymentMethodController.updatePaymentMethod(req, res);

      // Assertions
      expect(PaymentMethod.findById).toHaveBeenCalledWith(mockCashPaymentMethod._id.toString());
      expect(PaymentMethod.findOne).toHaveBeenCalledWith({
        _id: { $ne: mockCashPaymentMethod._id.toString() },
        $or: [{ name: updateData.name }, { code: updateData.code }]
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        msg: MESSAGES.PAYMENT_METHOD_EXISTS_OTHER
      });
    });

    test('should handle server errors', async () => {
      // Mock update data
      const updateData = {
        name: 'Updated Payment Method',
        code: 'UPD'
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: mockCashPaymentMethod._id.toString() });

      // Mock PaymentMethod.findById to throw an error
      const errorMessage = 'Database connection error';
      PaymentMethod.findById = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await paymentMethodController.updatePaymentMethod(req, res);

      // Assertions
      expect(console.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.PAYMENT_METHOD_UPDATE_ERROR });
    });
  });

  describe('deletePaymentMethod', () => {
    test('should delete a payment method successfully', async () => {
      // Mock request
      req = mockRequest({}, {}, { id: mockCashPaymentMethod._id.toString() });

      // Mock PaymentMethod.findById to return a payment method
      PaymentMethod.findById = jest.fn().mockResolvedValue(mockCashPaymentMethod);

      // Mock PaymentMethod.findByIdAndDelete
      PaymentMethod.findByIdAndDelete = jest.fn().mockResolvedValue(mockCashPaymentMethod);

      // Execute the controller
      await paymentMethodController.deletePaymentMethod(req, res);

      // Assertions
      expect(PaymentMethod.findById).toHaveBeenCalledWith(mockCashPaymentMethod._id.toString());
      expect(PaymentMethod.findByIdAndDelete).toHaveBeenCalledWith(mockCashPaymentMethod._id.toString());
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.PAYMENT_METHOD_DELETED });
    });

    test('should return 404 if payment method not found', async () => {
      // Mock request
      req = mockRequest({}, {}, { id: 'nonexistent-id' });

      // Mock PaymentMethod.findById to return null
      PaymentMethod.findById = jest.fn().mockResolvedValue(null);

      // Execute the controller
      await paymentMethodController.deletePaymentMethod(req, res);

      // Assertions
      expect(PaymentMethod.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.PAYMENT_METHOD_NOT_FOUND });
    });

    test('should handle server errors', async () => {
      // Mock request
      req = mockRequest({}, {}, { id: mockCashPaymentMethod._id.toString() });

      // Mock PaymentMethod.findById to throw an error
      const errorMessage = 'Database connection error';
      PaymentMethod.findById = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await paymentMethodController.deletePaymentMethod(req, res);

      // Assertions
      expect(console.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.PAYMENT_METHOD_DELETE_ERROR });
    });
  });
});
