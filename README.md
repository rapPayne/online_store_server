# RESTful Node.js/Express API Server

A complete RESTful API server built with Node.js and Express, featuring authentication, role-based access control, and a flat file JSON database.

## Features

- **Authentication**: Username/password based with bcrypt hashing
- **Role-based Access Control**: Admin and user roles with different permissions
- **Flat File Database**: JSON-based storage in `database.json`
- **Collections**: Products, Users, Orders
- **Product Search**: Search by name or category
- **Checkout System**: Simulated payment processing
- **Security**: Session-based authentication with proper middleware

## Installation

```bash
npm install
npm start
```

Server runs on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user info

### Products (GET public, others admin-only)
- `GET /api/products` - Get all products
- `GET /api/products/search?name=...&category=...` - Search products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PATCH /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Users (admin or self access)
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:username` - Get user (admin or self)
- `PATCH /api/users/:username` - Update user (admin or self)
- `DELETE /api/users/:username` - Delete user (admin)

### Orders
- `GET /api/orders` - Get all orders (admin)
- `GET /api/orders/user/:username` - Get user orders (admin or self)
- `GET /api/orders/:id` - Get specific order (admin or owner)
- `POST /api/orders/checkout` - Create order (authenticated)
- `PATCH /api/orders/:id` - Update order (admin)
- `DELETE /api/orders/:id` - Delete order (admin)

## Default Accounts

### Admin Account
- Username: `admin`
- Password: `password`
- Role: `admin`

### User Account
- Username: `john_doe`
- Password: `password`
- Role: `user`

## Database Schema

### Products
```json
{
  "id": "string",
  "name": "string",
  "price": "number",
  "category": "string",
  "on_hand": "number",
  "description": "string"
}
```

### Users
```json
{
  "username": "string",
  "email": "string",
  "password": "string (hashed)",
  "first": "string",
  "last": "string",
  "street_address": "string",
  "role": "admin|user"
}
```

### Orders
```json
{
  "id": "string",
  "username": "string",
  "order_date": "ISO string",
  "ship_address": "string",
  "items": [
    {
      "product_id": "string",
      "quantity": "number",
      "price": "number"
    }
  ],
  "total_amount": "number",
  "payment_id": "string",
  "status": "string"
}
```

## Example Usage

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}' \
  -c cookies.txt
```

### Create Product (Admin)
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "New Product",
    "price": 29.99,
    "category": "Electronics",
    "on_hand": 10,
    "description": "A great new product"
  }'
```

### Checkout
```bash
curl -X POST http://localhost:3000/api/orders/checkout \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "items": [
      {"product_id": "prod_1", "quantity": 2}
    ],
    "ship_address": "123 Main St, City, State 12345"
  }'
```

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- Role-based access control
- Input validation
- Error handling
- CORS support

## File Structure

```
├── app.js              # Main application file
├── database.json       # Flat file database
├── middleware/
│   └── auth.js        # Authentication middleware
├── routes/
│   ├── auth.js        # Authentication routes
│   ├── products.js    # Product routes
│   ├── users.js       # User routes
│   └── orders.js      # Order routes
├── utils/
│   └── database.js    # Database utility functions
└── README.md
```