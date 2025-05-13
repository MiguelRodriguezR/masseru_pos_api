// controllers/posSessionController.js
const PosSession = require('../models/PosSession');
const Sale = require('../models/Sale');

// Create a new POS session (open cash register)
exports.openSession = async (req, res) => {
  try {
    // Check if there's already an open session for this user
    const existingOpenSession = await PosSession.findOne({ 
      user: req.user.id, 
      status: 'open' 
    });

    if (existingOpenSession) {
      return res.status(400).json({ 
        msg: 'Ya tienes una sesión de caja abierta. Cierra la sesión actual antes de abrir una nueva.' 
      });
    }

    const { initialCash } = req.body;

    if (initialCash === undefined || initialCash < 0) {
      return res.status(400).json({ 
        msg: 'Debe proporcionar un monto inicial de caja válido (mayor o igual a 0)' 
      });
    }

    const newSession = new PosSession({
      user: req.user.id,
      initialCash,
      expectedCash: initialCash // Initially, expected cash equals initial cash
    });

    await newSession.save();

    res.status(201).json({ 
      msg: 'Sesión de caja abierta correctamente', 
      session: newSession 
    });
  } catch (error) {
    console.error('Error al abrir sesión de caja:', error);
    res.status(500).json({ error: error.message });
  }
};

// Close a POS session
exports.closeSession = async (req, res) => {
  try {
    const { sessionId, actualCash, notes } = req.body;

    if (!sessionId) {
      return res.status(400).json({ msg: 'ID de sesión requerido' });
    }

    if (actualCash === undefined || actualCash < 0) {
      return res.status(400).json({ 
        msg: 'Debe proporcionar el monto final de caja (mayor o igual a 0)' 
      });
    }

    const session = await PosSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ msg: 'Sesión no encontrada' });
    }

    if (session.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        msg: 'No tienes permiso para cerrar esta sesión' 
      });
    }

    if (session.status === 'closed') {
      return res.status(400).json({ msg: 'Esta sesión ya está cerrada' });
    }

    // Calculate totals from all sales in this session
    const sales = await Sale.find({ _id: { $in: session.sales } })
      .populate('paymentDetails.paymentMethod');
    
    // Group sales by payment method and calculate totals
    const paymentTotals = [];
    let totalSales = 0;
    let cashTotal = 0;
    let nonCashTotal = 0;
    
    // Process each sale
    sales.forEach(sale => {
      totalSales += sale.totalAmount;
      
      // Process each payment detail in the sale
      sale.paymentDetails.forEach(paymentDetail => {
        if (!paymentDetail.paymentMethod) return;
        
        const paymentMethodId = paymentDetail.paymentMethod._id.toString();
        const paymentAmount = paymentDetail.amount;
        
        // Find if this payment method is already in our totals
        let paymentTotal = paymentTotals.find(pt => 
          pt.paymentMethod.toString() === paymentMethodId
        );
        
        // If not found, create a new entry
        if (!paymentTotal) {
          paymentTotals.push({
            paymentMethod: paymentDetail.paymentMethod._id,
            total: paymentAmount
          });
        } else {
          // Update existing total
          paymentTotal.total += paymentAmount;
        }
        
        // Check if this is a cash payment method (code CASH)
        if (paymentDetail.paymentMethod.code === 'CASH') {
          cashTotal += paymentAmount;
        } else {
          nonCashTotal += paymentAmount;
        }
      });
    });
    
    // Calculate expected cash and difference
    const expectedCash = session.initialCash + cashTotal;
    const expectedNonCash = nonCashTotal;
    const cashDifference = actualCash - expectedCash;

    // Update session with closing information
    session.closingDate = new Date();
    session.paymentTotals = paymentTotals;
    session.totalSales = totalSales;
    session.expectedCash = expectedCash;
    session.expectedNonCash = expectedNonCash;
    session.actualCash = actualCash;
    session.cashDifference = cashDifference;
    session.notes = notes || '';
    session.status = 'closed';

    await session.save();

    // Populate payment methods for response
    await session.populate('paymentTotals.paymentMethod');

    res.json({ 
      msg: 'Sesión de caja cerrada correctamente', 
      session 
    });
  } catch (error) {
    console.error('Error al cerrar sesión de caja:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get the currently open session for a specific user
exports.getUserOpenSession = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ msg: 'ID de usuario requerido' });
    }
    
    const openSession = await PosSession.findOne({ 
      user: userId, 
      status: 'open' 
    })
    .populate('user', 'name email')
    .populate('paymentTotals.paymentMethod', 'name code color icon');
    
    if (!openSession) {
      return res.status(404).json({ 
        msg: 'No hay sesión abierta para este usuario',
        hasOpenSession: false
      });
    }
    
    res.json({
      hasOpenSession: true,
      session: openSession
    });
  } catch (error) {
    console.error('Error al obtener sesión abierta del usuario:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all POS sessions with pagination and filtering
exports.getSessions = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filter parameters
    const { startDate, endDate, search, status, userId } = req.query;
    let query = {};
    
    // Filter by date range if provided
    if (startDate && endDate) {
      query.openingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.openingDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.openingDate = { $lte: new Date(endDate) };
    }
    
    // Filter by status if provided
    if (status && ['open', 'closed'].includes(status)) {
      query.status = status;
    }
    
    // Filter by user if provided
    if (userId) {
      query.user = userId;
    }
    
    // Search by notes if provided
    if (search) {
      query.notes = { $regex: search, $options: 'i' };
    }
    
    // Count total sessions matching the query for pagination
    const total = await PosSession.countDocuments(query);
    
    // Get sessions with pagination and filters
    const sessions = await PosSession.find(query)
      .populate('user', 'name email')
      .populate('paymentTotals.paymentMethod', 'name code color icon')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Return sessions with pagination metadata
    res.json({
      sessions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener sesiones:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get a specific POS session by ID with detailed sales information
exports.getSessionById = async (req, res) => {
  try {
    const session = await PosSession.findById(req.params.id)
      .populate('user', 'name email')
      .populate('paymentTotals.paymentMethod', 'name code color icon')
      .populate({
        path: 'sales',
        populate: [
          {
            path: 'items.product',
            select: 'name salePrice barcode images'
          },
          {
            path: 'user',
            select: 'name email'
          },
          {
            path: 'paymentDetails.paymentMethod',
            select: 'name code color icon'
          }
        ]
      });
    
    if (!session) {
      return res.status(404).json({ msg: 'Sesión no encontrada' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error al obtener sesión:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update a POS session
exports.updateSession = async (req, res) => {
  try {
    const { notes } = req.body;
    const session = await PosSession.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ msg: 'Sesión no encontrada' });
    }
    
    // if (session.user.toString() !== req.user.id) {
    //   return res.status(403).json({ 
    //     msg: 'No tienes permiso para actualizar esta sesión' 
    //   });
    // }
    
    if (session.status === 'closed') {
      return res.status(400).json({ 
        msg: 'No se puede actualizar una sesión cerrada' 
      });
    }
    
    if (notes !== undefined) {
      session.notes = notes;
    }
    
    await session.save();
    
    res.json({ 
      msg: 'Sesión actualizada correctamente', 
      session 
    });
  } catch (error) {
    console.error('Error al actualizar sesión:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add a sale to the current open session
exports.addSaleToSession = async (saleId, userId) => {
  try {
    // Find the open session for this user
    const openSession = await PosSession.findOne({ 
      user: userId, 
      status: 'open' 
    });
    
    if (!openSession) {
      console.error('No hay una sesión de caja abierta para este usuario');
      return false;
    }
    
    // Add the sale to the session
    openSession.sales.push(saleId);
    
    // Get the sale details with payment details
    const sale = await Sale.findById(saleId).populate('paymentDetails.paymentMethod');
    
    if (!sale) {
      console.error('Venta no encontrada');
      return false;
    }
    
    // Update payment totals
    let paymentTotals = openSession.paymentTotals || [];
    let totalSales = openSession.totalSales || 0;
    let expectedCash = openSession.initialCash;
    let expectedNonCash = openSession.expectedNonCash || 0;
    
    // Update total sales
    totalSales += sale.totalAmount;
    
    // Process each payment method in the sale
    for (const paymentDetail of sale.paymentDetails) {
      const paymentMethod = paymentDetail.paymentMethod;
      const paymentAmount = paymentDetail.amount;
      
      if (!paymentMethod) continue;
      
      // Find if this payment method is already in our totals
      const paymentMethodId = paymentMethod._id.toString();
      let paymentTotal = paymentTotals.find(pt => 
        pt.paymentMethod && pt.paymentMethod.toString() === paymentMethodId
      );
      
      // If not found, create a new entry
      if (!paymentTotal) {
        paymentTotals.push({
          paymentMethod: paymentMethod._id,
          total: paymentAmount
        });
      } else {
        // Update existing total
        paymentTotal.total += paymentAmount;
      }
      
      // Update expected cash if this is a cash payment, otherwise update expected non-cash
      if (paymentMethod.code === 'CASH') {
        expectedCash += paymentAmount;
      } else {
        expectedNonCash += paymentAmount;
      }
    }
    
    // Update session
    openSession.paymentTotals = paymentTotals;
    openSession.totalSales = totalSales;
    openSession.expectedCash = expectedCash;
    openSession.expectedNonCash = expectedNonCash;
    
    await openSession.save();
    return true;
  } catch (error) {
    console.error('Error al añadir venta a la sesión:', error);
    return false;
  }
};
