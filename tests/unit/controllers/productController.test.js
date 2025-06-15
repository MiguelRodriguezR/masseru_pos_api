// Imports
// Mongoose mocks provided by tests/mocks/mockUtils
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { MESSAGES } = require('../../../config/messages');
const productController = require('../../../controllers/productController');
const Product = require('../../../models/Product');
const {
  mockFind,
  mockFindById,
  mockCountDocuments,
  mockSave
} = require('../../mocks/mockUtils');
const { 
  mockProduct, 
  mockProductWithVariants, 
  mockProductsList
} = require('../../mocks/productMock');
const { mockUser } = require('../../mocks/userMock');

// Mock the mongoose models and external libraries
jest.mock('../../../models/Product');
jest.mock('fs');
jest.mock('path');

describe('Product Controller', () => {

  describe('createProduct', () => {
    test('should create a product successfully with JSON data', async () => {
      // Mock product data
      const productData = {
        name: 'New Product',
        barcode: '123456789',
        description: 'New product description',
        salePrice: 100,
        purchaseCost: 70,
        quantity: 50
      };

      // Mock request with user and product data
      req = mockRequest({ product: JSON.stringify(productData) }, { id: mockUser._id.toString() });
      
      // Mock files
      req.files = [
        { filename: 'test-image.jpg', path: '/uploads/products/test-image.jpg' }
      ];

      // Mock Product constructor and save method
      const savedProduct = {
        ...productData,
        _id: new mongoose.Types.ObjectId(),
        images: ['/uploads/products/test-image.jpg'],
        createdBy: mockUser._id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the Product constructor to return a document with save()
      const mockDoc = {
        ...savedProduct,
        save: jest.fn().mockResolvedValue({
          toObject: () => savedProduct
        })
      };
      
      // Mock Product to return our mock document
      Product.mockReturnValueOnce(mockDoc);

      // Execute the controller
      await productController.createProduct(req, res);

      // Assertions
      expect(Product).toHaveBeenCalledWith({
        ...productData,
        images: ['/uploads/products/test-image.jpg'],
        createdBy: mockUser._id.toString(),
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        msg: MESSAGES.PRODUCT_CREATED,
        product: expect.objectContaining({
          ...savedProduct,
          save: expect.any(Function)
        })
      });
    });

    test('should create a product successfully with direct body data', async () => {
      // Mock product data
      const productData = {
        name: 'New Product',
        barcode: '123456789',
        description: 'New product description',
        salePrice: 100,
        purchaseCost: 70,
        quantity: 50
      };

      // Mock request with user and product data
      req = mockRequest(productData, { id: mockUser._id.toString() });
      
      // Mock files
      req.files = [
        { filename: 'test-image.jpg', path: '/uploads/products/test-image.jpg' }
      ];

      // Mock Product constructor and save method
      const savedProduct = {
        ...productData,
        _id: new mongoose.Types.ObjectId(),
        images: ['/uploads/products/test-image.jpg'],
        createdBy: mockUser._id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the mongoose document return value
      Product.mockReturnValueOnce({
        ...savedProduct,
        save: jest.fn().mockResolvedValue({
          toObject: () => savedProduct
        })
      });

      // Execute the controller
      await productController.createProduct(req, res);

      // Assertions
      expect(Product).toHaveBeenCalledWith({
        ...productData,
        images: ['/uploads/products/test-image.jpg'],
        createdBy: mockUser._id.toString()
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        msg: MESSAGES.PRODUCT_CREATED,
        product: expect.objectContaining({
          ...savedProduct,
          save: expect.any(Function)
        })
      });
    });

    test('should create a product without images', async () => {
      // Mock product data
      const productData = {
        name: 'New Product',
        barcode: '123456789',
        description: 'New product description',
        salePrice: 100,
        purchaseCost: 70,
        quantity: 50
      };

      // Mock request with user and product data
      req = mockRequest(productData, { id: mockUser._id.toString() });
      
      // No files
      req.files = [];

      // Mock Product constructor and save method
      const savedProduct = {
        ...productData,
        _id: new mongoose.Types.ObjectId(),
        images: [],
        createdBy: mockUser._id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      Product.mockReturnValueOnce({
        ...savedProduct,
        save: jest.fn().mockResolvedValue({
          toObject: () => savedProduct
        })
      });

      // Execute the controller
      await productController.createProduct(req, res);

      // Assertions
      expect(Product).toHaveBeenCalledWith({
        ...productData,
        images: [],
        createdBy: mockUser._id.toString()
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        msg: MESSAGES.PRODUCT_CREATED,
        product: expect.objectContaining({
          ...savedProduct,
          save: expect.any(Function)
        })
      });
    });

    test('should handle invalid JSON format', async () => {
      // Mock invalid JSON data
      req = mockRequest({ product: 'invalid-json' }, { id: mockUser._id.toString() });
      
      // Execute the controller
      await productController.createProduct(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Formato de datos inválido' });
    });

    test('should handle server errors and clean up uploaded files', async () => {
      // Mock product data
      const productData = {
        name: 'New Product',
        barcode: '123456789',
        description: 'New product description',
        salePrice: 100,
        purchaseCost: 70,
        quantity: 50
      };

      // Mock request with user and product data
      req = mockRequest(productData, { id: mockUser._id.toString() });
      
      // Mock files
      req.files = [
        { filename: 'test-image.jpg', path: '/uploads/products/test-image.jpg' }
      ];

      // Mock Product constructor to throw an error
      const errorMessage = 'Database connection error';
      Product.mockImplementation(() => ({
        save: jest.fn().mockImplementation(() => {
          throw new Error(errorMessage);
        })
      }));

      // Execute the controller
      await productController.createProduct(req, res);

      // Assertions
      expect(fs.unlink).toHaveBeenCalledWith('/uploads/products/test-image.jpg', expect.any(Function));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('getProducts', () => {
    test('should get products with pagination and search', async () => {
      // Mock pagination and search parameters
      const page = 1;
      const limit = 10;
      const search = 'test';
      req = mockRequest({}, {}, {}, { page, limit, search });

      // Mock database calls
      mockCountDocuments(Product, 3);
      mockFind(Product, mockProductsList);

      // Execute the controller
      await productController.getProducts(req, res);

      // Assertions
      expect(Product.countDocuments).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { barcode: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
      expect(Product.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { barcode: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
      expect(res.json).toHaveBeenCalledWith({
        products: mockProductsList,
        pagination: {
          total: 3,
          page,
          limit,
          pages: Math.ceil(3 / limit)
        }
      });
    });

    test('should get all products without search', async () => {
      // Mock pagination parameters without search
      const page = 1;
      const limit = 10;
      req = mockRequest({}, {}, {}, { page, limit });

      mockCountDocuments(Product, 3);
      mockFind(Product, mockProductsList);

      // Execute the controller
      await productController.getProducts(req, res);

      // Assertions
      expect(Product.countDocuments).toHaveBeenCalledWith({});
      expect(Product.find).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith({
        products: mockProductsList,
        pagination: {
          total: 3,
          page,
          limit,
          pages: Math.ceil(3 / limit)
        }
      });
    });

    test('should handle server errors', async () => {
      // Mock Product.countDocuments to throw an error
      const errorMessage = 'Database connection error';
      Product.countDocuments = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await productController.getProducts(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('getProductById', () => {
    test('should get a product by ID successfully', async () => {
      // Mock request with product ID
      req = mockRequest({}, {}, { id: mockProduct._id.toString() });

      // Mock Product.findById
      mockFindById(Product, mockProduct);

      // Execute the controller
      await productController.getProductById(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith(mockProduct._id.toString());
      expect(res.json).toHaveBeenCalledWith(mockProduct);
    });

    test('should return 404 if product not found', async () => {
      // Mock request with non-existent product ID
      req = mockRequest({}, {}, { id: 'nonexistent-id' });

      mockFindById(Product, null);

      // Execute the controller
      await productController.getProductById(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.PRODUCT_NOT_FOUND });
    });

    test('should handle server errors', async () => {
      // Mock request with product ID
      req = mockRequest({}, {}, { id: mockProduct._id.toString() });

      // Mock Product.findById to throw an error
      const errorMessage = 'Database connection error';
      Product.findById = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await productController.getProductById(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('updateProduct', () => {
    test('should update a product successfully with JSON data', async () => {
      // Mock update data
      const updateData = {
        name: 'Updated Product',
        barcode: '987654321',
        description: 'Updated description',
        salePrice: 120,
        purchaseCost: 80
      };

      // Mock request
      req = mockRequest(
        { product: JSON.stringify(updateData) }, 
        {}, 
        { id: mockProduct._id.toString() }
      );
      
      // Mock files
      req.files = [
        { filename: 'new-image.jpg', path: '/uploads/products/new-image.jpg' }
      ];

      // Mock Product.findById to return a product
      Product.findById = jest.fn().mockResolvedValue(mockProduct);

      // Mock Product.findByIdAndUpdate to return updated product
      const updatedProduct = {
        ...mockProduct,
        ...updateData,
        images: [...mockProduct.images, '/uploads/products/new-image.jpg']
      };
      Product.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedProduct);

      // Execute the controller
      await productController.updateProduct(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith(mockProduct._id.toString());
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        mockProduct._id.toString(),
        {
          ...updateData,
          images: [...mockProduct.images, '/uploads/products/new-image.jpg']
        },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        msg: MESSAGES.PRODUCT_UPDATED,
        product: updatedProduct
      });
    });

    test('should update a product successfully with direct body data', async () => {
      // Mock update data
      const updateData = {
        name: 'Updated Product',
        barcode: '987654321',
        description: 'Updated description',
        salePrice: 120,
        purchaseCost: 80
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: mockProduct._id.toString() });
      
      // Mock files
      req.files = [
        { filename: 'new-image.jpg', path: '/uploads/products/new-image.jpg' }
      ];

      // Mock Product.findById to return a product
      Product.findById = jest.fn().mockResolvedValue(mockProduct);

      // Mock Product.findByIdAndUpdate to return updated product
      const updatedProduct = {
        ...mockProduct,
        ...updateData,
        images: [...mockProduct.images, '/uploads/products/new-image.jpg']
      };
      Product.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedProduct);

      // Execute the controller
      await productController.updateProduct(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith(mockProduct._id.toString());
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        mockProduct._id.toString(),
        {
          ...updateData,
          images: [...mockProduct.images, '/uploads/products/new-image.jpg']
        },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        msg: MESSAGES.PRODUCT_UPDATED,
        product: updatedProduct
      });
    });

    test('should replace all images when keepImages is false', async () => {
      // Mock update data
      const updateData = {
        name: 'Updated Product',
        keepImages: 'false'
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: mockProduct._id.toString() });
      
      // Mock files
      req.files = [
        { filename: 'new-image.jpg', path: '/uploads/products/new-image.jpg' }
      ];

      // Mock path.join to return full path
      path.join.mockReturnValue('/full/path/to/uploads/products/test-image.jpg');

      // Mock fs.existsSync to return true
      fs.existsSync.mockReturnValue(true);

      // Mock Product.findById to return a product
      Product.findById = jest.fn().mockResolvedValue({
        ...mockProduct,
        images: ['/uploads/products/test-image.jpg']
      });

      // Mock Product.findByIdAndUpdate to return updated product
      const updatedProduct = {
        ...mockProduct,
        name: 'Updated Product',
        images: ['/uploads/products/new-image.jpg']
      };
      Product.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedProduct);

      // Execute the controller
      await productController.updateProduct(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith(mockProduct._id.toString());
      expect(fs.existsSync).toHaveBeenCalledWith('/full/path/to/uploads/products/test-image.jpg');
      expect(fs.unlinkSync).toHaveBeenCalledWith('/full/path/to/uploads/products/test-image.jpg');
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        mockProduct._id.toString(),
        {
          name: 'Updated Product',
          keepImages: 'false',
          images: ['/uploads/products/new-image.jpg']
        },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        msg: MESSAGES.PRODUCT_UPDATED,
        product: updatedProduct
      });
    });

    test('should return 404 if product not found', async () => {
      // Mock update data
      const updateData = {
        name: 'Updated Product'
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: 'nonexistent-id' });

      // Mock Product.findById to return null
      Product.findById = jest.fn().mockResolvedValue(null);

      // Execute the controller
      await productController.updateProduct(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.PRODUCT_NOT_FOUND });
    });

    test('should handle invalid JSON format', async () => {
      // Mock request with invalid JSON data
      req = mockRequest({ 
        product: 'invalid-json' 
      }, { 
        id: mockUser._id.toString() 
      }, { 
        id: mockProduct._id.toString() 
      });
      
      // Mock Product.findById so it doesn't fail before the JSON parse
      Product.findById = jest.fn().mockResolvedValue(mockProduct);

      // Execute the controller
      await productController.updateProduct(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Formato de datos inválido' });
    });

    test('should handle server errors and clean up uploaded files', async () => {
      // Mock update data
      const updateData = {
        name: 'Updated Product'
      };

      // Mock request
      req = mockRequest(updateData, {}, { id: mockProduct._id.toString() });
      
      // Mock files
      req.files = [
        { filename: 'new-image.jpg', path: '/uploads/products/new-image.jpg' }
      ];

      // Mock Product.findById to throw an error
      const errorMessage = 'Database connection error';
      Product.findById = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await productController.updateProduct(req, res);

      // Assertions
      expect(fs.unlink).toHaveBeenCalledWith('/uploads/products/new-image.jpg', expect.any(Function));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('deleteProduct', () => {
    test('should delete a product successfully and remove associated images', async () => {
      // Mock request
      req = mockRequest({}, {}, { id: mockProduct._id.toString() });

      // Mock path.join to return full path
      path.join.mockReturnValue('/full/path/to/uploads/products/test-image.jpg');

      // Mock fs.existsSync to return true
      fs.existsSync.mockReturnValue(true);

      // Mock Product.findById to return a product with images
      Product.findById = jest.fn().mockResolvedValue({
        ...mockProduct,
        images: ['/uploads/products/test-image.jpg']
      });

      // Mock Product.findByIdAndDelete
      Product.findByIdAndDelete = jest.fn().mockResolvedValue(mockProduct);

      // Execute the controller
      await productController.deleteProduct(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith(mockProduct._id.toString());
      expect(fs.existsSync).toHaveBeenCalledWith('/full/path/to/uploads/products/test-image.jpg');
      expect(fs.unlinkSync).toHaveBeenCalledWith('/full/path/to/uploads/products/test-image.jpg');
      expect(Product.findByIdAndDelete).toHaveBeenCalledWith(mockProduct._id.toString());
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.PRODUCT_DELETED });
    });

    test('should return 404 if product not found', async () => {
      // Mock request
      req = mockRequest({}, {}, { id: 'nonexistent-id' });

      // Mock Product.findById to return null
      Product.findById = jest.fn().mockResolvedValue(null);

      // Execute the controller
      await productController.deleteProduct(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.PRODUCT_NOT_FOUND });
    });

    test('should handle server errors', async () => {
      // Mock request
      req = mockRequest({}, {}, { id: mockProduct._id.toString() });

      // Mock Product.findById to throw an error
      const errorMessage = 'Database connection error';
      Product.findById = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await productController.deleteProduct(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe('addStock', () => {
    test('should add stock to a product successfully', async () => {
      // Mock stock data
      const stockData = {
        quantity: 10
      };

      // Mock request
      req = mockRequest(stockData, {}, { id: mockProduct._id.toString() });

      // Mock Product.findById to return a product
      const productToUpdate = {
        ...mockProduct,
        quantity: mockProduct.quantity,
        variants: [],
        save: jest.fn().mockResolvedValue({
          ...mockProduct,
          quantity: mockProduct.quantity + stockData.quantity
        })
      };
      Product.findById = jest.fn().mockResolvedValue(productToUpdate);

      // Execute the controller
      await productController.addStock(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith(mockProduct._id.toString());
      expect(productToUpdate.quantity).toBe(mockProduct.quantity + stockData.quantity);
      expect(productToUpdate.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Stock actualizado',
        product: expect.objectContaining({
          quantity: mockProduct.quantity + stockData.quantity
        })
      });
    });

    test('should add stock to a specific variant', async () => {
      // Mock stock data with variant
      const stockData = {
        quantity: 5,
        variant: {
          color: 'Red',
          size: 'M'
        }
      };

      // Mock request
      req = mockRequest(stockData, {}, { id: mockProductWithVariants._id.toString() });

      // Create a copy of the product with variants that we can modify
      const productToUpdate = {
        ...mockProductWithVariants,
        quantity: mockProductWithVariants.quantity,
        variants: [
          {
            color: 'Red',
            size: 'M',
            quantity: 30
          },
          {
            color: 'Blue',
            size: 'L',
            quantity: 20
          }
        ],
        save: jest.fn().mockResolvedValue({
          ...mockProductWithVariants,
          quantity: mockProductWithVariants.quantity + stockData.quantity,
          variants: [
            {
              color: 'Red',
              size: 'M',
              quantity: 30 + stockData.quantity
            },
            {
              color: 'Blue',
              size: 'L',
              quantity: 20
            }
          ]
        })
      };
      
      Product.findById = jest.fn().mockResolvedValue(productToUpdate);

      // Execute the controller
      await productController.addStock(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith(mockProductWithVariants._id.toString());
      expect(productToUpdate.quantity).toBe(mockProductWithVariants.quantity + stockData.quantity);
      expect(productToUpdate.variants[0].quantity).toBe(30 + stockData.quantity);
      expect(productToUpdate.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Stock actualizado',
        product: expect.objectContaining({
          quantity: mockProductWithVariants.quantity + stockData.quantity,
          variants: expect.arrayContaining([
            expect.objectContaining({
              color: 'Red',
              size: 'M',
              quantity: 30 + stockData.quantity
            })
          ])
        })
      });
    });

    test('should add a new variant if it does not exist', async () => {
      // Mock stock data with new variant
      const stockData = {
        quantity: 15,
        variant: {
          color: 'Green',
          size: 'S'
        }
      };

      // Mock request
      req = mockRequest(stockData, {}, { id: mockProductWithVariants._id.toString() });

      // Create a copy of the product with variants that we can modify
      const productToUpdate = {
        ...mockProductWithVariants,
        quantity: mockProductWithVariants.quantity,
        variants: [
          {
            color: 'Red',
            size: 'M',
            quantity: 30
          },
          {
            color: 'Blue',
            size: 'L',
            quantity: 20
          }
        ],
        save: jest.fn().mockResolvedValue({
          ...mockProductWithVariants,
          quantity: mockProductWithVariants.quantity + stockData.quantity,
          variants: [
            {
              color: 'Red',
              size: 'M',
              quantity: 30
            },
            {
              color: 'Blue',
              size: 'L',
              quantity: 20
            },
            {
              color: 'Green',
              size: 'S',
              quantity: 15
            }
          ]
        })
      };
      
      Product.findById = jest.fn().mockResolvedValue(productToUpdate);

      // Execute the controller
      await productController.addStock(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith(mockProductWithVariants._id.toString());
      expect(productToUpdate.quantity).toBe(mockProductWithVariants.quantity + stockData.quantity);
      expect(productToUpdate.variants.length).toBe(3);
      expect(productToUpdate.variants[2]).toEqual({
        color: 'Green',
        size: 'S',
        quantity: 15
      });
      expect(productToUpdate.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Stock actualizado',
        product: expect.objectContaining({
          quantity: mockProductWithVariants.quantity + stockData.quantity
        })
      });
    });

    test('should return 400 if quantity is invalid', async () => {
      // Mock invalid stock data
      const stockData = {
        quantity: -5
      };

      // Mock request
      req = mockRequest(stockData, {}, { id: mockProduct._id.toString() });

      // Execute the controller
      await productController.addStock(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.INVALID_QUANTITY });
    });

    test('should return 404 if product not found', async () => {
      // Mock stock data
      const stockData = {
        quantity: 10
      };

      // Mock request
      req = mockRequest(stockData, {}, { id: 'nonexistent-id' });

      // Mock Product.findById to return null
      Product.findById = jest.fn().mockResolvedValue(null);

      // Execute the controller
      await productController.addStock(req, res);

      // Assertions
      expect(Product.findById).toHaveBeenCalledWith('nonexistent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: MESSAGES.PRODUCT_NOT_FOUND });
    });

    test('should handle server errors', async () => {
      // Mock stock data
      const stockData = {
        quantity: 10
      };

      // Mock request
      req = mockRequest(stockData, {}, { id: mockProduct._id.toString() });

      // Mock Product.findById to throw an error
      const errorMessage = 'Database connection error';
      Product.findById = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute the controller
      await productController.addStock(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
});
