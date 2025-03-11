// controllers/saleController.js
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { addSaleToSession } = require('./posSessionController');

exports.createSale = async (req, res) => {
  try {
    const { items, paymentAmount, paymentMethod } = req.body; // items: [{ productId, quantity, variant (opcional) }], paymentAmount: monto con el que paga el cliente, paymentMethod: método de pago (cash o credit_card)
    if(!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ msg: 'Debe enviar al menos un producto' });
    }
    
    if(!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ msg: 'Debe enviar un monto de pago válido' });
    }
    
    if(!paymentMethod || !['cash', 'credit_card'].includes(paymentMethod)) {
      return res.status(400).json({ msg: 'Debe enviar un método de pago válido (cash o credit_card)' });
    }

    let totalAmount = 0;
    const saleItems = [];

    for (let item of items) {
      const product = await Product.findById(item.productId);
      if(!product) return res.status(404).json({ msg: `Producto no encontrado: ${item.productId}` });

      // Verificar inventario general
      if(product.quantity < item.quantity) {
        return res.status(400).json({ msg: `Inventario insuficiente para el producto ${product.name}` });
      }

      // Si se especifica variante, verificar inventario de variante
      if(item.variant && product.variants && product.variants.length > 0) {
        const variantIndex = product.variants.findIndex(v => {
          let match = true;
          for (let key in item.variant) {
            if(v[key] !== item.variant[key]) match = false;
          }
          return match;
        });
        if(variantIndex === -1) {
          return res.status(400).json({ msg: `Variante no encontrada para el producto ${product.name}` });
        }
        if(product.variants[variantIndex].quantity < item.quantity) {
          return res.status(400).json({ msg: `Inventario insuficiente para la variante del producto ${product.name}` });
        }
        // Descontar cantidad de la variante
        product.variants[variantIndex].quantity -= item.quantity;
      }

      // Descontar cantidad general del producto
      product.quantity -= item.quantity;
      await product.save();

      const itemTotal = product.salePrice * item.quantity;
      totalAmount += itemTotal;
      saleItems.push({
        product: product._id,
        quantity: item.quantity,
        variant: item.variant || null,
        salePrice: product.salePrice
      });
    }

    // Verificar que el pago sea suficiente
    if(paymentAmount < totalAmount) {
      return res.status(400).json({ msg: 'El monto de pago es insuficiente para cubrir el total de la venta' });
    }
    
    // Calcular el cambio
    const changeAmount = paymentAmount - totalAmount;

    const sale = new Sale({
      user: req.user.id,
      items: saleItems,
      totalAmount,
      paymentAmount,
      changeAmount,
      paymentMethod,
      saleDate: new Date()
    });

    await sale.save();
    
    // Add the sale to the current open POS session
    const addedToSession = await addSaleToSession(sale._id, req.user.id);
    
    res.status(201).json({ 
      msg: 'Venta creada', 
      sale,
      addedToSession
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSales = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};
    
    // Filtrar por rango de fechas si se proporcionan
    if (startDate && endDate) {
      query.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.saleDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.saleDate = { $lte: new Date(endDate) };
    }
    
    const sales = await Sale.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name salePrice imageUrl')
      .sort({ saleDate: -1 }); // Ordenar por fecha de venta, más reciente primero
    
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name salePrice barcode description images');
    
    if(!sale) return res.status(404).json({ msg: 'Venta no encontrada' });
    
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
