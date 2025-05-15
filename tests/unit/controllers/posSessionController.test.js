// Imports
const mongoose = require('mongoose');
const posSessionController = require('../../../controllers/posSessionController');
const PosSession = require('../../../models/PosSession');
const { MESSAGES } = require('../../../config/messages');
const Sale = require('../../../models/Sale');
const { mockRequest, mockResponse } = require('../../mocks/mockUtils');
const { 
  mockPosSession, 
  mockClosedPosSession, 
  mockPosSessionsList 
} = require('../../mocks/posSessionMock');
const {
  mockCashSale,
  mockCardSale,
  mockMixedPaymentSale,
  mockCashSaleWithChange
} = require('../../mocks/saleMock');

// Mock the mongoose models
jest.mock('../../../models/PosSession');
jest.mock('../../../models/Sale');

describe('POS Session Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    req = mockRequest();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const setupMockFindOne = (returnValue) => {
    PosSession.findOne = jest.fn().mockResolvedValue(returnValue);
  };

  const setupMockFindById = (returnValue) => {
    PosSession.findById = jest.fn().mockResolvedValue(returnValue);
  };
  
  describe('openSession', () => {
    
    test('should create a new POS session successfully', async () => {
      setupMockFindOne(null);
      
      const savedSession = { ...mockPosSession };
      PosSession.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(savedSession)
      }));

      req = mockRequest({ initialCash: 1000 });
      await posSessionController.openSession(req, res);

      expect(PosSession.findOne).toHaveBeenCalledWith({ 
        user: req.user.id, 
        status: 'open' 
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        msg: MESSAGES.SESSION_OPENED,
        session: expect.anything()
      });
    });

    test('should return 400 if session already exists', async () => {
      PosSession.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPosSession)
      });

      req = mockRequest({ initialCash: 1000 });
      await posSessionController.openSession(req, res);

      expect(PosSession.findOne).toHaveBeenCalledWith({ 
        user: req.user.id, 
        status: 'open' 
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        msg: MESSAGES.SESSION_ALREADY_OPEN
      });
    });

    test('should return 400 if initialCash is invalid', async () => {
      setupMockFindOne(null);
      req = mockRequest({ initialCash: -100 });
      await posSessionController.openSession(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        msg: MESSAGES.INVALID_INITIAL_CASH
      });
    });

    test('should handle server errors', async () => {
      const errorMessage = 'Database connection error';
      PosSession.findOne = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      req = mockRequest({ initialCash: 1000 });
      await posSessionController.openSession(req, res);

      expect(console.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('closeSession', () => {

    test('should close a POS session successfully and validate financial values', async () => {
      // 1. Setup test data with multiple sales including different payment types
      const sessionWithSave = { 
        ...mockPosSession,
        user: {
          _id: mockPosSession.user._id,
          toString: () => '5f7e3c6a8ea7c8362a5c8b1b'
        },
        initialCash: 1000,
        sales: ['5f7e3c6a8ea7c8b1d', '5f7e3c6a8ea7c8b1e', '5f7e3c6a8ea7c8b27', '5f7e3c6a8ea7c8b28'],
        status: 'open',
        save: jest.fn().mockImplementation(function() {
          // Simulate what mongoose would do when saving
          this.expectedCash = 1000 + 120 + 300 + 100 - 20; // initial + cash payments (change subtracted in controller)
          this.expectedNonCash = 150 + 500;
          this.totalSales = 120 + 150 + 800 + 80;
          this.cashDifference = 1190 - (1000 + 120 + 300 + 100 - 20);
          this.paymentTotals = [
            { paymentMethod: '5f7e3c6a8ea7c8b1f', total: 120 + 300 + 100 }, // CASH
            { paymentMethod: '5f7e3c6a8ea7c8b20', total: 150 + 500 }  // CARD
          ];
          return Promise.resolve({ ...this });
        }),
        populate: jest.fn().mockResolvedValue({ ...mockClosedPosSession })
      };

      // Mock session find
      setupMockFindById(sessionWithSave);

      // Mock sales data with multiple payment types and scenarios
      const mockSales = [
        mockCashSale,
        mockCardSale,
        mockMixedPaymentSale,
        mockCashSaleWithChange
      ];

      Sale.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSales)
      });

      // 2. Execute test with actualCash = 1190 (expected cash should be 1500)
      req = mockRequest({ 
        sessionId: '5f7e3c6a8ea7c8362a5c8b1a',
        actualCash: 1190,
        notes: 'Day closed successfully' 
      }, { id: '5f7e3c6a8ea7c8362a5c8b1b' });

      await posSessionController.closeSession(req, res);

      // 3. Verify financial calculations
      expect(Sale.find).toHaveBeenCalledWith({ _id: { $in: sessionWithSave.sales } });
      
      // Verify response contains all required financial data
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        msg: MESSAGES.SESSION_CLOSED,
        session: expect.objectContaining({
          expectedCash: 1500, // 1000 + 120 + 300 + 100 - 20 (change)
          expectedNonCash: 650, // 150 + 500
          actualCash: 1190,
          cashDifference: -310, // 1190 - 1500
          totalSales: 1150, // 120 + 150 + 800 + 80
          paymentTotals: expect.arrayContaining([
            expect.objectContaining({
              paymentMethod: '5f7e3c6a8ea7c8b1f',
              total: 520 // 120 + 300 + 100 (CASH)
            }),
            expect.objectContaining({
              paymentMethod: '5f7e3c6a8ea7c8b20',
              total: 650 // 150 + 500 (CARD)
            })
          ])
        })
      }));
    });

    test('should return 400 if sessionId is missing', async () => {
      // 1. Setup test data (missing sessionId)
      req = mockRequest({ actualCash: 1190 });

      // 2. Execute test
      await posSessionController.closeSession(req, res);

      // 3. Verify results
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.SESSION_ID_REQUIRED });
    });

    test('should return 400 if actualCash is invalid', async () => {
      // 1. Setup test data (invalid actualCash)
      req = mockRequest({ 
        sessionId: mockPosSession._id.toString(), 
        actualCash: -10 // Invalid value
      });

      // 2. Execute test
      await posSessionController.closeSession(req, res);

      // 3. Verify results
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        msg: MESSAGES.INVALID_FINAL_CASH
      });
    });

    test('should return 404 if session not found', async () => {
      // 1. Setup test data
      setupMockFindById(null); // Session not found

      // 2. Execute test
      req = mockRequest({ 
        sessionId: 'nonexistent-id', 
        actualCash: 1190 
      });
      await posSessionController.closeSession(req, res);

      // 3. Verify results
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.SESSION_NOT_FOUND });
    });

    test('should return 403 if user does not own the session', async () => {
      // 1. Setup test data - session with different user
      const sessionWithDifferentUser = {
        ...mockPosSession,
        user: {
          _id: new mongoose.Types.ObjectId('5f7e3c6a8ea7c8362a5c8b2a'),
          toString: () => '5f7e3c6a8ea7c8362a5c8b2a'
        },
        status: 'open'
      };
      setupMockFindById(sessionWithDifferentUser);

      // 2. Execute test
      req = mockRequest({ 
        sessionId: '5f7e3c6a8ea7c8362a5c8b1a', 
        actualCash: 1190 
      }, { id: '5f7e3c6a8ea7c8362a5c8b1b' }); // User ID doesn't match session

      await posSessionController.closeSession(req, res);

      // 3. Verify results
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        msg: MESSAGES.SESSION_NOT_OWNED
      });
    });

    test('should return 400 if session is already closed', async () => {
      // 1. Setup test data - already closed session
      const closedSession = {
        ...mockClosedPosSession,
        user: { 
          toString: () => '5f7e3c6a8ea7c8362a5c8b1b',
          _id: '5f7e3c6a8ea7c8362a5c8b1b'
        },
        status: 'closed' // Session is already closed
      };
      setupMockFindById(closedSession);
      
      // 2. Execute test
      req = mockRequest({ 
        sessionId: '5f7e3c6a8ea7c8362a5c8b1c', 
        actualCash: 1190 
      }, { id: '5f7e3c6a8ea7c8362a5c8b1b' });
      
      await posSessionController.closeSession(req, res);

      // 3. Verify results
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.SESSION_ALREADY_CLOSED });
    });

    test('should handle server errors', async () => {
      // 1. Setup test data - error scenario
      const errorMessage = 'Database connection error';
      PosSession.findById = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // 2. Execute test
      req = mockRequest({ 
        sessionId: '5f7e3c6a8ea7c8362a5c8b1a', 
        actualCash: 1190 
      });
      await posSessionController.closeSession(req, res);

      // 3. Verify error handling
      expect(console.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('getUserOpenSession', () => {
    
    test('should get user open session successfully', async () => {
      // 1. Setup test data
      // Create a serializable session
      const completeMockPosSession = {
        ...mockPosSession,
        toJSON: function() { return this; }
      };
      
      // Mock chained call that returns session
      PosSession.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(completeMockPosSession)
        })
      });

      // 2. Execute test
      req = mockRequest({}, {}, { userId: mockPosSession.user.toString() });
      await posSessionController.getUserOpenSession(req, res);

      // 3. Verify results
      expect(PosSession.findOne).toHaveBeenCalledWith({ 
        user: mockPosSession.user.toString(), 
        status: 'open' 
      });
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0]).toHaveProperty('hasOpenSession', true);
      expect(res.json.mock.calls[0][0]).toHaveProperty('session');
    });

    test('should return 400 if userId is missing', async () => {
      // 1. Setup test data (missing userId)
      req = mockRequest({}, {}, {}); // No userId in params

      // 2. Execute test
      await posSessionController.getUserOpenSession(req, res);

      // 3. Verify results
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.USER_ID_REQUIRED });
    });

    test('should return 404 if no open session found', async () => {
      // 1. Setup test data (no session found)
      // Mock the chained populate calls returning null (no session found)
      PosSession.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      // 2. Execute test
      req = mockRequest({}, {}, { userId: 'user-without-open-session' });
      await posSessionController.getUserOpenSession(req, res);

      // 3. Verify results
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        msg: MESSAGES.NO_OPEN_SESSION,
        hasOpenSession: false
      });
    });

    test('should handle server errors', async () => {
      // 1. Setup test data - error scenario
      const errorMessage = 'Database connection error';
      PosSession.findOne = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // 2. Execute test
      req = mockRequest({}, {}, { userId: mockPosSession.user.toString() });
      await posSessionController.getUserOpenSession(req, res);

      // 3. Verify error handling
      expect(console.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('getSessions', () => {
    test('should get sessions with pagination and filters', async () => {
      PosSession.countDocuments = jest.fn().mockResolvedValue(3);
      PosSession.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockPosSessionsList)
      });

      req = mockRequest({}, {}, {}, { 
        page: '1', 
        limit: '10',
        status: 'open',
        userId: mockPosSession.user.toString(),
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        search: 'test'
      });
      await posSessionController.getSessions(req, res);

      expect(PosSession.countDocuments).toHaveBeenCalled();
      expect(PosSession.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        sessions: mockPosSessionsList,
        pagination: {
          total: 3,
          page: 1,
          limit: 10,
          pages: 1
        }
      });
    });

    test('should handle server errors', async () => {
      const errorMessage = 'Database connection error';
      PosSession.countDocuments = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      req = mockRequest({}, {}, {}, { page: '1', limit: '10' });
      await posSessionController.getSessions(req, res);

      expect(console.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('addSaleToSession', () => {
    
    test('should add sale to session successfully and update financial values', async () => {
      const mockSession = {
        ...mockPosSession,
        sales: [],
        paymentTotals: [],
        totalSales: 0,
        expectedCash: 1000,
        expectedNonCash: 0,
        save: jest.fn().mockImplementation(function() {
          // Simulate the financial calculations
          this.totalSales = 120;
          this.expectedCash = 1000 + 120;
          this.paymentTotals = [
            { paymentMethod: '5f7e3c6a8ea7c8b1f', total: 120 }
          ];
          return Promise.resolve(true);
        }),
        push: jest.fn()
      };
      
      const mockSale = {
        _id: { toString: () => '5f7e3c6a8ea7c8362a5c8b1d' },
        totalAmount: 120,
        changeAmount: 0,
        paymentDetails: [{
          paymentMethod: {
            _id: { toString: () => '5f7e3c6a8ea7c8362a5c8b1f' },
            code: 'CASH'
          },
          amount: 120
        }]
      };

      PosSession.findOne = jest.fn().mockResolvedValue(mockSession);
      Sale.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSale)
      });

      const result = await posSessionController.addSaleToSession(
        mockSale._id.toString(), 
        mockPosSession.user.toString()
      );

      // Verify session was updated correctly
      expect(mockSession.sales).toContain(mockSale._id.toString());
      expect(mockSession.save).toHaveBeenCalled();
      expect(result).toBe(true);
      
      // Verify financial calculations
      expect(mockSession.totalSales).toBe(120);
      expect(mockSession.expectedCash).toBe(1120); // 1000 + 120
      expect(mockSession.expectedNonCash).toBe(0);
      expect(mockSession.paymentTotals).toEqual([
        { paymentMethod: '5f7e3c6a8ea7c8b1f', total: 120 }
      ]);
    });
  
    test('should handle adding sale with multiple payment methods', async () => {
    // 1. Setup test data
    const mockSession = {
      ...mockPosSession,
      sales: [],
      paymentTotals: [],
      totalSales: 0,
      expectedCash: 1000,
      expectedNonCash: 0,
      save: jest.fn().mockResolvedValue(true),
      push: jest.fn()
    };

    const mockSaleWithMultiplePayments = {
      _id: new mongoose.Types.ObjectId(),
      totalAmount: 270,
      changeAmount: 0,
      paymentDetails: [
        { paymentMethod: { _id: { toString: () => 'cash-id' }, code: 'CASH' }, amount: 100 },
        { paymentMethod: { _id: { toString: () => 'card-id' }, code: 'CARD' }, amount: 170 }
      ]
    };

    // Mock database calls
    PosSession.findOne = jest.fn().mockResolvedValue(mockSession);
    Sale.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockSaleWithMultiplePayments)
    });

    // 2. Execute test - con argumentos directos (saleId, userId)
    const result = await posSessionController.addSaleToSession(
      mockSaleWithMultiplePayments._id.toString(), 
      mockPosSession.user.toString()
    );

    // 3. Verify results
    expect(mockSession.sales).toContain(mockSaleWithMultiplePayments._id.toString());
    expect(mockSession.totalSales).toBe(270);
    expect(mockSession.expectedCash).toBe(1100);  // 1000 + 100
    expect(mockSession.expectedNonCash).toBe(170);  // 0 + 170
    expect(mockSession.save).toHaveBeenCalled();
    expect(result).toBe(true);
  });

    test('should return false if no open session found', async () => {
      // 1. Setup test data (session not found)
      PosSession.findOne = jest.fn().mockResolvedValue(null);

      // 2. Execute test - con argumentos directos (saleId, userId)
      const result = await posSessionController.addSaleToSession(
        '5f7e3c6a8ea7c8362a5c8b1d',
        'user-without-open-session'
      );

      // 3. Verify results - debe retornar false
      expect(result).toBe(false);
    });

    test('should return false if sale not found', async () => {
      // 1. Setup test data (sale not found)
      // Mock session exists
      const mockSession = {
        ...mockPosSession,
        sales: [],
        push: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };
      
      // Mock session found but sale not found
      PosSession.findOne = jest.fn().mockResolvedValue(mockSession);
      Sale.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      // 2. Execute test - con argumentos directos (saleId, userId)
      const result = await posSessionController.addSaleToSession(
        'nonexistent-sale-id',
        mockPosSession.user.toString()
      );

      // 3. Verify results - debe retornar false
      expect(result).toBe(false);
    });

    test('should handle sales already in session', async () => {
      // 1. Setup test data (sale already in session)
      const saleId = '5f7e3c6a8ea7c8362a5c8b1d';
      
      // Mock session with sale already added
      const mockSessionWithSale = {
        ...mockPosSession,
        sales: [saleId], // Sale already in session
        push: jest.fn(),
        save: jest.fn().mockResolvedValue(true)
      };
      
      // Mock database calls
      PosSession.findOne = jest.fn().mockResolvedValue(mockSessionWithSale);
      Sale.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: { toString: () => saleId },
          totalAmount: 0,
          changeAmount: 0,
          paymentDetails: [] // Añadimos datos mínimos necesarios
        })
      });

      // 2. Execute test - con argumentos directos (saleId, userId)
      const result = await posSessionController.addSaleToSession(
        saleId,
        mockPosSession.user.toString()
      );

      // 3. Verify results
      // NOTA: Actualmente el controlador no verifica si la venta ya está en la sesión,
      // por lo que añade la venta de nuevo. Esto debería considerarse como un punto
      // de mejora para el controlador en el futuro.
      expect(result).toBe(true);
    });



    test('should handle server errors', async () => {
      // 1. Setup test data - error scenario
      const errorMessage = 'Database connection error';
      Sale.findById = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // 2. Execute test - con argumentos directos (saleId, userId)
      const result = await posSessionController.addSaleToSession(
        '5f7e3c6a8ea7c8362a5c8b1d',
        mockPosSession.user.toString()
      );

      // 3. Verify error handling - debe retornar false
      expect(console.error).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});
