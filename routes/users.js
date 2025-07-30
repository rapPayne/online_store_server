const express = require('express');
const bcrypt = require('bcryptjs');
const { 
  getCollection, 
  updateInCollection, 
  removeFromCollection,
  findInCollection 
} = require('../utils/database');
const { requireAdmin, requireAdminOrSelf } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', requireAdmin, (req, res) => {
  try {
    const users = getCollection('users');
    // Remove passwords from response
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific user (admin or self)
router.get('/:username', requireAdminOrSelf, (req, res) => {
  try {
    const { username } = req.params;
    const user = findInCollection('users', u => u.username === username);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...userResponse } = user;
    res.json(userResponse);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (admin or self)
router.patch('/:username', requireAdminOrSelf, async (req, res) => {
  try {
    const { username } = req.params;
    const updateData = { ...req.body };
    
    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    // Only admins can change roles
    if (updateData.role && req.session.user.role !== 'admin') {
      delete updateData.role;
    }
    
    const updatedUser = updateInCollection('users', u => u.username === username, updateData);
    
    if (updatedUser) {
      const { password, ...userResponse } = updatedUser;
      res.json(userResponse);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/:username', requireAdmin, (req, res) => {
  try {
    const { username } = req.params;
    const deletedUser = removeFromCollection('users', u => u.username === username);
    
    if (deletedUser) {
      const { password, ...userResponse } = deletedUser;
      res.json({ message: 'User deleted successfully', user: userResponse });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;