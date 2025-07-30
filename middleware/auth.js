const { findInCollection } = require('../utils/database');

// Check if user is authenticated
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Check if user is admin
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Check if user is admin or accessing their own data
function requireAdminOrSelf(req, res, next) {
  const { username } = req.params;
  
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.session.user.role === 'admin' || req.session.user.username === username) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied' });
  }
}

// Attach current user to request
function attachUser(req, res, next) {
  if (req.session.user) {
    const user = findInCollection('users', u => u.username === req.session.user.username);
    req.currentUser = user;
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireAdminOrSelf,
  attachUser
};