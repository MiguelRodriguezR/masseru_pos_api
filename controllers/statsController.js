// controllers/statsController.js
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const PosSession = require('../models/PosSession');

/**
 * Get comprehensive sales statistics
 */
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
    
    // Calculate profit: for each sale item, profit = (salePrice - purchaseCost) * quantity
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

/**
 * Get product statistics
 */
exports.getProductStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get all products
    const products = await Product.find();
    
    // Get sales within date range
    const filter = {};
    if(startDate || endDate) {
      filter.saleDate = {};
      if(startDate) filter.saleDate.$gte = new Date(startDate);
      if(endDate) filter.saleDate.$lte = new Date(endDate);
    }
    
    const sales = await Sale.find(filter).populate('items.product');
    
    // Calculate product statistics
    const productStats = {};
    let totalInventoryValue = 0;
    
    // Calculate inventory value and identify low stock products
    products.forEach(product => {
      totalInventoryValue += product.purchaseCost * product.quantity;
      
      if (!productStats[product._id]) {
        productStats[product._id] = {
          _id: product._id,
          name: product.name,
          quantity: product.quantity,
          purchaseCost: product.purchaseCost,
          salePrice: product.salePrice,
          totalSales: 0,
          totalQuantity: 0,
          totalProfit: 0
        };
      }
    });
    
    // Calculate sales statistics for each product
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.product && productStats[item.product._id]) {
          productStats[item.product._id].totalSales += item.salePrice * item.quantity;
          productStats[item.product._id].totalQuantity += item.quantity;
          productStats[item.product._id].totalProfit += 
            (item.salePrice - item.product.purchaseCost) * item.quantity;
        }
      });
    });
    
    // Convert to array and sort by quantity sold
    const productStatsArray = Object.values(productStats);
    const topSellingProducts = [...productStatsArray]
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);
    
    // Identify low stock products (less than 10 items)
    const lowStockProducts = productStatsArray
      .filter(p => p.quantity < 10)
      .sort((a, b) => a.quantity - b.quantity);
    
    res.json({
      topSellingProducts,
      lowStockProducts,
      inventoryValue: totalInventoryValue,
      totalProducts: products.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get customer flow and peak hours statistics
 */
exports.getCustomerStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get sales within date range
    const filter = {};
    if(startDate || endDate) {
      filter.saleDate = {};
      if(startDate) filter.saleDate.$gte = new Date(startDate);
      if(endDate) filter.saleDate.$lte = new Date(endDate);
    }
    
    const sales = await Sale.find(filter);
    
    // Calculate peak hours
    const hourCounts = {};
    let totalAmount = 0;
    
    sales.forEach(sale => {
      const hour = new Date(sale.saleDate).getHours();
      if (!hourCounts[hour]) {
        hourCounts[hour] = 0;
      }
      hourCounts[hour]++;
      totalAmount += sale.totalAmount;
    });
    
    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count);
    
    // Calculate customer flow by date
    const salesByDate = {};
    
    sales.forEach(sale => {
      const date = new Date(sale.saleDate).toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = 0;
      }
      salesByDate[date]++;
    });
    
    const customerFlow = Object.entries(salesByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculate average ticket
    const averageTicket = sales.length > 0 ? totalAmount / sales.length : 0;
    
    res.json({
      peakHours,
      customerFlow,
      averageTicket,
      totalCustomers: sales.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get POS session statistics
 */
exports.getPosSessionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get sessions within date range
    const filter = {};
    if(startDate || endDate) {
      filter.openingDate = {};
      if(startDate) filter.openingDate.$gte = new Date(startDate);
      if(endDate) filter.openingDate.$lte = new Date(endDate);
    }
    
    const sessions = await PosSession.find(filter).populate('user', 'name');
    
    // Calculate session statistics
    const activeSessions = sessions.filter(session => session.status === 'open');
    
    // Get all sales for the period to calculate payment method statistics
    const saleFilter = {};
    if(startDate || endDate) {
      saleFilter.saleDate = {};
      if(startDate) saleFilter.saleDate.$gte = new Date(startDate);
      if(endDate) saleFilter.saleDate.$lte = new Date(endDate);
    }
    
    const sales = await Sale.find(saleFilter).populate('paymentDetails.paymentMethod');
    
    // Calculate sales by payment method
    const paymentMethodStats = {};
    let totalSalesAmount = 0;
    
    sales.forEach(sale => {
      totalSalesAmount += sale.totalAmount;
      
      // Process each payment detail in the sale
      sale.paymentDetails.forEach(paymentDetail => {
        if (!paymentDetail.paymentMethod) return;
        
        const methodId = paymentDetail.paymentMethod._id.toString();
        const paymentAmount = paymentDetail.amount;
        
        if (!paymentMethodStats[methodId]) {
          paymentMethodStats[methodId] = {
            _id: methodId,
            name: paymentDetail.paymentMethod.name,
            code: paymentDetail.paymentMethod.code,
            color: paymentDetail.paymentMethod.color,
            icon: paymentDetail.paymentMethod.icon,
            totalAmount: 0,
            count: 0
          };
        }
        
        paymentMethodStats[methodId].totalAmount += paymentAmount;
        paymentMethodStats[methodId].count += 1;
      });
    });
    
    // Convert to array for easier consumption by frontend
    const paymentMethodsArray = Object.values(paymentMethodStats);
    
    res.json({
      sessions,
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      totalSales: totalSalesAmount,
      paymentMethods: paymentMethodsArray
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all dashboard statistics in a single call
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate, productId } = req.query;
    
    // Get sales statistics
    const salesStats = await getSalesStatsData(startDate, endDate, productId);
    
    // Get product statistics
    const productStats = await getProductStatsData(startDate, endDate);
    
    // Get customer statistics
    const customerStats = await getCustomerStatsData(startDate, endDate);
    
    // Get POS session statistics
    const posSessionStats = await getPosSessionStatsData(startDate, endDate);
    
    res.json({
      salesStats,
      productStats,
      customerStats,
      posSessionStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper functions for getDashboardStats
async function getSalesStatsData(startDate, endDate, productId) {
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
  
  let totalProfit = 0;
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if(item.product && item.product.purchaseCost != null) {
        totalProfit += (item.salePrice - item.product.purchaseCost) * item.quantity;
      }
    });
  });

  return { totalSales: sales.length, totalProfit, sales };
}

async function getProductStatsData(startDate, endDate) {
  const products = await Product.find();
  
  const filter = {};
  if(startDate || endDate) {
    filter.saleDate = {};
    if(startDate) filter.saleDate.$gte = new Date(startDate);
    if(endDate) filter.saleDate.$lte = new Date(endDate);
  }
  
  const sales = await Sale.find(filter).populate('items.product');
  
  const productStats = {};
  let totalInventoryValue = 0;
  
  products.forEach(product => {
    totalInventoryValue += product.purchaseCost * product.quantity;
    
    if (!productStats[product._id]) {
      productStats[product._id] = {
        _id: product._id,
        name: product.name,
        quantity: product.quantity,
        purchaseCost: product.purchaseCost,
        salePrice: product.salePrice,
        totalSales: 0,
        totalQuantity: 0,
        totalProfit: 0
      };
    }
  });
  
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (item.product && productStats[item.product._id]) {
        productStats[item.product._id].totalSales += item.salePrice * item.quantity;
        productStats[item.product._id].totalQuantity += item.quantity;
        productStats[item.product._id].totalProfit += 
          (item.salePrice - item.product.purchaseCost) * item.quantity;
      }
    });
  });
  
  const productStatsArray = Object.values(productStats);
  const topSellingProducts = [...productStatsArray]
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 10);
  
  const lowStockProducts = productStatsArray
    .filter(p => p.quantity < 10)
    .sort((a, b) => a.quantity - b.quantity);
  
  return {
    topSellingProducts,
    lowStockProducts,
    inventoryValue: totalInventoryValue,
    totalProducts: products.length
  };
}

async function getCustomerStatsData(startDate, endDate) {
  const filter = {};
  if(startDate || endDate) {
    filter.saleDate = {};
    if(startDate) filter.saleDate.$gte = new Date(startDate);
    if(endDate) filter.saleDate.$lte = new Date(endDate);
  }
  
  const sales = await Sale.find(filter);
  
  const hourCounts = {};
  let totalAmount = 0;
  
  sales.forEach(sale => {
    const hour = new Date(sale.saleDate).getHours();
    if (!hourCounts[hour]) {
      hourCounts[hour] = 0;
    }
    hourCounts[hour]++;
    totalAmount += sale.totalAmount;
  });
  
  const peakHours = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count);
  
  const salesByDate = {};
  
  sales.forEach(sale => {
    const date = new Date(sale.saleDate).toISOString().split('T')[0];
    if (!salesByDate[date]) {
      salesByDate[date] = 0;
    }
    salesByDate[date]++;
  });
  
  const customerFlow = Object.entries(salesByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  const averageTicket = sales.length > 0 ? totalAmount / sales.length : 0;
  
  return {
    peakHours,
    customerFlow,
    averageTicket,
    totalCustomers: sales.length
  };
}

async function getPosSessionStatsData(startDate, endDate) {
  const filter = {};
  if(startDate || endDate) {
    filter.openingDate = {};
    if(startDate) filter.openingDate.$gte = new Date(startDate);
    if(endDate) filter.openingDate.$lte = new Date(endDate);
  }
  
  const sessions = await PosSession.find(filter).populate('user', 'name');
  
  const activeSessions = sessions.filter(session => session.status === 'open');
  
  // Get all sales for the period to calculate payment method statistics
  const saleFilter = {};
  if(startDate || endDate) {
    saleFilter.saleDate = {};
    if(startDate) saleFilter.saleDate.$gte = new Date(startDate);
    if(endDate) saleFilter.saleDate.$lte = new Date(endDate);
  }
  
  const sales = await Sale.find(saleFilter).populate('paymentDetails.paymentMethod');
  
  // Calculate sales by payment method
  const paymentMethodStats = {};
  let totalSalesAmount = 0;
  
  sales.forEach(sale => {
    totalSalesAmount += sale.totalAmount;
    
    // Process each payment detail in the sale
    sale.paymentDetails.forEach(paymentDetail => {
      if (!paymentDetail.paymentMethod) return;
      
      const methodId = paymentDetail.paymentMethod._id.toString();
      const paymentAmount = paymentDetail.amount;
      
      if (!paymentMethodStats[methodId]) {
        paymentMethodStats[methodId] = {
          _id: methodId,
          name: paymentDetail.paymentMethod.name,
          code: paymentDetail.paymentMethod.code,
          color: paymentDetail.paymentMethod.color,
          icon: paymentDetail.paymentMethod.icon,
          totalAmount: 0,
          count: 0
        };
      }
      
      paymentMethodStats[methodId].totalAmount += paymentAmount;
      paymentMethodStats[methodId].count += 1;
    });
  });
  
  // Convert to array for easier consumption by frontend
  const paymentMethodsArray = Object.values(paymentMethodStats);
  
  return {
    sessions,
    totalSessions: sessions.length,
    activeSessions: activeSessions.length,
    totalSales: totalSalesAmount,
    paymentMethods: paymentMethodsArray
  };
}
