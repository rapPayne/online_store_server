const express = require('express');
const bcrypt = require('bcryptjs');
const { findInCollection, addToCollection } = require('../utils/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, first, last, street_address } = req.body;

    // Validation
    if (!username || !email || !password || !first || !last) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = findInCollection('users', u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = {
      username,
      email,
      password: hashedPassword,
      first,
      last,
      street_address: street_address || '',
      role: 'user' // Default role
    };

    const success = addToCollection('users', newUser);
    if (success) {
      // Don't return password
      const { password: _, ...userResponse } = newUser;
      res.status(201).json({ message: 'User created successfully', user: userResponse });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user
    const user = findInCollection('users', u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session
    req.session.user = {
      username: user.username,
      role: user.role
    };

    // Return user info (without password)
    const { password: _, ...userResponse } = user;
    res.json({ message: 'Login successful', user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Get current user
router.get('/me', requireAuth, (req, res) => {
  const user = findInCollection('users', u => u.username === req.session.user.username);
  if (user) {
    const { password: _, ...userResponse } = user;
    res.json(userResponse);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

module.exports = router;