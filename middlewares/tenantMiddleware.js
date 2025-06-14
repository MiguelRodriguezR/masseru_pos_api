const { getTenantConnection } = require('../config/db');

module.exports = async (req, res, next) => {
  try {
    let tenantId;

    const origin = req.headers.origin;
    if (origin) {
      try {
        const { hostname } = new URL(origin);
        const parts = hostname.split('.');
        if (parts.length > 2) tenantId = parts[0];
      } catch (_) {
        // ignore URL parse errors
      }
    }

    if (!tenantId && req.headers['x-tenant-id']) {
      tenantId = req.headers['x-tenant-id'];
    }

    if (!tenantId) {
      return res.status(400).json({ msg: 'Tenant no especificado' });
    }

    const connection = await getTenantConnection(tenantId);
    req.db = connection;
    req.tenantId = tenantId;
    next();
  } catch (error) {
    console.error('Error obteniendo conexión de tenant:', error);
    res.status(500).json({ msg: 'Error de conexión a la base de datos' });
  }
};
