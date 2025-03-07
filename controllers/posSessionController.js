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
    const sales = await Sale.find({ _id: { $in: session.sales } });
    
    let cashSalesTotal = 0;
    let cardSalesTotal = 0;
    
    sales.forEach(sale => {
      if (sale.paymentMethod === 'cash') {
        cashSalesTotal += sale.totalAmount;
      } else if (sale.paymentMethod === 'credit_card') {
        cardSalesTotal += sale.totalAmount;
      }
    });

    const totalSales = cashSalesTotal + cardSalesTotal;
    const expectedCash = session.initialCash + cashSalesTotal;
    const cashDifference = actualCash - expectedCash;

    // Update session with closing information
    session.closingDate = new Date();
    session.cashSalesTotal = cashSalesTotal;
    session.cardSalesTotal = cardSalesTotal;
    session.totalSales = totalSales;
    session.expectedCash = expectedCash;
    session.actualCash = actualCash;
    session.cashDifference = cashDifference;
    session.notes = notes || '';
    session.status = 'closed';

    await session.save();

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
    }).populate('user', 'name email');
    
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

// Get all POS sessions
exports.getSessions = async (req, res) => {
  try {
    const sessions = await PosSession.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(sessions);
  } catch (error) {
    console.error('Error al obtener sesiones:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get a specific POS session by ID
exports.getSessionById = async (req, res) => {
  try {
    const session = await PosSession.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'sales',
        populate: {
          path: 'items.product',
          select: 'name salePrice'
        }
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
    
    if (session.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        msg: 'No tienes permiso para actualizar esta sesión' 
      });
    }
    
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
    
    // Get the sale details
    const sale = await Sale.findById(saleId);
    
    // Update session totals
    if (sale.paymentMethod === 'cash') {
      openSession.cashSalesTotal += sale.totalAmount;
    } else if (sale.paymentMethod === 'credit_card') {
      openSession.cardSalesTotal += sale.totalAmount;
    }
    
    openSession.totalSales = openSession.cashSalesTotal + openSession.cardSalesTotal;
    openSession.expectedCash = openSession.initialCash + openSession.cashSalesTotal;
    
    await openSession.save();
    return true;
  } catch (error) {
    console.error('Error al añadir venta a la sesión:', error);
    return false;
  }
};
