// middlewares/validationMiddleware.js
module.exports = function(requiredFields = []) {
  return (req, res, next) => {
    const missingFields = [];
    requiredFields.forEach(field => {
      if (req.body[field] === undefined) {
        missingFields.push(field);
      }
    });
    if (missingFields.length) {
      return res.status(400).json({ msg: 'Faltan campos requeridos', missingFields });
    }
    next();
  };
};
