// controllers/statsController.js
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const PosSession = require('../models/PosSession');
const OperationalExpense = require('../models/OperationalExpense');
const { MESSAGES } = require('../config/messages');

/**
 * Build a date-range filter for the given field
 */
function buildDateFilter(query, field) {
  const { startDate, endDate } = query;
  const filter = {};
  if (startDate || endDate) {
    filter[field] = {};
    if (startDate) filter[field].$gte = new Date(startDate);
    if (endDate) filter[field].$lte = new Date(endDate);
  }
  return filter;
}

// Internal helper: Sales stats
async function getSalesStatsData({ startDate, endDate, productId }) {
  const filter = buildDateFilter({ startDate, endDate }, 'saleDate');
  if (productId) filter['items.product'] = productId;
  const sales = await Sale.find(filter).populate('items.product');
  const totalProfit = sales.reduce((sum, sale) =>
    sum + sale.items.reduce((itemSum, item) => {
      const cost = item.product?.purchaseCost;
      return itemSum + ((cost != null) ? (item.salePrice - cost) * item.quantity : 0);
    }, 0)
  , 0);
  return { totalSales: sales.length, totalProfit, sales };
}

// Internal helper: Product stats
async function getProductStatsData({ startDate, endDate }) {
  const dateFilter = buildDateFilter({ startDate, endDate }, 'saleDate');
  const [products, sales] = await Promise.all([
    Product.find(),
    Sale.find(dateFilter).populate('items.product'),
  ]);
  const statsMap = products.reduce((map, p) => {
    map[p._id] = {
      _id: p._id,
      name: p.name,
      quantity: p.quantity,
      purchaseCost: p.purchaseCost,
      salePrice: p.salePrice,
      totalSales: 0,
      totalQuantity: 0,
      totalProfit: 0
    };
    return map;
  }, {});
  const inventoryValue = products.reduce((sum, p) => sum + p.purchaseCost * p.quantity, 0);
  sales.forEach(sale => sale.items.forEach(item => {
    const stat = statsMap[item.product?._id];
    if (stat) {
      stat.totalSales += item.salePrice * item.quantity;
      stat.totalQuantity += item.quantity;
      stat.totalProfit += (item.salePrice - item.product.purchaseCost) * item.quantity;
    }
  }));
  const statsArray = Object.values(statsMap);
  return {
    topSellingProducts: statsArray.slice().sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0,10),
    lowStockProducts: statsArray.filter(p => p.quantity < 10).sort((a, b) => a.quantity - b.quantity),
    inventoryValue,
    totalProducts: products.length
  };
}

// Internal helper: Customer stats
async function getCustomerStatsData({ startDate, endDate }) {
  const filter = buildDateFilter({ startDate, endDate }, 'saleDate');
  const sales = await Sale.find(filter);
  const hourCounts = {};
  const salesByDate = {};
  let totalAmount = 0;
  sales.forEach(sale => {
    const dateKey = sale.saleDate.toISOString().split('T')[0];
    salesByDate[dateKey] = (salesByDate[dateKey] || 0) + 1;
    const hr = sale.saleDate.getHours();
    hourCounts[hr] = (hourCounts[hr] || 0) + 1;
    totalAmount += sale.totalAmount;
  });
  const peakHours = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: +hour, count }))
    .sort((a, b) => b.count - a.count);
  const customerFlow = Object.entries(salesByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return {
    peakHours,
    customerFlow,
    averageTicket: sales.length ? totalAmount / sales.length : 0,
    totalCustomers: sales.length
  };
}

// Internal helper: POS session stats
async function getPosSessionStatsData({ startDate, endDate }) {
  const sessionFilter = buildDateFilter({ startDate, endDate }, 'openingDate');
  const [sessions, sales] = await Promise.all([
    PosSession.find(sessionFilter).populate('user', 'name'),
    Sale.find(buildDateFilter({ startDate, endDate }, 'saleDate')).populate('paymentDetails.paymentMethod'),
  ]);
  const activeSessions = sessions.filter(s => s.status === 'open');
  const paymentStats = {};
  let totalSales = 0;
  sales.forEach(sale => {
    totalSales += sale.totalAmount;
    sale.paymentDetails.forEach(detail => {
      const pm = detail.paymentMethod;
      if (!pm) return;
      const id = pm._id.toString();
      if (!paymentStats[id]) {
        paymentStats[id] = { _id: id, name: pm.name, code: pm.code, color: pm.color, icon: pm.icon, totalAmount: 0, count: 0 };
      }
      let amt = detail.amount;
      if (pm.code === 'CASH') amt -= sale.changeAmount;
      paymentStats[id].totalAmount += amt;
      paymentStats[id].count += 1;
    });
  });
  return {
    sessions,
    totalSessions: sessions.length,
    activeSessions: activeSessions.length,
    totalSales,
    paymentMethods: Object.values(paymentStats)
  };
}

async function getOperationalExpenseStatsData({ startDate, endDate }) {
  const filter = buildDateFilter({ startDate, endDate }, 'date');
  const expenses = await OperationalExpense.find(filter);
  
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
  
  // Group expenses by date for charting
  const expensesByDate = {};
  expenses.forEach(exp => {
    const dateKey = exp.date.toISOString().split('T')[0];
    if (!expensesByDate[dateKey]) {
      expensesByDate[dateKey] = { date: dateKey, count: 0, amount: 0 };
    }
    expensesByDate[dateKey].count += 1;
    expensesByDate[dateKey].amount += exp.totalAmount;
  });
  
  // Get top 5 expense reasons by total amount
  const reasonsMap = {};
  expenses.forEach(exp => {
    if (!reasonsMap[exp.reason]) {
      reasonsMap[exp.reason] = { reason: exp.reason, count: 0, amount: 0 };
    }
    reasonsMap[exp.reason].count += 1;
    reasonsMap[exp.reason].amount += exp.totalAmount;
  });
  const topReasons = Object.values(reasonsMap)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  
  return {
    totalExpenses: expenses.length,
    totalAmount,
    expensesByDate: Object.values(expensesByDate).sort((a, b) => a.date.localeCompare(b.date)),
    topReasons
  };
}

// Controllers
exports.getSalesStats = async (req, res) => {
  try {
    const stats = await getSalesStatsData(req.query);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: MESSAGES.STATS_ERROR });
  }
};

exports.getProductStats = async (req, res) => {
  try {
    const stats = await getProductStatsData(req.query);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: MESSAGES.STATS_ERROR });
  }
};

exports.getCustomerStats = async (req, res) => {
  try {
    const stats = await getCustomerStatsData(req.query);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: MESSAGES.STATS_ERROR });
  }
};

exports.getPosSessionStats = async (req, res) => {
  try {
    const stats = await getPosSessionStatsData(req.query);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: MESSAGES.STATS_ERROR });
  }
};

exports.getOperationalExpensesStats = async (req, res) => {
  try {
    const stats = await getOperationalExpenseStatsData(req.query);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: MESSAGES.STATS_ERROR });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const params = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      productId: req.query.productId
    };
    const [salesStats, productStats, customerStats, posSessionStats, operationalExpenseStats] = await Promise.all([
      getSalesStatsData(params),
      getProductStatsData(params),
      getCustomerStatsData(params),
      getPosSessionStatsData(params),
      getOperationalExpenseStatsData(params)
    ]);
    res.json({ salesStats, productStats, customerStats, posSessionStats, operationalExpenseStats });
  } catch (error) {
    res.status(500).json({ error: MESSAGES.STATS_ERROR });
  }
};
