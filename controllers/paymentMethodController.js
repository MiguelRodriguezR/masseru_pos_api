// controllers/paymentMethodController.js
const PaymentMethodModel = require('../models/PaymentMethod');

// Get all payment methods
exports.getPaymentMethods = async (req, res) => {
  try {
    const PaymentMethod = PaymentMethodModel.getModel(req.db);
    const paymentMethods = await PaymentMethod.find().sort({ name: 1 });
    res.json({ paymentMethods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ msg: 'Error al obtener los métodos de pago' });
  }
};

// Get active payment methods
exports.getActivePaymentMethods = async (req, res) => {
  try {
    const PaymentMethod = PaymentMethodModel.getModel(req.db);
    const paymentMethods = await PaymentMethod.find({ isActive: true }).sort({ name: 1 });
    res.json({ paymentMethods });
  } catch (error) {
    console.error('Error fetching active payment methods:', error);
    res.status(500).json({ msg: 'Error al obtener los métodos de pago activos' });
  }
};

// Get payment method by ID
exports.getPaymentMethodById = async (req, res) => {
  try {
    const PaymentMethod = PaymentMethodModel.getModel(req.db);
    const paymentMethod = await PaymentMethod.findById(req.params.id);
    
    if (!paymentMethod) {
      return res.status(404).json({ msg: 'Método de pago no encontrado' });
    }
    
    res.json({ paymentMethod });
  } catch (error) {
    console.error('Error fetching payment method:', error);
    res.status(500).json({ msg: 'Error al obtener el método de pago' });
  }
};

// Create payment method
exports.createPaymentMethod = async (req, res) => {
  try {
    const PaymentMethod = PaymentMethodModel.getModel(req.db);
    const { name, code, description, color, icon } = req.body;
    
    // Check if payment method with same name or code already exists
    const existingMethod = await PaymentMethod.findOne({
      $or: [{ name }, { code }] 
    });
    
    if (existingMethod) {
      return res.status(400).json({ 
        msg: 'Ya existe un método de pago con ese nombre o código' 
      });
    }
    
    const newPaymentMethod = new PaymentMethod({
      name,
      code,
      description,
      color,
      icon
    });
    
    await newPaymentMethod.save();
    
    res.status(201).json({ 
      msg: 'Método de pago creado exitosamente',
      paymentMethod: newPaymentMethod 
    });
  } catch (error) {
    console.error('Error creating payment method:', error);
    res.status(500).json({ msg: 'Error al crear el método de pago' });
  }
};

// Update payment method
exports.updatePaymentMethod = async (req, res) => {
  try {
    const PaymentMethod = PaymentMethodModel.getModel(req.db);
    const { name, code, description, color, icon, isActive } = req.body;
    
    // Check if payment method exists
    let paymentMethod = await PaymentMethod.findById(req.params.id);
    
    if (!paymentMethod) {
      return res.status(404).json({ msg: 'Método de pago no encontrado' });
    }
    
    // Check if another payment method with the same name or code exists
    if (name !== paymentMethod.name || code !== paymentMethod.code) {
      const existingMethod = await PaymentMethod.findOne({
        _id: { $ne: req.params.id },
        $or: [{ name }, { code }]
      });
      
      if (existingMethod) {
        return res.status(400).json({ 
          msg: 'Ya existe otro método de pago con ese nombre o código' 
        });
      }
    }
    
    // Update fields
    paymentMethod.name = name || paymentMethod.name;
    paymentMethod.code = code || paymentMethod.code;
    paymentMethod.description = description !== undefined ? description : paymentMethod.description;
    paymentMethod.color = color || paymentMethod.color;
    paymentMethod.icon = icon || paymentMethod.icon;
    paymentMethod.isActive = isActive !== undefined ? isActive : paymentMethod.isActive;
    
    await paymentMethod.save();
    
    res.json({ 
      msg: 'Método de pago actualizado exitosamente',
      paymentMethod 
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({ msg: 'Error al actualizar el método de pago' });
  }
};

// Delete payment method
exports.deletePaymentMethod = async (req, res) => {
  try {
    const PaymentMethod = PaymentMethodModel.getModel(req.db);
    const paymentMethod = await PaymentMethod.findById(req.params.id);
    
    if (!paymentMethod) {
      return res.status(404).json({ msg: 'Método de pago no encontrado' });
    }
    
    await PaymentMethod.findByIdAndDelete(req.params.id);
    
    res.json({ msg: 'Método de pago eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ msg: 'Error al eliminar el método de pago' });
  }
};
