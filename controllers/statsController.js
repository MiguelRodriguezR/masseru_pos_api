// controllers/statsController.js
const Sale = require('../models/Sale');

exports.getSalesStats = async (req, res) => {
  try {
    const { startDate, endDate, productId } = req.query;
    const filter = {};
    if(startDate || endDate) {
      filter.saleDate = {};
      if(startDate) filter.saleDate.$gte = new Date(startDate);
      if(endDate) filter.saleDate.$lte = new Date(endDate);
    }
    if(productId) {
      filter['items.product'] = productId;
    }

    const sales = await Sale.find(filter).populate('items.product');
    
    // Calcular ganancia: para cada item de venta, ganancia = (salePrice - purchaseCost) * quantity
    let totalProfit = 0;
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if(item.product && item.product.purchaseCost != null) {
          totalProfit += (item.salePrice - item.product.purchaseCost) * item.quantity;
        }
      });
    });

    res.json({ totalSales: sales.length, totalProfit, sales });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
