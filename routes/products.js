const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { 
  getCollection, 
  addToCollection, 
  updateInCollection, 
  removeFromCollection,
  findManyInCollection 
} = require('../utils/database');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all products (public)
router.get('/', (req, res) => {
  try {
    const products = getCollection('products');
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search products by name or category (public)
router.get('/search', (req, res) => {
  try {
    const { name, category } = req.query;
    let products = getCollection('products');

    if (name) {
      const searchTerm = name.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm)
      );
    }

    if (category) {
      const searchCategory = category.toLowerCase();
      products = products.filter(p => 
        p.category.toLowerCase().includes(searchCategory)
      );
    }

    res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product (public)
router.get('/:id', (req, res) => {
  try {
    const products = getCollection('products');
    const product = products.find(p => p.id === req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create product (admin only)
router.post('/', requireAdmin, (req, res) => {
  try {
    const { name, price, category, on_hand, description } = req.body;

    // Validation
    if (!name || price === undefined || !category || on_hand === undefined) {
      return res.status(400).json({ error: 'Missing required fields: name, price, category, on_hand' });
    }

    const newProduct = {
      id: uuidv4(),
      name,
      price: Number(price),
      category,
      on_hand: Number(on_hand),
      description: description || ''
    };

    const success = addToCollection('products', newProduct);
    if (success) {
      res.status(201).json(newProduct);
    } else {
      res.status(500).json({ error: 'Failed to create product' });
    }
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product (admin only)
router.patch('/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Convert numeric fields
    if (updateData.price !== undefined) {
      updateData.price = Number(updateData.price);
    }
    if (updateData.on_hand !== undefined) {
      updateData.on_hand = Number(updateData.on_hand);
    }

    const updatedProduct = updateInCollection('products', p => p.id === id, updateData);
    
    if (updatedProduct) {
      res.json(updatedProduct);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = removeFromCollection('products', p => p.id === id);
    
    if (deletedProduct) {
      res.json({ message: 'Product deleted successfully', product: deletedProduct });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;