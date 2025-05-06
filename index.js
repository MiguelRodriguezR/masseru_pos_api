// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const statsRoutes = require('./routes/statsRoutes');
const posSessionRoutes = require('./routes/posSessionRoutes');
const paymentMethodRoutes = require('./routes/paymentMethodRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const operationalExpenseRoutes = require('./routes/operationalExpenseRoutes');

const app = express();

// Conectar a la base de datos
connectDB();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads')); // Servir archivos estáticos desde la carpeta uploads

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/pos-sessions', posSessionRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/operational-expenses', operationalExpenseRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
