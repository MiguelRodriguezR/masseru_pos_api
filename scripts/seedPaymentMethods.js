// scripts/seedPaymentMethods.js
require('dotenv').config();
const mongoose = require('mongoose');
const PaymentMethod = require('../models/PaymentMethod');
const connectDB = require('../config/db');

// Connect to database
connectDB();

// Initial payment methods
const paymentMethods = [
  {
    name: 'Efectivo',
    code: 'CASH',
    description: 'Pago en efectivo',
    color: 'rgba(76, 175, 80, 0.8)', // Green
    icon: 'payments',
    isActive: true
  },
  {
    name: 'Tarjeta de Crédito',
    code: 'CREDIT',
    description: 'Pago con tarjeta de crédito',
    color: 'rgba(33, 150, 243, 0.8)', // Blue
    icon: 'credit_card',
    isActive: true
  },
  {
    name: 'Tarjeta de Débito',
    code: 'DEBIT',
    description: 'Pago con tarjeta de débito',
    color: 'rgba(0, 188, 212, 0.8)', // Cyan
    icon: 'credit_card',
    isActive: true
  },
  {
    name: 'Transferencia Bancaria',
    code: 'BANK',
    description: 'Pago mediante transferencia bancaria',
    color: 'rgba(255, 152, 0, 0.8)', // Orange
    icon: 'account_balance',
    isActive: true
  },
  {
    name: 'Nequi',
    code: 'NEQUI',
    description: 'Pago mediante Nequi',
    color: 'rgba(233, 30, 99, 0.8)', // Pink
    icon: 'smartphone',
    isActive: true
  },
  {
    name: 'Daviplata',
    code: 'DAVIPLATA',
    description: 'Pago mediante Daviplata',
    color: 'rgba(244, 67, 54, 0.8)', // Red
    icon: 'smartphone',
    isActive: true
  }
];

// Seed function
const seedPaymentMethods = async () => {
  try {
    // Clear existing payment methods
    await PaymentMethod.deleteMany({});
    console.log('Existing payment methods cleared');

    // Insert new payment methods
    const result = await PaymentMethod.insertMany(paymentMethods);
    console.log(`${result.length} payment methods seeded successfully`);

    // Exit process
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding payment methods:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed function
seedPaymentMethods();
