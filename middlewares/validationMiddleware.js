// middlewares/validationMiddleware.js
module.exports = function(requiredFields = []) {
  return (req, res, next) => {
    // Check if data is in JSON format in 'product' field
    let dataToValidate = req.body;
    
    if (req.body.product) {
      try {
        dataToValidate = JSON.parse(req.body.product);
      } catch (e) {
        return res.status(400).json({ error: 'Formato de datos inválido' });
      }
    }
    
    const missingFields = [];
    requiredFields.forEach(field => {
      if (dataToValidate[field] === undefined) {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length) {
      return res.status(400).json({ msg: 'Faltan campos requeridos', missingFields });
    }
    
    next();
  };
};
