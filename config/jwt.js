// config/jwt.js
module.exports = {
  secret: process.env.JWT_SECRET || 'tu_clave_secreta',
  expiresIn: process.env.JWT_EXPIRES_IN || '1d'
};
