// controllers/purchaseController.js
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');

exports.getPurchases = async (req, res) => {
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
          { supplier: { $regex: search, $options: 'i' } },
          { invoiceNumber: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Count total purchases matching the query for pagination metadata
    const total = await Purchase.countDocuments(query);
    
    // Get purchases with pagination and search filter
    const purchases = await Purchase.find(query)
      .populate('items.product', 'name barcode')
      .populate('createdBy', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Return purchases with pagination metadata
    res.json({
      purchases,
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

exports.getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('items.product', 'name barcode salePrice purchaseCost')
      .populate('createdBy', 'name');
      
    if(!purchase) return res.status(404).json({ msg: 'Compra no encontrada' });
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createPurchase = async (req, res) => {
  try {
    const { items, supplier, invoiceNumber, notes } = req.body;
    
    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Debe incluir al menos un producto' });
    }
    
    // Calculate total and validate products
    let total = 0;
    const productUpdates = [];
    
    for (const item of items) {
      if (!item.product || !item.quantity || !item.purchasePrice) {
        return res.status(400).json({ error: 'Cada item debe tener product, quantity y purchasePrice' });
      }
      
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ error: `Producto no encontrado: ${item.product}` });
      }
      
      total += item.quantity * item.purchasePrice;
      productUpdates.push({
        productId: item.product,
        quantity: item.quantity
      });
    }
    
    const purchase = new Purchase({
      items,
      total,
      supplier,
      invoiceNumber,
      notes,
      createdBy: req.user.id
    });
    
    await purchase.save();
    res.status(201).json({ msg: 'Compra creada', purchase });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePurchase = async (req, res) => {
  try {
    const purchaseId = req.params.id;
    const { items, supplier, invoiceNumber, notes } = req.body;
    
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) return res.status(404).json({ msg: 'Compra no encontrada' });
    
    // If updating items, we need to reverse old quantities and apply new ones
    if (items) {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Debe incluir al menos un producto' });
      }
      
      // First reverse old quantities
      for (const oldItem of purchase.items) {
        await Product.findByIdAndUpdate(oldItem.product, {
          $inc: { quantity: -oldItem.quantity }
        });
      }
      
      // Calculate new total and validate new items
      let total = 0;
      for (const newItem of items) {
        if (!newItem.product || !newItem.quantity || !newItem.purchasePrice) {
          return res.status(400).json({ error: 'Cada item debe tener product, quantity y purchasePrice' });
        }
        
        const product = await Product.findById(newItem.product);
        if (!product) {
          return res.status(400).json({ error: `Producto no encontrado: ${newItem.product}` });
        }
        
        total += newItem.quantity * newItem.purchasePrice;
        
        // Update product with new quantity
        await Product.findByIdAndUpdate(newItem.product, {
          $inc: { quantity: newItem.quantity }
        });
      }
      
      purchase.items = items;
      purchase.total = total;
    }
    
    if (supplier !== undefined) purchase.supplier = supplier;
    if (invoiceNumber !== undefined) purchase.invoiceNumber = invoiceNumber;
    if (notes !== undefined) purchase.notes = notes;
    
    const updatedPurchase = await purchase.save();
    res.json({ msg: 'Compra actualizada', purchase: updatedPurchase });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    
    if (!purchase) return res.status(404).json({ msg: 'Compra no encontrada' });
    
    // The post('remove') hook will handle reversing the product quantities
    await purchase.remove();
    
    res.json({ msg: 'Compra eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
