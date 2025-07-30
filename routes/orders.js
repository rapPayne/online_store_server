const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { 
  getCollection, 
  addToCollection, 
  updateInCollection, 
  removeFromCollection,
  findManyInCollection,
  findInCollection
} = require('../utils/database');
const { requireAuth, requireAdmin, requireAdminOrSelf } = require('../middleware/auth');

const router = express.Router();

// Get all orders (admin only)
router.get('/', requireAdmin, (req, res) => {
  try {
    const orders = getCollection('orders');
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get orders for specific user (admin or self)
router.get('/user/:username', requireAdminOrSelf, (req, res) => {
  try {
    const { username } = req.params;
    const orders = findManyInCollection('orders', o => o.username === username);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific order (admin or order owner)
router.get('/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const order = findInCollection('orders', o => o.id === id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check if user can access this order
    if (req.session.user.role !== 'admin' && order.username !== req.session.user.username) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Checkout - create new order (authenticated users)
router.post('/checkout', requireAuth, (req, res) => {
  try {
    const { items, ship_address } = req.body;
    
    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }
    
    if (!ship_address) {
      return res.status(400).json({ error: 'Shipping address is required' });
    }
    
    // Validate items and check inventory
    const products = getCollection('products');
    const orderItems = [];
    let totalAmount = 0;
    
    for (const item of items) {
      const { product_id, quantity } = item;
      
      if (!product_id || !quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Invalid item data' });
      }
      
      const product = products.find(p => p.id === product_id);
      if (!product) {
        return res.status(400).json({ error: `Product ${product_id} not found` });
      }
      
      if (product.on_hand < quantity) {
        return res.status(400).json({ 
          error: `Insufficient inventory for ${product.name}. Available: ${product.on_hand}, Requested: ${quantity}` 
        });
      }
      
      const itemTotal = product.price * quantity;
      orderItems.push({
        product_id,
        quantity,
        price: product.price
      });
      
      totalAmount += itemTotal;
      
      // Update inventory
      updateInCollection('products', p => p.id === product_id, { 
        on_hand: product.on_hand - quantity 
      });
    }
    
    // Simulate credit card processing
    const paymentResult = simulatePayment(totalAmount);
    if (!paymentResult.success) {
      return res.status(400).json({ error: 'Payment failed: ' + paymentResult.error });
    }
    
    // Create order
    const newOrder = {
      id: uuidv4(),
      username: req.session.user.username,
      order_date: new Date().toISOString(),
      ship_address,
      items: orderItems,
      total_amount: totalAmount,
      payment_id: paymentResult.payment_id,
      status: 'confirmed'
    };
    
    const success = addToCollection('orders', newOrder);
    if (success) {
      res.status(201).json({
        message: 'Order placed successfully',
        order: newOrder
      });
    } else {
      res.status(500).json({ error: 'Failed to create order' });
    }
  } catch (error) {
    console.error('Error processing checkout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order (admin only)
router.patch('/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedOrder = updateInCollection('orders', o => o.id === id, updateData);
    
    if (updatedOrder) {
      res.json(updatedOrder);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete order (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = removeFromCollection('orders', o => o.id === id);
    
    if (deletedOrder) {
      res.json({ message: 'Order deleted successfully', order: deletedOrder });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simulate payment processing
function simulatePayment(amount) {
  // Simulate random payment success/failure (90% success rate)
  const success = Math.random() > 0.1;
  
  if (success) {
    return {
      success: true,
      payment_id: `pay_${uuidv4()}`,
      amount
    };
  } else {
    return {
      success: false,
      error: 'Card declined'
    };
  }
}

module.exports = router;