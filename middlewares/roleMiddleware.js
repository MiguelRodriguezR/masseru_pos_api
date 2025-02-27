// middlewares/roleMiddleware.js
module.exports = function(roles = []) {
  // roles puede ser un string o un array de roles
  if (typeof roles === 'string') {
    roles = [roles];
  }
  return (req, res, next) => {
    if (!req.user || (roles.length && !roles.includes(req.user.role))) {
      return res.status(403).json({ msg: 'Acceso denegado: permisos insuficientes' });
    }
    next();
  };
};
