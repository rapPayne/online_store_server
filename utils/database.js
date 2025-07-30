const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.json');

// Initialize database with default structure
function initializeDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    const initialData = {
      products: [],
      users: [],
      orders: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    console.log('Database initialized');
  }
}

// Read database
function readDatabase() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { products: [], users: [], orders: [] };
  }
}

// Write database
function writeDatabase(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
}

// Get collection
function getCollection(collectionName) {
  const db = readDatabase();
  return db[collectionName] || [];
}

// Update collection
function updateCollection(collectionName, data) {
  const db = readDatabase();
  db[collectionName] = data;
  return writeDatabase(db);
}

// Add item to collection
function addToCollection(collectionName, item) {
  const collection = getCollection(collectionName);
  collection.push(item);
  return updateCollection(collectionName, collection);
}

// Update item in collection
function updateInCollection(collectionName, predicate, updateData) {
  const collection = getCollection(collectionName);
  const index = collection.findIndex(predicate);
  
  if (index !== -1) {
    collection[index] = { ...collection[index], ...updateData };
    return updateCollection(collectionName, collection) ? collection[index] : null;
  }
  return null;
}

// Remove item from collection
function removeFromCollection(collectionName, predicate) {
  const collection = getCollection(collectionName);
  const index = collection.findIndex(predicate);
  
  if (index !== -1) {
    const removed = collection.splice(index, 1);
    updateCollection(collectionName, collection);
    return removed[0];
  }
  return null;
}

// Find item in collection
function findInCollection(collectionName, predicate) {
  const collection = getCollection(collectionName);
  return collection.find(predicate);
}

// Find items in collection
function findManyInCollection(collectionName, predicate) {
  const collection = getCollection(collectionName);
  return collection.filter(predicate);
}

module.exports = {
  initializeDatabase,
  readDatabase,
  writeDatabase,
  getCollection,
  updateCollection,
  addToCollection,
  updateInCollection,
  removeFromCollection,
  findInCollection,
  findManyInCollection
};