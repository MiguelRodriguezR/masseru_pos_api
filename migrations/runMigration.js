// migrations/runMigration.js
const path = require('path');
const fs = require('fs');

// Get the migration script name from command line arguments
const migrationScript = process.argv[2];

if (!migrationScript) {
  console.error('Please provide a migration script name');
  console.log('Usage: node runMigration.js <migrationScriptName>');
  console.log('Example: node runMigration.js migrateSalesToMultiplePayments');
  process.exit(1);
}

const scriptPath = path.join(__dirname, `${migrationScript}.js`);

// Check if the script exists
if (!fs.existsSync(scriptPath)) {
  console.error(`Migration script not found: ${scriptPath}`);
  process.exit(1);
}

console.log(`Running migration script: ${migrationScript}`);

// Run the migration script
require(scriptPath);
