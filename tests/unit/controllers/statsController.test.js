// Imports
const mongoose = require('mongoose');
const statsController = require('../../../controllers/statsController');
const Sale = require('../../../models/Sale');
const Product = require('../../../models/Product');
const PosSession = require('../../../models/PosSession');
const { mockRequest, mockResponse } = require('../../mocks/mockUtils');
const { MESSAGES } = require('../../../config/messages');
const { 
  mockCashSale, 
  mockCardSale, 
  mockMixedPaymentSale,
  mockPaymentMethods
} = require('../../mocks/saleMock');
const { 
  mockProduct, 
  mockProductWithVariants, 
  mockLowStockProduct,
  mockProductsList
} = require('../../mocks/productMock');
const { 
  mockPosSession, 
  mockClosedPosSession, 
  mockPosSessionsList 
} = require('../../mocks/posSessionMock');

// Mock the mongoose models
jest.mock('../../../models/Sale');
jest.mock('../../../models/Product');
jest.mock('../../../models/PosSession');

describe('Stats Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
    req = mockRequest();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getSalesStats', () => {
    test('should get sales statistics with date range and product filter', async () => {
      // Mock query parameters
      const startDate = '2023-01-01';
      const endDate = '2023-01-31';
      const productId = mockProduct._id.toString();
      req = mockRequest({}, {}, {}, { startDate, endDate, productId });

      // Mock Sale.find to return sales with populated products
      const mockSales = [
        {
          ...mockCashSale,
          items: [
            {
              product: {
                ...mockProduct,
                purchaseCost: 70
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
                ...mockProductWithVariants,
                purchaseCost: 100
              },
              quantity: 1,
              salePrice: 150
            }
          ]
        }
      ];
      Sale.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSales)
      });

      // Execute the controller
      await statsController.getSalesStats(req, res);

      // Assertions
      expect(Sale.find).toHaveBeenCalledWith({
        saleDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        'items.product': productId
      });
      expect(res.json).toHaveBeenCalledWith({
        totalSales: 2,
        totalProfit: (50 - 70) * 2 + (150 - 100) * 1, // -40 + 50 = 10
        sales: mockSales
      });
    });

    test('should get sales statistics without filters', async () => {
      // Mock Sale.find to return sales with populated products
      const mockSales = [
        {
          ...mockCashSale,
          items: [
            {
              product: {
                ...mockProduct,
                purchaseCost: 70
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
                ...mockProductWithVariants,
                purchaseCost: 100
              },
              quantity: 1,
              salePrice: 150
            }
          ]
        }
      ];
      Sale.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSales)
      });

      // Execute the controller
      await statsController.getSalesStats(req, res);

      // Assertions
      expect(Sale.find).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith({
        totalSales: 2,
        totalProfit: (50 - 70) * 2 + (150 - 100) * 1, // -40 + 50 = 10
        sales: mockSales
      });
    });

    test('should handle server errors', async () => {
      // Mock Sale.find to throw an error
      Sale.find = jest.fn().mockImplementation(() => {
        throw new Error(MESSAGES.STATS_ERROR);
      });

      // Execute the controller
      await statsController.getSalesStats(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: MESSAGES.STATS_ERROR });
    });
  });

  describe('getProductStats', () => {
    test('should get product statistics with date range', async () => {
      // Mock query parameters
      const startDate = '2023-01-01';
      const endDate = '2023-01-31';
      req = mockRequest({}, {}, {}, { startDate, endDate });

      // Mock Product.find to return products
      Product.find = jest.fn().mockResolvedValue(mockProductsList);

      // Mock Sale.find to return sales with populated products
      const mockSales = [
        {
          ...mockCashSale,
          items: [
            {
              product: {
                _id: mockProduct._id,
                name: mockProduct.name,
                purchaseCost: 70
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
                _id: mockProductWithVariants._id,
                name: mockProductWithVariants.name,
                purchaseCost: 100
              },
              quantity: 1,
              salePrice: 150
            }
          ]
        }
      ];
      Sale.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSales)
      });

      // Execute the controller
      await statsController.getProductStats(req, res);

      // Assertions
      expect(Product.find).toHaveBeenCalled();
      expect(Sale.find).toHaveBeenCalledWith({
        saleDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      });
      expect(res.json).toHaveBeenCalledWith({
        topSellingProducts: expect.any(Array),
        lowStockProducts: expect.any(Array),
        inventoryValue: expect.any(Number),
        totalProducts: mockProductsList.length
      });
      
      // Verify low stock products are included
      const response = res.json.mock.calls[0][0];
      expect(response.lowStockProducts.some(p => p.quantity < 10)).toBe(true);
      
      // Verify top selling products are sorted by quantity
      expect(response.topSellingProducts.length).toBeGreaterThan(0);
      if (response.topSellingProducts.length > 1) {
        expect(response.topSellingProducts[0].totalQuantity >= response.topSellingProducts[1].totalQuantity).toBe(true);
      }
    });

    test('should handle server errors', async () => {
      // Mock Product.find to throw an error
      Product.find = jest.fn().mockImplementation(() => {
        throw new Error(MESSAGES.STATS_ERROR);
      });

      // Execute the controller
      await statsController.getProductStats(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: MESSAGES.STATS_ERROR });
    });
  });

  describe('getCustomerStats', () => {
    test('should get customer statistics with date range', async () => {
      // Mock query parameters
      const startDate = '2023-01-01';
      const endDate = '2023-01-31';
      req = mockRequest({}, {}, {}, { startDate, endDate });

      // Mock Sale.find to return sales
      const mockSales = [
        {
          ...mockCashSale,
          totalAmount: 100,
          saleDate: new Date('2023-01-01T10:30:00Z')
        },
        {
          ...mockCardSale,
          totalAmount: 150,
          saleDate: new Date('2023-01-01T11:45:00Z')
        },
        {
          ...mockMixedPaymentSale,
          totalAmount: 200,
          saleDate: new Date('2023-01-02T14:15:00Z')
        }
      ];
      Sale.find = jest.fn().mockResolvedValue(mockSales);

      // Execute the controller
      await statsController.getCustomerStats(req, res);

      // Assertions
      expect(Sale.find).toHaveBeenCalledWith({
        saleDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      });
      expect(res.json).toHaveBeenCalledWith({
        peakHours: expect.any(Array),
        customerFlow: expect.any(Array),
        averageTicket: (100 + 150 + 200) / 3, // 150
        totalCustomers: 3
      });
      
      // Verify peak hours are sorted by count
      const response = res.json.mock.calls[0][0];
      expect(response.peakHours.length).toBeGreaterThan(0);
      if (response.peakHours.length > 1) {
        expect(response.peakHours[0].count >= response.peakHours[1].count).toBe(true);
      }
      
      // Verify customer flow has entries for each date
      expect(response.customerFlow.length).toBeGreaterThan(0);
      expect(response.customerFlow.some(cf => cf.date === '2023-01-01')).toBe(true);
      expect(response.customerFlow.some(cf => cf.date === '2023-01-02')).toBe(true);
    });

    test('should handle server errors', async () => {
      // Mock Sale.find to throw an error
      Sale.find = jest.fn().mockImplementation(() => {
        throw new Error(MESSAGES.STATS_ERROR);
      });

      // Execute the controller
      await statsController.getCustomerStats(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: MESSAGES.STATS_ERROR });
    });
  });

  describe('getPosSessionStats', () => {
    test('should get POS session statistics with date range', async () => {
      // Mock query parameters
      const startDate = '2023-01-01';
      const endDate = '2023-01-31';
      req = mockRequest({}, {}, {}, { startDate, endDate });

      // Mock PosSession.find to return sessions
      PosSession.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPosSessionsList)
      });

      // Mock Sale.find to return sales with populated payment methods
      const mockSales = [
        {
          ...mockCashSale,
          totalAmount: 100,
          paymentDetails: [
            {
              paymentMethod: {
                _id: mockPaymentMethods.cash._id,
                name: 'Efectivo',
                code: 'CASH',
                color: '#4CAF50',
                icon: 'mdi-cash',
                toString: () => mockPaymentMethods.cash._id.toString()
              },
              amount: 120
            }
          ]
        },
        {
          ...mockCardSale,
          totalAmount: 150,
          paymentDetails: [
            {
              paymentMethod: {
                _id: mockPaymentMethods.card._id,
                name: 'Tarjeta de crédito',
                code: 'CARD',
                color: '#2196F3',
                icon: 'mdi-credit-card',
                toString: () => mockPaymentMethods.card._id.toString()
              },
              amount: 150
            }
          ]
        }
      ];
      Sale.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSales)
      });

      // Execute the controller
      await statsController.getPosSessionStats(req, res);

      // Assertions
      expect(PosSession.find).toHaveBeenCalledWith({
        openingDate: {
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
        sessions: mockPosSessionsList,
        totalSessions: mockPosSessionsList.length,
        activeSessions: expect.any(Number),
        totalSales: 100 + 150, // 250
        paymentMethods: expect.any(Array)
      });
      
      // Verify payment methods stats
      const response = res.json.mock.calls[0][0];
      expect(response.paymentMethods.length).toBe(2);
      expect(response.paymentMethods.some(pm => pm.code === 'CASH')).toBe(true);
      expect(response.paymentMethods.some(pm => pm.code === 'CARD')).toBe(true);
      
      // Verify active sessions count
      const activeSessions = mockPosSessionsList.filter(session => session.status === 'open');
      expect(response.activeSessions).toBe(activeSessions.length);
    });

    test('should handle server errors', async () => {
      // Mock PosSession.find to throw an error
      PosSession.find = jest.fn().mockImplementation(() => {
        throw new Error(MESSAGES.STATS_ERROR);
      });

      // Execute the controller
      await statsController.getPosSessionStats(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: MESSAGES.STATS_ERROR });
    });
  });

  describe('getDashboardStats', () => {
    test('should get all dashboard statistics', async () => {
      // Mock query parameters
      const startDate = '2023-01-01';
      const endDate = '2023-01-31';
      req = mockRequest({}, {}, {}, { startDate, endDate });

      // Mock Product.find to return products
      Product.find = jest.fn().mockResolvedValue(mockProductsList);

      // Mock Sale.find to return sales with populated products and payment methods
      const mockSalesWithProducts = [
        {
          ...mockCashSale,
          items: [
            {
              product: {
                _id: mockProduct._id,
                name: mockProduct.name,
                purchaseCost: 70
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
                _id: mockProductWithVariants._id,
                name: mockProductWithVariants.name,
                purchaseCost: 100
              },
              quantity: 1,
              salePrice: 150
            }
          ]
        }
      ];
      
      const mockSalesWithPaymentMethods = [
        {
          ...mockCashSale,
          totalAmount: 100,
          paymentDetails: [
            {
              paymentMethod: {
                _id: mockPaymentMethods.cash._id,
                name: 'Efectivo',
                code: 'CASH',
                color: '#4CAF50',
                icon: 'mdi-cash',
                toString: () => mockPaymentMethods.cash._id.toString()
              },
              amount: 120
            }
          ]
        },
        {
          ...mockCardSale,
          totalAmount: 150,
          paymentDetails: [
            {
              paymentMethod: {
                _id: mockPaymentMethods.card._id,
                name: 'Tarjeta de crédito',
                code: 'CARD',
                color: '#2196F3',
                icon: 'mdi-credit-card',
                toString: () => mockPaymentMethods.card._id.toString()
              },
              amount: 150
            }
          ]
        }
      ];
      
      // Mock Sale.find to return different results based on the call order
      // Create properly structured mock sales data
      const mockSalesData = mockSalesWithProducts.map(sale => ({
        ...sale,
        items: sale.items || [],
        toObject: () => sale
      }));

      // Ensure all mock sales have proper date fields
      const mockSalesForCustomerStats = mockSalesWithPaymentMethods.map(sale => ({
        ...sale,
        saleDate: sale.date || new Date('2023-01-01T10:30:00Z'),
        totalAmount: sale.totalAmount || 100
      }));

      // Mock Sale.find for each helper function call
      Sale.find = jest.fn()
        .mockReturnValueOnce({
          populate: jest.fn().mockResolvedValue(mockSalesData)
        }) // For getSalesStatsData
        .mockReturnValueOnce({
          populate: jest.fn().mockResolvedValue(mockSalesWithProducts) 
        }) // For getProductStatsData
        .mockReturnValueOnce(Promise.resolve(mockSalesForCustomerStats)) // For getCustomerStatsData
        .mockReturnValueOnce({
          populate: jest.fn().mockResolvedValue(mockSalesWithPaymentMethods)
        }); // For getPosSessionStatsData

      // Mock PosSession.find to return sessions
      PosSession.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPosSessionsList)
      });

      // Execute the controller
      await statsController.getDashboardStats(req, res);

      // Assertions
      expect(res.json).toHaveBeenCalledWith({
        salesStats: expect.objectContaining({
          totalSales: expect.any(Number),
          totalProfit: expect.any(Number),
          sales: expect.any(Array)
        }),
        productStats: expect.objectContaining({
          topSellingProducts: expect.any(Array),
          lowStockProducts: expect.any(Array),
          inventoryValue: expect.any(Number),
          totalProducts: expect.any(Number)
        }),
        customerStats: expect.objectContaining({
          peakHours: expect.any(Array),
          customerFlow: expect.any(Array),
          averageTicket: expect.any(Number),
          totalCustomers: expect.any(Number)
        }),
        posSessionStats: expect.objectContaining({
          sessions: expect.any(Array),
          totalSessions: expect.any(Number),
          activeSessions: expect.any(Number),
          totalSales: expect.any(Number),
          paymentMethods: expect.any(Array)
        })
      });
    });

    test('should handle server errors', async () => {
      // Mock Sale.find to throw an error
      Sale.find = jest.fn().mockImplementation(() => {
        throw new Error(MESSAGES.STATS_ERROR);
      });

      // Execute the controller
      await statsController.getDashboardStats(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: MESSAGES.STATS_ERROR });
    });
  });
});
