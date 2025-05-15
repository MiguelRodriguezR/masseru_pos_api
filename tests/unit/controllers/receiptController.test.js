// Imports
const mongoose = require('mongoose');
const receiptController = require('../../../controllers/receiptController');
const Receipt = require('../../../models/Receipt');
const Sale = require('../../../models/Sale');
const generateReceipt = require('../../../utils/receiptGenerator');
const { mockRequest, mockResponse } = require('../../mocks/mockUtils');
const { mockReceipt, mockReceiptWithPopulatedSale } = require('../../mocks/receiptMock');
const { mockCashSale } = require('../../mocks/saleMock');

// Mock the mongoose models and utilities
jest.mock('../../../models/Receipt');
jest.mock('../../../models/Sale');
jest.mock('../../../utils/receiptGenerator');

describe('Receipt Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
    req = mockRequest();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getReceipt', () => {
    test('should return an existing receipt if found', async () => {
      // Mock request with sale ID
      req = mockRequest({}, {}, { saleId: mockCashSale._id.toString() });

      // Mock Receipt.findOne to return a receipt
      Receipt.findOne = jest.fn().mockResolvedValue(mockReceipt);

      // Execute the controller
      await receiptController.getReceipt(req, res);

      // Assertions
      expect(Receipt.findOne).toHaveBeenCalledWith({ sale: mockCashSale._id.toString() });
      expect(res.json).toHaveBeenCalledWith(mockReceipt);
    });

    test('should handle server errors', async () => {
      // Mock request with sale ID
      req = mockRequest({}, {}, { saleId: mockCashSale._id.toString() });

      // Mock Receipt.findOne to throw an error
      const errorMessage = 'Database connection error';
      Receipt.findOne = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await receiptController.getReceipt(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
});
