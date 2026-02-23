# POS API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints except `/auth/login` require either:
- Session cookie (`session`) set via login
- Authorization header: `Authorization: Bearer <token>`

## Endpoints

### Authentication

#### POST `/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "maria@sarisar.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Maria Santos",
    "email": "maria@sarisar.com",
    "role": "cashier",
    "session": "eyJpZCI6MS4uLn0="
  }
}
```

**Set-Cookie:** `session=<token>; HttpOnly; Max-Age=86400`

---

### Products

#### GET `/products`
Fetch all products (optionally filtered).

**Query Parameters:**
- `lowStock` (optional): `true` to get only low-stock items

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Rice 5kg",
      "barcode": "001234567890",
      "price": 250.0,
      "stock": 15,
      "lowStockThreshold": 5,
      "createdAt": "2026-02-22T10:00:00.000Z",
      "updatedAt": "2026-02-22T10:00:00.000Z"
    }
  ]
}
```

#### POST `/products`
Create a new product.

**Request:**
```json
{
  "name": "Rice 5kg",
  "barcode": "001234567890",
  "price": 250.0,
  "stock": 15,
  "lowStockThreshold": 5
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Rice 5kg",
    "barcode": "001234567890",
    "price": 250.0,
    "stock": 15,
    "lowStockThreshold": 5,
    "createdAt": "2026-02-22T10:00:00.000Z",
    "updatedAt": "2026-02-22T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` – Missing required fields
- `409` – Barcode already exists
- `500` – Server error

---

### Sales

#### GET `/sales`
Fetch sales records with optional date range filtering.

**Query Parameters:**
- `startDate` (optional): ISO date string `2026-02-01T00:00:00.000Z`
- `endDate` (optional): ISO date string `2026-02-28T23:59:59.999Z`
- `limit` (optional): Number of records to return (default: 50)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "cashierId": 1,
      "total": 352.0,
      "createdAt": "2026-02-22T10:30:00.000Z",
      "cashier": {
        "id": 1,
        "name": "Maria Santos",
        "email": "maria@sarisar.com"
      },
      "items": [
        {
          "id": 1,
          "saleId": 1,
          "productId": 1,
          "price": 250.0,
          "quantity": 1,
          "product": {
            "id": 1,
            "name": "Rice 5kg"
          }
        }
      ]
    }
  ]
}
```

#### POST `/sales`
Create a new sale with items (transaction).

**Request:**
```json
{
  "cashierId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 1
    },
    {
      "productId": 2,
      "quantity": 2
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "cashierId": 1,
    "total": 352.0,
    "createdAt": "2026-02-22T10:30:00.000Z",
    "cashier": { ... },
    "items": [ ... ]
  }
}
```

**Behavior:**
- Automatically calculates total from product prices
- Updates product stock (decrements by quantity)
- Validates all products exist
- Creates atomic transaction

**Error Responses:**
- `400` – Missing cashierId or items
- `404` – Cashier or product not found
- `500` – Server error

---

### Reports

#### GET `/reports`
Fetch sales summary and analytics by time period.

**Query Parameters:**
- `period` (optional): `today` | `week` | `month` (default: `today`)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": "today",
    "dateRange": {
      "start": "2026-02-22T00:00:00.000Z",
      "end": "2026-02-22T15:30:00.000Z"
    },
    "summary": {
      "totalSales": 2500.50,
      "totalTransactions": 12,
      "totalItems": 45,
      "avgTransaction": 208.37
    },
    "topProducts": [
      {
        "productId": 1,
        "quantity": 20,
        "revenue": 5000.0
      }
    ],
    "salesByCashier": [
      {
        "cashierId": 1,
        "cashierName": "Maria Santos",
        "transactionCount": 8,
        "totalSales": 1800.0
      }
    ],
    "transactions": [ ... ]
  }
}
```

---

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200` – Success (GET requests)
- `201` – Created (POST requests)
- `400` – Bad Request (invalid input)
- `401` – Unauthorized (missing/invalid session)
- `404` – Not Found (resource doesn't exist)
- `409` – Conflict (duplicate barcode, etc.)
- `500` – Server Error

---

## Usage Examples

### Example 1: Login and Create a Sale

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@sarisar.com","password":"password123"}' \
  -c cookies.txt

# 2. Create a sale
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "cashierId": 1,
    "items": [
      {"productId": 1, "quantity": 2},
      {"productId": 2, "quantity": 1}
    ]
  }'
```

### Example 2: Fetch Sales Report

```bash
# Get today's sales summary
curl "http://localhost:3000/api/reports?period=today" \
  -b cookies.txt

# Get this week's report
curl "http://localhost:3000/api/reports?period=week" \
  -b cookies.txt

# Get this month's report
curl "http://localhost:3000/api/reports?period=month" \
  -b cookies.txt
```

### Example 3: Add New Product

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Canned Beans",
    "barcode": "001234567898",
    "price": 55.50,
    "stock": 20,
    "lowStockThreshold": 5
  }'
```

---

## Testing with Postman

1. Import the API endpoints into Postman
2. Use `{{baseUrl}}/auth/login` to login first
3. Postman will save the session cookie automatically
4. All subsequent requests will use that session

---

## Development Notes

- Session tokens expire after 24 hours
- Product stock is automatically decremented on sale creation
- All timestamps are in UTC
- Reports aggregate data across all cashiers
