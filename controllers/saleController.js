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
    
    if(!paymentMethod) {
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

      let totalDiscount = 0;
      if (item.discounts && item.discounts.length > 0) {
        
        totalDiscount = item.discounts.reduce((total, discount) => {
          if(discount.type === 'percentage') {
            return total + (product.salePrice * discount.value / 100);
          } else if(discount.type === 'fixed') {
            return total + discount.value;
          }
        }, 0);
      }

      const productSalePrice = product.salePrice - totalDiscount
      const itemTotal = productSalePrice * item.quantity;
      totalAmount += itemTotal;
      
      saleItems.push({
        product: product._id,
        quantity: item.quantity,
        variant: item.variant || null,
        salePrice: productSalePrice,
        discounts: item.discounts,  
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
    // Parámetros de paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Parámetros de filtro
    const { startDate, endDate, search, filterBy } = req.query;
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
    
    // Filtrar por búsqueda si se proporciona
    if (search && filterBy) {
      const filterOptions = Array.isArray(filterBy) ? filterBy : [filterBy];
      
      const searchConditions = [];
      
      if (filterOptions.includes('productName')) {
        // Buscar por nombre de producto
        searchConditions.push({
          'items.product.name': { $regex: search, $options: 'i' }
        });
      }
      
      if (filterOptions.includes('productBarcode')) {
        // Buscar por código de barras de producto
        searchConditions.push({
          'items.product.barcode': { $regex: search, $options: 'i' }
        });
      }
      
      if (filterOptions.includes('totalAmount')) {
        // Buscar por monto total (si es un número válido)
        const amount = parseFloat(search);
        if (!isNaN(amount)) {
          searchConditions.push({ totalAmount: amount });
        }
      }
      
      if (searchConditions.length > 0) {
        query.$or = searchConditions;
      }
    }
    
    // console.log('Query:', JSON.stringify(query, null, 2));
    // console.log('Search:', search, 'FilterBy:', filterBy);
    
    // Primero, realizar una consulta para obtener todas las ventas que coinciden con los criterios
    // para poder filtrar correctamente por nombre de producto o código de barras
    let allMatchingSales = [];
    
    if (search && (filterBy && (
        (Array.isArray(filterBy) && (filterBy.includes('productName') || filterBy.includes('productBarcode'))) ||
        filterBy === 'productName' || 
        filterBy === 'productBarcode'
      ))) {
      // Si estamos buscando por nombre de producto o código de barras, necesitamos
      // primero obtener todas las ventas y luego filtrar manualmente
      allMatchingSales = await Sale.find({})
        .populate('user', 'name email')
      .populate('items.product', 'name salePrice barcode images')
        .populate('paymentMethod', 'name color icon')
        .sort({ saleDate: -1 });
      
      // Filtrar manualmente por nombre de producto o código de barras
      allMatchingSales = allMatchingSales.filter(sale => {
        return sale.items.some(item => {
          const product = item.product;
          if (!product) return false;
          
          const filterOptions = Array.isArray(filterBy) ? filterBy : [filterBy];
          
          if (filterOptions.includes('productName') && 
              product.name && 
              product.name.toLowerCase().includes(search.toLowerCase())) {
            return true;
          }
          
          if (filterOptions.includes('productBarcode') && 
              product.barcode && 
              product.barcode.toLowerCase().includes(search.toLowerCase())) {
            return true;
          }
          
          return false;
        });
      });
      
      // Aplicar filtros de fecha si existen
      if (query.saleDate) {
        allMatchingSales = allMatchingSales.filter(sale => {
          const saleDate = new Date(sale.saleDate);
          if (query.saleDate.$gte && query.saleDate.$lte) {
            return saleDate >= query.saleDate.$gte && saleDate <= query.saleDate.$lte;
          } else if (query.saleDate.$gte) {
            return saleDate >= query.saleDate.$gte;
          } else if (query.saleDate.$lte) {
            return saleDate <= query.saleDate.$lte;
          }
          return true;
        });
      }
      
      // Aplicar paginación manualmente
      const total = allMatchingSales.length;
      const paginatedSales = allMatchingSales.slice(skip, skip + limit);
      
      return res.json({
        sales: paginatedSales,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } else {
      // Si no estamos buscando por nombre de producto o código de barras,
      // podemos usar la consulta normal de MongoDB
      
      // Contar el total de ventas que coinciden con la consulta para la paginación
      const total = await Sale.countDocuments(query);
      
      // Obtener las ventas con paginación y filtros
      const sales = await Sale.find(query)
        .populate('user', 'name email')
        .populate('items.product', 'name salePrice barcode images')
        .populate('paymentMethod', 'name color icon')
        .sort({ saleDate: -1 }) // Ordenar por fecha de venta, más reciente primero
        .skip(skip)
        .limit(limit);
      
      // Devolver las ventas con metadatos de paginación
      return res.json({
        sales,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    }
  } catch (error) {
    console.error('Error in getSales:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name salePrice barcode description images')
      .populate('paymentMethod', 'name color icon');
    
    if(!sale) return res.status(404).json({ msg: 'Venta no encontrada' });
    
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
