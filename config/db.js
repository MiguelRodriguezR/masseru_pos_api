const mongoose = require('mongoose');
// connections cache for each tenant
const connections = {};

// MONGO_URI_TEMPLATE should include "{tenantId}" placeholder for tenant database name

const connectDefault = async () => {
  if (connections.default) return connections.default;
  try {
    const conn = await mongoose.createConnection(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }).asPromise();
    connections.default = conn;
    console.log('Conectado a MongoDB');
    return conn;
  } catch (error) {
    console.error('Error de conexión a MongoDB', error);
    process.exit(1);
  }
};

const getTenantConnection = async (tenantId) => {
  if (!tenantId) throw new Error('tenantId requerido');
  if (connections[tenantId]) return connections[tenantId];
  const uri = (process.env.MONGO_URI_TEMPLATE || '').replace('{tenantId}', tenantId);
  const conn = await mongoose.createConnection(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).asPromise();
  connections[tenantId] = conn;
  return conn;
};

module.exports = connectDefault;
module.exports.getTenantConnection = getTenantConnection;
