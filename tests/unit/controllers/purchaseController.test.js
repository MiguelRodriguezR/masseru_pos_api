// Imports
const mongoose = require('mongoose');
const purchaseController = require('../../../controllers/purchaseController');
const Purchase = require('../../../models/Purchase');
const Product = require('../../../models/Product');
const { mockRequest, mockResponse } = require('../../mocks/mockUtils');
const { 
  mockPurchase, 
  mockPurchaseWithPopulatedProducts, 
  mockPurchase2,
  mockPurchasesList
} = require('../../mocks/purchaseMock');
const { mockProduct, mockProductWithVariants } = require('../../mocks/productMock');
const { mockUser } = require('../../mocks/userMock');

// Mock the mongoose models
jest.mock('../../../models/Purchase');
jest.mock('../../../models/Product');

describe('Purchase Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
    req = mockRequest();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getPurchases', () => {
    test('should get purchases with pagination and search', async () => {
      // Mock pagination and search parameters
      const page = 1;
      const limit = 10;
      const search = 'supplier';
      req = mockRequest({}, {}, {}, { page, limit, search });

      // Mock Purchase.countDocuments to return count
      Purchase.countDocuments = jest.fn().mockResolvedValue(2);

      // Mock Purchase.find with chained methods
      Purchase.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockPurchasesList)
      });

      // Execute the controller
      await purchaseController.getPurchases(req, res);

      // Assertions
      expect(Purchase.countDocuments).toHaveBeenCalledWith({
        $or: [
          { supplier: { $regex: search, $options: 'i' } },
          { invoiceNumber: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } }
        ]
      });
      expect(Purchase.find).toHaveBeenCalledWith({
        $or: [
          { supplier: { $regex: search, $options: 'i' } },
          { invoiceNumber: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } }
        ]
      });
      expect(res.json).toHaveBeenCalledWith({
        purchases: mockPurchasesList,
        pagination: {
          total: 2,
          page,
          limit,
          pages: Math.ceil(2 / limit)
        }
      });
    });

    test('should get all purchases without search', async () => {
      // Mock pagination parameters without search
      const page = 1;
      const limit = 10;
      req = mockRequest({}, {}, {}, { page, limit });

      // Mock Purchase.countDocuments to return count
      Purchase.countDocuments = jest.fn().mockResolvedValue(2);

      // Mock Purchase.find with chained methods
      Purchase.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockPurchasesList)
      });

      // Execute the controller
      await purchaseController.getPurchases(req, res);

      // Assertions
      expect(Purchase.countDocuments).toHaveBeenCalledWith({});
      expect(Purchase.find).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith({
        purchases: mockPurchasesList,
        pagination: {
          total: 2,
          page,
          limit,
          pages: Math.ceil(2 / limit)
        }
      });
    });

    test('should handle server errors', async () => {
      // Mock Purchase.countDocuments to throw an error
      const errorMessage = 'Database connection error';
      Purchase.countDocuments = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await purchaseController.getPurchases(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('getPurchaseById', () => {
    test('should get a purchase by ID successfully', async () => {
      // Mock request with purchase ID
      req = mockRequest({}, {}, { id: mockPurchase._id.toString() });

      // Mock Purchase.findById with chained populate
      const populateMock = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPurchaseWithPopulatedProducts)
      });
      Purchase.findById = jest.fn().mockReturnValue({
        populate: populateMock
      });

      // Execute the controller
      await purchaseController.getPurchaseById(req, res);

      // Assertions
      expect(Purchase.findById).toHaveBeenCalledWith(mockPurchase._id.toString());
      expect(res.json).toHaveBeenCalledWith(mockPurchaseWithPopulatedProducts);
    });

    test('should return 404 if purchase not found', async () => {
      // Mock request with non-existent purchase ID
      req = mockRequest({}, {}, { id: 'nonexistent-id' });

      // Mock Purchase.findById to return null
      const populateMock = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });
      Purchase.findById = jest.fn().mockReturnValue({
        populate: populateMock
      });

      // Execute the controller
      await purchaseController.getPurchaseById(req, res);

      // Assertions
      expect(Purchase.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Compra no encontrada' });
    });

    test('should handle server errors', async () => {
      // Mock request with purchase ID
      req = mockRequest({}, {}, { id: mockPurchase._id.toString() });

      // Mock Purchase.findById to throw an error
      const errorMessage = 'Database connection error';
      const populateMock = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });
      Purchase.findById = jest.fn().mockReturnValue({
        populate: populateMock
      });

      // Execute the controller
      await purchaseController.getPurchaseById(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('createPurchase', () => {
    test('should create a purchase successfully', async () => {
      // Mock purchase data
      const purchaseData = {
        items: [
          {
            product: mockProduct._id.toString(),
            quantity: 10,
            purchasePrice: 50
          },
          {
            product: mockProductWithVariants._id.toString(),
            quantity: 5,
            purchasePrice: 80
          }
        ],
        supplier: 'Test Supplier',
        invoiceNumber: 'INV-001',
        notes: 'Test purchase'
      };

      // Mock request with user
      req = mockRequest(purchaseData, { id: mockUser._id.toString() });

      // Mock Product.findById to return products
      Product.findById = jest.fn()
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(mockProductWithVariants);

      // Mock Purchase constructor and save method
      const savedPurchase = {
        ...purchaseData,
        _id: new mongoose.Types.ObjectId(),
        total: 900, // (10 * 50) + (5 * 80)
        createdBy: mockUser._id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockPurchaseInstance = {
        save: jest.fn().mockResolvedValue(savedPurchase)
      };
      Purchase.mockImplementation(() => mockPurchaseInstance);

      // Execute the controller
      await purchaseController.createPurchase(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith(mockProduct._id.toString());
      expect(Product.findById).toHaveBeenCalledWith(mockProductWithVariants._id.toString());
      expect(Purchase).toHaveBeenCalledWith({
        items: purchaseData.items,
        total: 900,
        supplier: purchaseData.supplier,
        invoiceNumber: purchaseData.invoiceNumber,
        notes: purchaseData.notes,
        createdBy: mockUser._id.toString()
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Compra creada',
        purchase: mockPurchaseInstance
      });
    });

    test('should return 400 if items are missing', async () => {
      // Mock purchase data without items
      const purchaseData = {
        supplier: 'Test Supplier',
        invoiceNumber: 'INV-001',
        notes: 'Test purchase'
      };

      // Mock request
      req = mockRequest(purchaseData, { id: mockUser._id.toString() });

      // Execute the controller
      await purchaseController.createPurchase(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Debe incluir al menos un producto' });
    });

    test('should return 400 if item is missing required fields', async () => {
      // Mock purchase data with invalid item
      const purchaseData = {
        items: [
          {
            product: mockProduct._id.toString(),
            // Missing quantity
            purchasePrice: 50
          }
        ],
        supplier: 'Test Supplier',
        invoiceNumber: 'INV-001',
        notes: 'Test purchase'
      };

      // Mock request
      req = mockRequest(purchaseData, { id: mockUser._id.toString() });

      // Execute the controller
      await purchaseController.createPurchase(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Cada item debe tener product, quantity y purchasePrice' });
    });

    test('should return 400 if product not found', async () => {
      // Mock purchase data with non-existent product
      const purchaseData = {
        items: [
          {
            product: 'nonexistent-id',
            quantity: 10,
            purchasePrice: 50
          }
        ],
        supplier: 'Test Supplier',
        invoiceNumber: 'INV-001',
        notes: 'Test purchase'
      };

      // Mock request
      req = mockRequest(purchaseData, { id: mockUser._id.toString() });

      // Mock Product.findById to return null
      Product.findById = jest.fn().mockResolvedValue(null);

      // Execute the controller
      await purchaseController.createPurchase(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Producto no encontrado: nonexistent-id' });
    });

    test('should handle server errors', async () => {
      // Mock purchase data
      const purchaseData = {
        items: [
          {
            product: mockProduct._id.toString(),
            quantity: 10,
            purchasePrice: 50
          }
        ],
        supplier: 'Test Supplier',
        invoiceNumber: 'INV-001',
        notes: 'Test purchase'
      };

      // Mock request
      req = mockRequest(purchaseData, { id: mockUser._id.toString() });

      // Mock Product.findById to throw an error
      const errorMessage = 'Database connection error';
      Product.findById = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await purchaseController.createPurchase(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('updatePurchase', () => {
    test('should update a purchase successfully', async () => {
      // Mock update data
      const updateData = {
        items: [
          {
            product: mockProduct._id.toString(),
            quantity: 20,
            purchasePrice: 45
          }
        ],
        supplier: 'Updated Supplier',
        invoiceNumber: 'INV-002',
        notes: 'Updated purchase'
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: mockPurchase._id.toString() });

      // Mock Purchase.findById to return a purchase
      Purchase.findById = jest.fn().mockResolvedValue({
        ...mockPurchase,
        items: [
          {
            product: mockProduct._id,
            quantity: 10,
            purchasePrice: 50
          },
          {
            product: mockProductWithVariants._id,
            quantity: 5,
            purchasePrice: 80
          }
        ],
        save: jest.fn().mockResolvedValue({
          ...mockPurchase,
          ...updateData,
          total: 900 // 20 * 45
        })
      });

      // Mock Product.findById to return products
      Product.findById = jest.fn().mockResolvedValue(mockProduct);

      // Mock Product.findByIdAndUpdate
      Product.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      // Execute the controller
      await purchaseController.updatePurchase(req, res);

      // Assertions
      // Verify old quantities are reversed
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(mockProduct._id, {
        $inc: { quantity: -10 }
      });
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(mockProductWithVariants._id, {
        $inc: { quantity: -5 }
      });

      // Verify new quantities are applied
      expect(Product.findById).toHaveBeenCalledWith(mockProduct._id.toString());
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(mockProduct._id, {
        $inc: { quantity: -10 }
      });

      expect(res.json).toHaveBeenCalledWith({
        msg: 'Compra actualizada',
        purchase: expect.objectContaining({
          items: updateData.items,
          supplier: updateData.supplier,
          invoiceNumber: updateData.invoiceNumber,
          notes: updateData.notes,
          total: 900
        })
      });
    });

    test('should update only provided fields', async () => {
      // Mock update data with only some fields
      const updateData = {
        supplier: 'Updated Supplier',
        notes: 'Updated notes'
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: mockPurchase._id.toString() });

      // Mock Purchase.findById to return a purchase
      const purchaseToUpdate = {
        ...mockPurchase,
        supplier: mockPurchase.supplier,
        invoiceNumber: mockPurchase.invoiceNumber,
        notes: mockPurchase.notes,
        save: jest.fn().mockResolvedValue({
          ...mockPurchase,
          supplier: updateData.supplier,
          notes: updateData.notes
        })
      };
      Purchase.findById = jest.fn().mockResolvedValue(purchaseToUpdate);

      // Execute the controller
      await purchaseController.updatePurchase(req, res);

      // Assertions
      expect(Purchase.findById).toHaveBeenCalledWith(mockPurchase._id.toString());
      expect(purchaseToUpdate.supplier).toBe(updateData.supplier);
      expect(purchaseToUpdate.notes).toBe(updateData.notes);
      expect(purchaseToUpdate.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Compra actualizada',
        purchase: expect.objectContaining({
          supplier: updateData.supplier,
          notes: updateData.notes
        })
      });
    });

    test('should return 404 if purchase not found', async () => {
      // Mock update data
      const updateData = {
        supplier: 'Updated Supplier'
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: 'nonexistent-id' });

      // Mock Purchase.findById to return null
      Purchase.findById = jest.fn().mockResolvedValue(null);

      // Execute the controller
      await purchaseController.updatePurchase(req, res);

      // Assertions
      expect(Purchase.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Compra no encontrada' });
    });

    test('should return 400 if items are invalid', async () => {
      // Mock update data with invalid items
      const updateData = {
        items: [
          {
            // Missing product
            quantity: 10,
            purchasePrice: 50
          }
        ]
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: mockPurchase._id.toString() });

      // Mock Purchase.findById to return a purchase
      Purchase.findById = jest.fn().mockResolvedValue(mockPurchase);

      // Execute the controller
      await purchaseController.updatePurchase(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Cada item debe tener product, quantity y purchasePrice' });
    });

    test('should return 400 if product not found', async () => {
      // Mock update data with non-existent product
      const updateData = {
        items: [
          {
            product: 'nonexistent-id',
            quantity: 10,
            purchasePrice: 50
          }
        ]
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: mockPurchase._id.toString() });

      // Mock Purchase.findById to return a purchase
      Purchase.findById = jest.fn().mockResolvedValue({
        ...mockPurchase,
        items: [
          {
            product: mockProduct._id,
            quantity: 10,
            purchasePrice: 50
          }
        ]
      });

      // Mock Product.findById to return null for the new product
      Product.findByIdAndUpdate = jest.fn().mockResolvedValue({});
      Product.findById = jest.fn().mockResolvedValue(null);

      // Execute the controller
      await purchaseController.updatePurchase(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Producto no encontrado: nonexistent-id' });
    });

    test('should handle server errors', async () => {
      // Mock update data
      const updateData = {
        supplier: 'Updated Supplier'
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: mockPurchase._id.toString() });

      // Mock Purchase.findById to throw an error
      const errorMessage = 'Database connection error';
      Purchase.findById = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await purchaseController.updatePurchase(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('deletePurchase', () => {
    test('should delete a purchase successfully', async () => {
      // Mock request
      req = mockRequest({}, {}, { id: mockPurchase._id.toString() });

      // Mock Purchase.findById to return a purchase
      Purchase.findById = jest.fn().mockResolvedValue(mockPurchase);

      // Mock Purchase.findByIdAndDelete
      Purchase.findByIdAndDelete = jest.fn().mockResolvedValue(mockPurchase);

      // Execute the controller
      await purchaseController.deletePurchase(req, res);

      // Assertions
      expect(Purchase.findById).toHaveBeenCalledWith(mockPurchase._id.toString());
      expect(Purchase.findByIdAndDelete).toHaveBeenCalledWith(mockPurchase._id.toString());
      expect(res.json).toHaveBeenCalledWith({ msg: 'Compra eliminada' });
    });

    test('should return 404 if purchase not found', async () => {
      // Mock request
      req = mockRequest({}, {}, { id: 'nonexistent-id' });

      // Mock Purchase.findById to return null
      Purchase.findById = jest.fn().mockResolvedValue(null);

      // Execute the controller
      await purchaseController.deletePurchase(req, res);

      // Assertions
      expect(Purchase.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Compra no encontrada' });
    });

    test('should handle server errors', async () => {
      // Mock request
      req = mockRequest({}, {}, { id: mockPurchase._id.toString() });

      // Mock Purchase.findById to throw an error
      const errorMessage = 'Database connection error';
      Purchase.findById = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await purchaseController.deletePurchase(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
});
