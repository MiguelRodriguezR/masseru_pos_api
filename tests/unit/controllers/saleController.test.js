// Imports
const mongoose = require('mongoose');
const saleController = require('../../../controllers/saleController');
const Sale = require('../../../models/Sale');
const Product = require('../../../models/Product');
const PosSession = require('../../../models/PosSession');
const { MESSAGES } = require('../../../config/messages');
// Note: posSessionController import might be removed or changed below based on new mocking strategy
const { mockRequest, mockResponse } = require('../../mocks/mockUtils');
const { 
  mockCashSale, 
  mockCardSale, 
  mockMixedPaymentSale,
  mockCashSaleWithChange
} = require('../../mocks/saleMock');
const { mockProduct, mockProductWithVariants } = require('../../mocks/productMock');
const { mockCashPaymentMethod } = require('../../mocks/paymentMethodMock');
const { mockUser } = require('../../mocks/userMock');

// Mock the mongoose models and controllers
jest.mock('../../../models/Sale');
jest.mock('../../../models/Product');
jest.mock('../../../models/PosSession');
jest.mock('../../../controllers/posSessionController', () => ({
  addSaleToSession: jest.fn()
}));
const { addSaleToSession } = require('../../../controllers/posSessionController'); // Import the mock

describe('Sale Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
    req = mockRequest();
    // THIS NEEDS TO BE ADDED AS A MOCK IN THE MOCKS FOLDER
    //PosSession.findOne = jest.fn().mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createSale', () => {
    test('should create a sale successfully with cash payment', async () => {
      const cashPaymentMethodIdString = mockCashPaymentMethod._id.toString(); // Capture ID string once

      // Mock sale data
      const saleData = {
        items: [
          {
            productId: mockProduct._id.toString(),
            quantity: 2
          }
        ],
        paymentDetails: [
          {
            paymentMethod: cashPaymentMethodIdString, // Use captured string
            amount: 120
          }
        ]
      };

      // Mock request with user
      req = mockRequest(saleData, { id: mockUser._id.toString() });

      // Mock Product.findById to return a product with sufficient inventory
      Product.findById = jest.fn().mockResolvedValue({
        ...mockProduct,
        salePrice: 50, // Override salePrice to align with test's expected totalAmount
        quantity: 50,
        save: jest.fn().mockResolvedValue({
          ...mockProduct,
          salePrice: 50, // Ensure consistent salePrice after save if it were re-read (though not in this flow)
          quantity: 48 // After deducting 2
        })
      });

      // Define fixed values for the sale instance for consistent testing
      const saleId = new mongoose.Types.ObjectId();
      const saleDate = new Date('2023-01-01T10:30:00Z'); // Consistent with mockCashSale or a chosen fixed date
      const saleCreatedAt = new Date('2024-01-01T12:00:00Z'); // Chosen fixed date
      const saleUpdatedAt = saleCreatedAt;

      // This is the plain object that mockSaleDoc.toJSON() will return
      const expectedSaleJSON = {
        _id: saleId.toString(),
        user: mockUser._id.toString(), // Assuming User ID is converted to string
        items: [
          {
            product: mockProduct._id.toString(), // Assuming Product ID is converted to string
            quantity: 2,
            salePrice: 50,
            discounts: []
          }
        ],
        totalAmount: 100,
        paymentDetails: [
          {
            paymentMethod: cashPaymentMethodIdString, // Use captured string
            amount: 120
          }
        ],
        totalPaymentAmount: 120,
        changeAmount: 20,
        saleDate: saleDate.toISOString(),
        createdAt: saleCreatedAt.toISOString(),
        updatedAt: saleUpdatedAt.toISOString()
      };

      // This is the mock Mongoose document instance
      const mockSaleDoc = {
        _id: saleId, // ObjectId
        user: mockUser._id, // ObjectId
        items: [
          {
            product: mockProduct._id, // ObjectId
            quantity: 2,
            salePrice: 50,
            discounts: []
          }
        ],
        totalAmount: 100,
        paymentDetails: [
          {
            paymentMethod: mockCashPaymentMethod._id, // ObjectId
            amount: 120
          }
        ],
        totalPaymentAmount: 120,
        changeAmount: 20,
        saleDate: saleDate, // Date object
        createdAt: saleCreatedAt, // Date object
        updatedAt: saleUpdatedAt, // Date object
        // save will be configured after mockSaleDoc is defined
        toJSON: jest.fn().mockReturnValue(expectedSaleJSON) // toJSON() returns the plain object
      };
      mockSaleDoc.save = jest.fn().mockResolvedValue(mockSaleDoc); // Configure save to resolve with the instance itself
      Sale.mockImplementation(() => mockSaleDoc);

      // Mock addSaleToSession to return true
      addSaleToSession.mockResolvedValue(true);

      // Execute the controller
      await saleController.createSale(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith(mockProduct._id.toString());
      expect(Sale).toHaveBeenCalledWith(expect.objectContaining({
        user: mockUser._id.toString(), // Controller uses string ID from req.user.id
        items: expect.arrayContaining([
          expect.objectContaining({ product: mockProduct._id, quantity: 2, salePrice: 50 })
        ]),
        totalAmount: 100,
        paymentDetails: expect.arrayContaining([
          expect.objectContaining({ paymentMethod: cashPaymentMethodIdString, amount: 120 }) // Use captured string
        ]),
        totalPaymentAmount: 120,
        changeAmount: 20
      }));
      expect(addSaleToSession).toHaveBeenCalledWith(
        saleId, // Check with the ObjectId
        mockUser._id.toString()
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        msg: MESSAGES.SALE_CREATED,
        sale: expect.any(Object),
        addedToSession: true
      }));
    });

    test('should create a sale with product variants', async () => {
      // Mock sale data with variant
      const saleData = {
        items: [
          {
            productId: mockProductWithVariants._id.toString(),
            quantity: 2,
            variant: {
              color: 'Red',
              size: 'M'
            }
          }
        ],
        paymentDetails: [
          {
            paymentMethod: mockCashPaymentMethod._id.toString(),
            amount: 300
          }
        ]
      };

      // Mock request with user
      req = mockRequest(saleData, { id: mockUser._id.toString() });

      // Mock Product.findById to return a product with variants and sufficient inventory
      const productWithVariants = {
        ...mockProductWithVariants,
        quantity: 100,
        variants: [
          {
            color: 'Red',
            size: 'M',
            quantity: 30
          },
          {
            color: 'Blue',
            size: 'L',
            quantity: 20
          }
        ],
        save: jest.fn().mockResolvedValue({
          ...mockProductWithVariants,
          quantity: 98, // After deducting 2
          variants: [
            {
              color: 'Red',
              size: 'M',
              quantity: 28 // After deducting 2
            },
            {
              color: 'Blue',
              size: 'L',
              quantity: 20
            }
          ]
        })
      };
      Product.findById = jest.fn().mockResolvedValue(productWithVariants);

      // Mock Sale constructor and save method
      const savedSale = {
        _id: new mongoose.Types.ObjectId(),
        user: mockUser._id,
        items: [
          {
            product: mockProductWithVariants._id,
            quantity: 2,
            variant: {
              color: 'Red',
              size: 'M'
            },
            salePrice: 150,
            discounts: []
          }
        ],
        totalAmount: 300,
        paymentDetails: [
          {
            paymentMethod: mockCashPaymentMethod._id,
            amount: 300
          }
        ],
        totalPaymentAmount: 300,
        changeAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock Sale constructor to return savedSale with proper structure
      const mockSaleInstance = {
        ...savedSale,
        save: jest.fn().mockResolvedValue(savedSale),
        toJSON: jest.fn().mockReturnValue(savedSale) // Ensure toJSON is present
      };
      Sale.mockImplementation(() => mockSaleInstance); // Ensure Sale constructor is a jest.fn()

      // Mock addSaleToSession to return true
      addSaleToSession.mockResolvedValue(true);

      // Execute the controller
      await saleController.createSale(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith(mockProductWithVariants._id.toString());
      expect(productWithVariants.variants[0].quantity).toBe(28); // Verify variant quantity was updated
      expect(productWithVariants.quantity).toBe(98); // Verify total quantity was updated
      expect(productWithVariants.save).toHaveBeenCalled();
      expect(Sale).toHaveBeenCalledWith(expect.objectContaining({
        user: mockUser._id.toString(),
        items: expect.arrayContaining([
          expect.objectContaining({
            product: mockProductWithVariants._id,
            quantity: 2,
            variant: {
              color: 'Red',
              size: 'M'
            },
            salePrice: 150
          })
        ]),
        totalAmount: 300,
        paymentDetails: expect.arrayContaining([
          expect.objectContaining({
            paymentMethod: mockCashPaymentMethod._id.toString(),
            amount: 300
          })
        ]),
        totalPaymentAmount: 300,
        changeAmount: 0
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ // Use expect.objectContaining for flexibility
        msg: 'Venta creada',
        sale: expect.objectContaining(savedSale), // Ensure sale object matches
        addedToSession: true
      }));
    });

    test('should create a sale with discounts', async () => {
      // Mock sale data with discounts
      const saleData = {
        items: [
          {
            productId: mockProduct._id.toString(),
            quantity: 2,
            discounts: [
              {
                type: 'percentage',
                value: 10,
                reason: '10% discount'
              }
            ]
          }
        ],
        paymentDetails: [
          {
            paymentMethod: mockCashPaymentMethod._id.toString(),
            amount: 90
          }
        ]
      };

      // Mock request with user
      req = mockRequest(saleData, { id: mockUser._id.toString() });

      // Mock Product.findById to return a product with sufficient inventory
      Product.findById = jest.fn().mockResolvedValue({
        ...mockProduct,
        salePrice: 50, // Override salePrice to align with test's expected totalAmount after discount
        quantity: 50,
        save: jest.fn().mockResolvedValue({
          ...mockProduct,
          salePrice: 50, // Ensure consistent salePrice after save
          quantity: 48 // After deducting 2
        })
      });

      // Mock Sale constructor and save method
      const savedSale = {
        _id: new mongoose.Types.ObjectId(),
        user: mockUser._id,
        items: [
          {
            product: mockProduct._id,
            quantity: 2,
            salePrice: 45, // 50 - 10%
            discounts: [
              {
                type: 'percentage',
                value: 10,
                reason: '10% discount'
              }
            ]
          }
        ],
        totalAmount: 90,
        paymentDetails: [
          {
            paymentMethod: mockCashPaymentMethod._id,
            amount: 90
          }
        ],
        totalPaymentAmount: 90,
        changeAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock Sale constructor to return savedSale with proper structure
      const mockSaleInstance = {
        ...savedSale,
        save: jest.fn().mockResolvedValue(savedSale),
        toJSON: jest.fn().mockReturnValue(savedSale) // Ensure toJSON is present
      };
      Sale.mockImplementation(() => mockSaleInstance); // Ensure Sale constructor is a jest.fn()

      // Mock addSaleToSession to return true
      addSaleToSession.mockResolvedValue(true);

      // Execute the controller
      await saleController.createSale(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith(mockProduct._id.toString());
      expect(Sale).toHaveBeenCalledWith(expect.objectContaining({
        user: mockUser._id.toString(),
        items: expect.arrayContaining([
          expect.objectContaining({
            product: mockProduct._id,
            quantity: 2,
            salePrice: 45,
            discounts: expect.arrayContaining([
              expect.objectContaining({
                type: 'percentage',
                value: 10,
                reason: '10% discount'
              })
            ])
          })
        ]),
        totalAmount: 90,
        paymentDetails: expect.arrayContaining([
          expect.objectContaining({
            paymentMethod: mockCashPaymentMethod._id.toString(),
            amount: 90
          })
        ]),
        totalPaymentAmount: 90,
        changeAmount: 0
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ // Use expect.objectContaining for flexibility
        msg: 'Venta creada',
        sale: expect.objectContaining(savedSale), // Ensure sale object matches
        addedToSession: true
      }));
    });

    test('should return 400 if items are missing', async () => {
      // Mock sale data without items
      const saleData = {
        paymentDetails: [
          {
            paymentMethod: mockCashPaymentMethod._id.toString(),
            amount: 100
          }
        ]
      };

      // Mock request
      req = mockRequest(saleData, { id: mockUser._id.toString() });

      // Execute the controller
      await saleController.createSale(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.MISSING_ITEMS });
    });

    test('should return 400 if payment details are missing', async () => {
      // Mock sale data without payment details
      const saleData = {
        items: [
          {
            productId: mockProduct._id.toString(),
            quantity: 2
          }
        ]
      };

      // Mock request
      req = mockRequest(saleData, { id: mockUser._id.toString() });

      // Execute the controller
      await saleController.createSale(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.MISSING_PAYMENTS });
    });

    test('should return 400 if payment method is missing', async () => {
      // Mock sale data with invalid payment details
      const saleData = {
        items: [
          {
            productId: mockProduct._id.toString(),
            quantity: 2
          }
        ],
        paymentDetails: [
          {
            // Missing paymentMethod
            amount: 100
          }
        ]
      };

      // Mock request
      req = mockRequest(saleData, { id: mockUser._id.toString() });

      // Execute the controller
      await saleController.createSale(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.INVALID_PAYMENT_METHOD});
    });

    test('should return 400 if payment amount is invalid', async () => {
      // Mock sale data with invalid payment amount
      const saleData = {
        items: [
          {
            productId: mockProduct._id.toString(),
            quantity: 2
          }
        ],
        paymentDetails: [
          {
            paymentMethod: mockCashPaymentMethod._id.toString(),
            amount: 0 // Invalid amount
          }
        ]
      };

      // Mock request
      req = mockRequest(saleData, { id: mockUser._id.toString() });

      // Execute the controller
      await saleController.createSale(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.INVALID_PAYMENT_AMOUNT });
    });

    test('should return 404 if product not found', async () => {
      // Mock sale data with non-existent product
      const saleData = {
        items: [
          {
            productId: 'nonexistent-id',
            quantity: 2
          }
        ],
        paymentDetails: [
          {
            paymentMethod: mockCashPaymentMethod._id.toString(),
            amount: 100
          }
        ]
      };

      // Mock request
      req = mockRequest(saleData, { id: mockUser._id.toString() });

      // Mock Product.findById to return null
      Product.findById = jest.fn().mockResolvedValue(null);

      // Execute the controller
      await saleController.createSale(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: `${MESSAGES.PRODUCT_NOT_FOUND}: nonexistent-id` });
    });

    test('should return 400 if insufficient inventory', async () => {
      // Mock sale data
      const saleData = {
        items: [
          {
            productId: mockProduct._id.toString(),
            quantity: 100 // More than available
          }
        ],
        paymentDetails: [
          {
            paymentMethod: mockCashPaymentMethod._id.toString(),
            amount: 5000
          }
        ]
      };

      // Mock request
      req = mockRequest(saleData, { id: mockUser._id.toString() });

      // Mock Product.findById to return a product with insufficient inventory
      Product.findById = jest.fn().mockResolvedValue({
        ...mockProduct,
        quantity: 50 // Less than requested
      });

      // Execute the controller
      await saleController.createSale(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith(mockProduct._id.toString());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: `Inventario insuficiente para el producto ${mockProduct.name}` });
    });

    test('should return 400 if insufficient variant inventory', async () => {
      // Mock sale data with variant
      const saleData = {
        items: [
          {
            productId: mockProductWithVariants._id.toString(),
            quantity: 50, // More than available in variant
            variant: {
              color: 'Red',
              size: 'M'
            }
          }
        ],
        paymentDetails: [
          {
            paymentMethod: mockCashPaymentMethod._id.toString(),
            amount: 7500
          }
        ]
      };

      // Mock request
      req = mockRequest(saleData, { id: mockUser._id.toString() });

      // Mock Product.findById to return a product with insufficient variant inventory
      Product.findById = jest.fn().mockResolvedValue({
        ...mockProductWithVariants,
        quantity: 100, // Sufficient total inventory
        variants: [
          {
            color: 'Red',
            size: 'M',
            quantity: 30 // Less than requested
          }
        ]
      });

      // Execute the controller
      await saleController.createSale(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith(mockProductWithVariants._id.toString());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: `Inventario insuficiente para la variante del producto ${mockProductWithVariants.name}` });
    });

    test('should return 400 if variant not found', async () => {
      // Mock sale data with non-existent variant
      const saleData = {
        items: [
          {
            productId: mockProductWithVariants._id.toString(),
            quantity: 2,
            variant: {
              color: 'Green', // Non-existent color
              size: 'S'
            }
          }
        ],
        paymentDetails: [
          {
            paymentMethod: mockCashPaymentMethod._id.toString(),
            amount: 300
          }
        ]
      };

      // Mock request
      req = mockRequest(saleData, { id: mockUser._id.toString() });

      // Mock Product.findById to return a product without the requested variant
      Product.findById = jest.fn().mockResolvedValue({
        ...mockProductWithVariants,
        quantity: 100,
        variants: [
          {
            color: 'Red',
            size: 'M',
            quantity: 30
          },
          {
            color: 'Blue',
            size: 'L',
            quantity: 20
          }
        ]
      });

      // Execute the controller
      await saleController.createSale(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith(mockProductWithVariants._id.toString());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: `Variante no encontrada para el producto ${mockProductWithVariants.name}` });
    });

    test('should return 400 if payment amount is insufficient', async () => {
      // Mock sale data with insufficient payment
      const saleData = {
        items: [
          {
            productId: mockProduct._id.toString(),
            quantity: 2
          }
        ],
        paymentDetails: [
          {
            paymentMethod: mockCashPaymentMethod._id.toString(),
            amount: 90 // Less than total (100)
          }
        ]
      };

      // Mock request
      req = mockRequest(saleData, { id: mockUser._id.toString() });

      // Mock Product.findById to return a product
      Product.findById = jest.fn().mockResolvedValue({
        ...mockProduct,
        quantity: 50,
        save: jest.fn().mockResolvedValue(this) // Mock save to prevent error
      });

      // Execute the controller
      await saleController.createSale(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.INSUFFICIENT_PAYMENT });
    });

    test('should handle server errors', async () => {
      // Mock sale data
      const saleData = {
        items: [
          {
            productId: mockProduct._id.toString(),
            quantity: 2
          }
        ],
        paymentDetails: [
          {
            paymentMethod: mockCashPaymentMethod._id.toString(),
            amount: 120
          }
        ]
      };

      // Mock request
      req = mockRequest(saleData, { id: mockUser._id.toString() });

      // Mock Product.findById to throw an error
      const errorMessage = 'Database connection error';
      Product.findById = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await saleController.createSale(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('getSales', () => {
    test('should get sales with pagination and date filters', async () => {
      // Mock pagination and filter parameters
      const page = 1;
      const limit = 10;
      const startDate = '2023-01-01';
      const endDate = '2023-01-31';
      req = mockRequest({}, {}, {}, { page, limit, startDate, endDate });

      // Mock Sale.countDocuments to return count
      Sale.countDocuments = jest.fn().mockResolvedValue(4);

      // Mock Sale.find with chained methods
      Sale.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          mockCashSale,
          mockCardSale,
          mockMixedPaymentSale,
          mockCashSaleWithChange
        ])
      });

      // Execute the controller
      await saleController.getSales(req, res);

      // Assertions
      expect(Sale.countDocuments).toHaveBeenCalledWith({
        saleDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      });
      expect(Sale.find).toHaveBeenCalledWith({
        saleDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      });
      expect(res.json).toHaveBeenCalledWith({
        sales: [
          mockCashSale,
          mockCardSale,
          mockMixedPaymentSale,
          mockCashSaleWithChange
        ],
        pagination: {
          total: 4,
          page,
          limit,
          pages: Math.ceil(4 / limit)
        }
      });
    });

    test('should handle search by product name', async () => {
      // Mock search parameters
      const search = 'Test Product';
      const filterBy = 'productName';
      req = mockRequest({}, {}, {}, { search, filterBy });

      // For product name search, we need to mock the full process
      // since it requires manual filtering
      Sale.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([
          {
            ...mockCashSale,
            items: [
              {
                product: {
                  name: 'Test Product',
                  barcode: '123456789'
                },
                quantity: 2,
                salePrice: 50
              }
            ]
          },
          {
            ...mockCardSale,
            items: [
              {
                product: {
                  name: 'Another Product',
                  barcode: '987654321'
                },
                quantity: 1,
                salePrice: 150
              }
            ]
          }
        ])
      });

      // Execute the controller
      await saleController.getSales(req, res);

      // Assertions
      // Only the first sale should be returned as it matches the search
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        sales: expect.arrayContaining([
          expect.objectContaining({
            items: expect.arrayContaining([
              expect.objectContaining({
                product: expect.objectContaining({
                  name: 'Test Product'
                })
              })
            ])
          })
        ]),
        pagination: expect.any(Object)
      }));
      // The second sale should not be included
      expect(res.json.mock.calls[0][0].sales.length).toBe(1);
    });

    test('should handle server errors', async () => {
      // Mock Sale.countDocuments to throw an error
      const errorMessage = 'Database connection error';
      
      // Mock the error in a way that matches how the controller will handle it
      Sale.countDocuments = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await saleController.getSales(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('getSaleById', () => {
    test('should get a sale by ID successfully', async () => {
      // Mock request with sale ID
      req = mockRequest({}, {}, { id: mockCashSale._id.toString() });

      // Mock full populate chain exactly as in controller
      const mockPopulatedSale = {
        ...mockCashSale,
        populate: jest.fn().mockReturnThis(), // Initial populate
      };
      // Chain populate calls
      mockPopulatedSale.populate
        .mockReturnValueOnce(mockPopulatedSale) // user
        .mockReturnValueOnce(mockPopulatedSale) // items.product
        .mockReturnValueOnce(Promise.resolve(mockCashSale)); // paymentDetails.paymentMethod and resolve

      Sale.findById = jest.fn().mockReturnValue(mockPopulatedSale);

      // Execute the controller
      await saleController.getSaleById(req, res);

      // Assertions
      expect(Sale.findById).toHaveBeenCalledWith(mockCashSale._id.toString());
      expect(res.json).toHaveBeenCalledWith(mockCashSale);
    });

    test('should return 404 if sale not found', async () => {
      // Mock request with non-existent sale ID
      req = mockRequest({}, {}, { id: 'nonexistent-id' });

      // Mock null sale with populate chain that ultimately returns null
      const mockNullSale = {
        populate: jest.fn().mockReturnThis()
      };
      Sale.findById = jest.fn().mockReturnValue(mockNullSale);
      mockNullSale.populate
        .mockReturnValueOnce(mockNullSale)
        .mockReturnValueOnce(mockNullSale)
        .mockResolvedValue(null);

      // Execute the controller
      await saleController.getSaleById(req, res);

      // Assertions
      expect(Sale.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.SALE_NOT_FOUND });
    });

    test('should handle server errors', async () => {
      // Mock request with sale ID
      req = mockRequest({}, {}, { id: mockCashSale._id.toString() });

      // Mock Sale.findById to throw an error
      const errorMessage = 'Database connection error';
      Sale.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockImplementation(() => {
          throw new Error(errorMessage);
        })
      });

      // Execute the controller
      await saleController.getSaleById(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
});
