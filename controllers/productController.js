// controllers/productController.js
const Product = require('../models/Product');

exports.createProduct = async (req, res) => {
  try {
    const {
      salePrice,
      purchaseCost,
      barcode,
      name,
      description,
      images,
      quantity,
      variants
    } = req.body;
    const product = new Product({
      salePrice,
      purchaseCost,
      barcode,
      name,
      description,
      images,
      quantity,
      variants,
      createdBy: req.user.id
    });
    await product.save();
    res.status(201).json({ msg: 'Producto creado', product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if(!product) return res.status(404).json({ msg: 'Producto no encontrado' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if(!updatedProduct) return res.status(404).json({ msg: 'Producto no encontrado' });
    res.json({ msg: 'Producto actualizado', product: updatedProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if(!deletedProduct) return res.status(404).json({ msg: 'Producto no encontrado' });
    res.json({ msg: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.addStock = async (req, res) => {
  try {
    const productId = req.params.id;
    const { quantity, variant } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ msg: 'La cantidad a agregar debe ser un número positivo' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ msg: 'Producto no encontrado' });

    // Sumar cantidad al stock total del producto
    product.quantity += quantity;

    if (variant) {
      // Buscar la variante existente que coincida con los detalles enviados
      const variantIndex = product.variants.findIndex(v => {
        let match = true;
        for (let key in variant) {
          if (v[key] !== variant[key]) {
            match = false;
            break;
          }
        }
        return match;
      });

      if (variantIndex === -1) {
        // Si no existe la variante, se agrega como nueva con la cantidad inicial
        product.variants.push({ ...variant, quantity });
      } else {
        // Si existe, se suma la cantidad a la variante encontrada
        product.variants[variantIndex].quantity += quantity;
      }
    }

    await product.save();
    res.json({ msg: 'Stock actualizado', product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
