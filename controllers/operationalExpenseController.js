// controllers/operationalExpenseController.js
const OperationalExpense = require('../models/OperationalExpense');

exports.getOperationalExpenses = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search parameter
    const search = req.query.search || '';
    
    // Build query
    let query = {};
    
    // Add search filter if search term is provided
    if (search) {
      query = {
        $or: [
          { reason: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Count total expenses matching the query for pagination metadata
    const total = await OperationalExpense.countDocuments(query);
    
    // Get expenses with pagination and search filter
    const operationalExpenses = await OperationalExpense.find(query)
      .populate('createdBy', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Return expenses with pagination metadata
    res.json({
      operationalExpenses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOperationalExpenseById = async (req, res) => {
  try {
    const operationalExpense = await OperationalExpense.findById(req.params.id)
      .populate('createdBy', 'name');
      
    if(!operationalExpense) return res.status(404).json({ msg: 'Gasto operativo no encontrado' });
    res.json(operationalExpense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createOperationalExpense = async (req, res) => {
  try {
    const { reason, totalAmount, notes, date } = req.body;
    
    // Validate required fields
    if (!reason || !totalAmount) {
      return res.status(400).json({ error: 'Razón y monto total son campos requeridos' });
    }
    
    const operationalExpense = new OperationalExpense({
      reason,
      totalAmount,
      notes,
      date: date || Date.now(),
      createdBy: req.user.id
    });
    
    await operationalExpense.save();
    res.status(201).json({ msg: 'Gasto operativo creado', operationalExpense });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOperationalExpense = async (req, res) => {
  try {
    const { reason, totalAmount, notes, date } = req.body;
    
    const operationalExpense = await OperationalExpense.findById(req.params.id);
    if (!operationalExpense) return res.status(404).json({ msg: 'Gasto operativo no encontrado' });
    
    if (reason !== undefined) operationalExpense.reason = reason;
    if (totalAmount !== undefined) operationalExpense.totalAmount = totalAmount;
    if (notes !== undefined) operationalExpense.notes = notes;
    if (date !== undefined) operationalExpense.date = date;
    
    const updatedOperationalExpense = await operationalExpense.save();
    res.json({ msg: 'Gasto operativo actualizado', operationalExpense: updatedOperationalExpense });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteOperationalExpense = async (req, res) => {
  try {
    const operationalExpense = await OperationalExpense.findById(req.params.id);
    
    if (!operationalExpense) return res.status(404).json({ msg: 'Gasto operativo no encontrado' });
    
    await OperationalExpense.findByIdAndDelete(req.params.id);
    
    res.json({ msg: 'Gasto operativo eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
