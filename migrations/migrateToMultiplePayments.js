// migrations/migrateToMultiplePayments.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

/**
 * Simple migration script to convert sales from single payment method to multiple payment methods
 * 
 * This script:
 * 1. Finds all sales with the old payment structure
 * 2. Converts them to use the new multiple payment methods structure
 * 3. Removes the old fields to keep the database clean
 */
async function migrateSales() {
  let client;
  try {
    // Connect to MongoDB
    const uri = process.env.MONGO_URI;
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get database name from connection string
    const dbName = uri.split('/').pop().split('?')[0];
    const db = client.db(dbName);
    
    // Get collections
    const salesCollection = db.collection('sales');
    
    // Find all sales that need migration (have paymentMethod or paymentAmount)
    const salesToMigrate = await salesCollection.find({
      $or: [
        { paymentMethod: { $exists: true } },
        { paymentAmount: { $exists: true } }
      ]
    }).toArray();
    
    console.log(`Found ${salesToMigrate.length} sales to migrate`);
    
    let migratedCount = 0;
    
    // Process each sale
    for (const sale of salesToMigrate) {
      console.log(`Migrating sale ${sale._id}...`);
      
      // Create the new payment details structure
      const paymentDetails = [{
        paymentMethod: sale.paymentMethod,
        amount: sale.paymentAmount || sale.totalAmount || 0
      }];
      
      // Update the sale with the new structure and remove old fields
      const result = await salesCollection.updateOne(
        { _id: sale._id },
        {
          $set: {
            paymentDetails: paymentDetails,
            totalPaymentAmount: sale.paymentAmount || sale.totalAmount || 0
          },
          $unset: {
            paymentMethod: "",
            paymentAmount: ""
          }
        }
      );
      
      if (result.modifiedCount === 1) {
        migratedCount++;
        console.log(`Successfully migrated sale ${sale._id}`);
      }
    }
    
    console.log(`\nMigration complete: ${migratedCount} sales migrated`);
    
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the migration
migrateSales()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
