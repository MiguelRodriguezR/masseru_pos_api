// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if(!token) return res.status(401).json({ msg: 'No autorizado, token requerido' });

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ msg: 'Token inválido' });
  }
};
