// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const { createProduct, getProducts, getProductById, updateProduct, deleteProduct, addStock  } = require('../controllers/productController');
const validate = require('../middlewares/validationMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Apply authentication middleware to all routes
router.use(auth);

router.get('/', getProducts);
router.get('/:id', getProductById);

// Solo admin y editor pueden crear, actualizar o eliminar productos
router.post('/', 
  auth, 
  role(['admin', 'editor']), 
  upload.array('images', 5), // Permite subir hasta 5 imágenes
  validate(['salePrice', 'purchaseCost', 'barcode', 'name', 'quantity']), 
  createProduct
);

router.put('/:id', 
  auth, 
  role(['admin', 'editor']), 
  upload.array('images', 5), // Permite subir hasta 5 imágenes
  updateProduct
);

router.delete('/:id', auth, role(['admin', 'editor']), deleteProduct);
router.patch('/:id/stock', auth, role(['admin', 'editor']), validate(['quantity']), addStock);

module.exports = router;
