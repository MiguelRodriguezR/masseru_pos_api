// controllers/productController.js
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

exports.createProduct = async (req, res) => {
  try {
    let productData;
    
    // Verificar si los datos vienen como JSON en un campo 'product'
    if (req.body.product) {
      try {
        productData = JSON.parse(req.body.product);
      } catch (e) {
        return res.status(400).json({ error: 'Formato de datos inválido' });
      }
    } else {
      // Si no viene en formato JSON, usar los campos directos del body
      const {
        salePrice,
        purchaseCost,
        barcode,
        name,
        description,
        quantity,
        variants
      } = req.body;
      
      productData = {
        salePrice,
        purchaseCost,
        barcode,
        name,
        description,
        quantity,
        variants
      };
    }
    
    // Procesar las imágenes subidas
    const images = [];
    if (req.files && req.files.length > 0) {
      // Guardar las rutas de las imágenes
      req.files.forEach(file => {
        // Guardar la ruta relativa para acceder desde el frontend
        images.push(`/uploads/products/${file.filename}`);
      });
    }
    
    const product = new Product({
      ...productData,
      images,
      createdBy: req.user.id
    });
    
    await product.save();
    res.status(201).json({ msg: 'Producto creado', product });
  } catch (error) {
    // Si hay un error, eliminar las imágenes subidas
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error al eliminar archivo:', err);
        });
      });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Count total products for pagination metadata
    const total = await Product.countDocuments();
    
    // Get products with pagination
    const products = await Product.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Return products with pagination metadata
    res.json({
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
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
    const productId = req.params.id;
    const product = await Product.findById(productId);
    
    if (!product) return res.status(404).json({ msg: 'Producto no encontrado' });
    
    // Verificar si los datos vienen como JSON en un campo 'product'
    let updateData;
    if (req.body.product) {
      try {
        updateData = JSON.parse(req.body.product);
      } catch (e) {
        return res.status(400).json({ error: 'Formato de datos inválido' });
      }
    } else {
      // Si no viene en formato JSON, usar los campos directos del body
      updateData = { ...req.body };
    }
    
    // Procesar las imágenes subidas
    if (req.files && req.files.length > 0) {
      const newImages = [];
      
      // Guardar las rutas de las nuevas imágenes
      req.files.forEach(file => {
        newImages.push(`/uploads/products/${file.filename}`);
      });
      
      // Si se envía el campo 'keepImages' como false, se reemplazan todas las imágenes
      if (req.body.keepImages === 'false') {
        // Eliminar las imágenes antiguas
        if (product.images && product.images.length > 0) {
          product.images.forEach(imagePath => {
            // Obtener la ruta completa del archivo
            const fullPath = path.join(__dirname, '..', imagePath.replace(/^\//, ''));
            // Eliminar el archivo si existe
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          });
        }
        updateData.images = newImages;
      } else {
        // Añadir las nuevas imágenes a las existentes
        updateData.images = [...(product.images || []), ...newImages];
      }
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    );
    
    res.json({ msg: 'Producto actualizado', product: updatedProduct });
  } catch (error) {
    // Si hay un error, eliminar las imágenes subidas
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error al eliminar archivo:', err);
        });
      });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) return res.status(404).json({ msg: 'Producto no encontrado' });
    
    // Eliminar las imágenes asociadas al producto
    if (product.images && product.images.length > 0) {
      product.images.forEach(imagePath => {
        // Obtener la ruta completa del archivo
        const fullPath = path.join(__dirname, '..', imagePath.replace(/^\//, ''));
        // Eliminar el archivo si existe
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }
    
    // Eliminar el producto de la base de datos
    await Product.findByIdAndDelete(req.params.id);
    
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
