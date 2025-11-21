// controllers/productController.js
const Product = require('../models/Product');
const Sale = require('../models/Sale');
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
    
    // Search parameter
    const search = req.query.search || '';
    
    // Build query
    let query = {};
    
    // Add search filter if search term is provided
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { barcode: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Count total products matching the query for pagination metadata
    const total = await Product.countDocuments(query);
    
    // Get products with pagination and search filter
    const products = await Product.find(query)
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

    // Verificar si existen ventas asociadas a este producto
    const salesWithProduct = await Sale.findOne({ 'items.product': req.params.id });

    if (salesWithProduct) {
      return res.status(400).json({
        msg: 'No se puede eliminar el producto porque tiene ventas asociadas',
        error: 'Este producto ya ha sido vendido y no puede ser eliminado para mantener la integridad de los registros de ventas.'
      });
    }

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

exports.exportInventoryToCSV = async (req, res) => {
  try {
    // Obtener todos los productos ordenados por cantidad
    const products = await Product.find({}).sort({ quantity: 1 });

    // Crear las cabeceras del CSV
    const headers = [
      'Código de Barras',
      'Nombre',
      'Descripción',
      'Precio de Venta',
      'Costo de Compra',
      'Cantidad Total',
      'Variantes',
      'Imágenes',
      'Fecha de Creación'
    ];

    // Función para escapar campos CSV (maneja comas y comillas)
    const escapeCSVField = (field) => {
      if (field === null || field === undefined) return '';
      const stringField = String(field);
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };

    // Construir las filas del CSV
    const rows = products.map(product => {
      // Formatear variantes
      let variantsStr = '';
      if (product.variants && product.variants.length > 0) {
        variantsStr = product.variants.map(v => {
          const variantDetails = [];
          if (v.color) variantDetails.push(`Color: ${v.color}`);
          if (v.size) variantDetails.push(`Talla: ${v.size}`);
          if (v.quantity !== undefined) variantDetails.push(`Cantidad: ${v.quantity}`);
          return variantDetails.join('; ');
        }).join(' | ');
      }

      // Formatear imágenes
      const imagesStr = product.images && product.images.length > 0
        ? product.images.join('; ')
        : 'Sin imágenes';

      // Formatear fecha
      const createdDate = product.createdAt
        ? new Date(product.createdAt).toLocaleDateString('es-ES')
        : '';

      return [
        escapeCSVField(product.barcode),
        escapeCSVField(product.name),
        escapeCSVField(product.description),
        escapeCSVField(product.salePrice),
        escapeCSVField(product.purchaseCost),
        escapeCSVField(product.quantity),
        escapeCSVField(variantsStr),
        escapeCSVField(imagesStr),
        escapeCSVField(createdDate)
      ].join(',');
    });

    // Combinar cabeceras y filas
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Configurar las cabeceras de respuesta para descarga
    const filename = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Agregar BOM para que Excel reconozca UTF-8 correctamente
    res.write('\uFEFF');
    res.write(csvContent);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
