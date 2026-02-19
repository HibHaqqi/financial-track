# API Documentation

Documentation for FinanceFlow API endpoints and data models.

## Base URL

```
/api
```

All API endpoints are prefixed with `/api`.

## Authentication

FinanceFlow uses NextAuth for authentication. Most endpoints require authentication.

### Authenticated Requests

Include session cookie automatically with NextAuth or use session tokens.

```javascript
// Using NextAuth session
const session = await getSession();
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

## Endpoints

### Transactions

#### GET /api/transactions

Get all transactions for the authenticated user.

**Query Parameters:**
- `month` (optional): Filter by month (1-12)
- `year` (optional): Filter by year
- `walletId` (optional): Filter by wallet
- `categoryId` (optional): Filter by category

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "type": "income" | "expense",
      "amount": number,
      "description": "string",
      "date": "string (ISO 8601)",
      "categoryId": "string",
      "walletId": "string",
      "creditCardId": "string | null",
      "userId": "string",
      "category": { ... },
      "wallet": { ... },
      "creditCard": { ... }
    }
  ]
}
```

#### GET /api/transactions/[id]

Get a single transaction by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "type": "income" | "expense",
    "amount": number,
    "description": "string",
    "date": "string (ISO 8601)",
    "categoryId": "string",
    "walletId": "string",
    "creditCardId": "string | null",
    "userId": "string",
    "category": { ... },
    "wallet": { ... },
    "creditCard": { ... }
  }
}
```

#### POST /api/transactions

Create a new transaction.

**Request Body:**
```json
{
  "type": "income" | "expense",
  "amount": number,
  "description": "string",
  "date": "string (ISO 8601)",
  "categoryId": "string",
  "walletId": "string",
  "creditCardId": "string | null",
  "isInstallment": boolean,
  "installmentTenor": number,
  "installmentMonthlyPayment": number
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "type": "income" | "expense",
    "amount": number,
    "description": "string",
    "date": "string (ISO 8601)",
    "categoryId": "string",
    "walletId": "string",
    "creditCardId": "string | null",
    "userId": "string"
  }
}
```

#### PUT /api/transactions/[id]

Update an existing transaction.

**Request Body:**
```json
{
  "type": "income" | "expense",
  "amount": number,
  "description": "string",
  "date": "string (ISO 8601)",
  "categoryId": "string",
  "walletId": "string",
  "creditCardId": "string | null"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

#### DELETE /api/transactions/[id]

Delete a transaction.

**Response:**
```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

### Wallets

#### GET /api/wallets

Get all wallets for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "initialBalance": number,
      "currentBalance": number,
      "userId": "string"
    }
  ]
}
```

#### POST /api/wallets

Create a new wallet.

**Request Body:**
```json
{
  "name": "string",
  "initialBalance": number
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "initialBalance": number,
    "currentBalance": number,
    "userId": "string"
  }
}
```

#### PUT /api/wallets/[id]

Update a wallet.

**Request Body:**
```json
{
  "name": "string",
  "initialBalance": number
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

#### DELETE /api/wallets/[id]

Delete a wallet and all associated transactions.

**Response:**
```json
{
  "success": true,
  "message": "Wallet deleted successfully"
}
```

### Categories

#### GET /api/categories

Get all categories for the authenticated user.

**Query Parameters:**
- `type` (optional): Filter by type ("income" | "expense")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "type": "income" | "expense",
      "icon": "string",
      "color": "string",
      "userId": "string"
    }
  ]
}
```

#### POST /api/categories

Create a new category.

**Request Body:**
```json
{
  "name": "string",
  "type": "income" | "expense",
  "icon": "string",
  "color": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "type": "income" | "expense",
    "icon": "string",
    "color": "string",
    "userId": "string"
  }
}
```

#### PUT /api/categories/[id]

Update a category.

**Request Body:**
```json
{
  "name": "string",
  "type": "income" | "expense",
  "icon": "string",
  "color": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

#### DELETE /api/categories/[id]

Delete a category.

**Response:**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

### Credit Cards

#### GET /api/credit-cards

Get all credit cards for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "totalLimit": number,
      "usedLimit": number,
      "billingDate": number,
      "userId": "string"
    }
  ]
}
```

#### POST /api/credit-cards

Create a new credit card.

**Request Body:**
```json
{
  "name": "string",
  "totalLimit": number,
  "billingDate": number
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "totalLimit": number,
    "usedLimit": number,
    "billingDate": number,
    "userId": "string"
  }
}
```

#### PUT /api/credit-cards/[id]

Update a credit card.

**Request Body:**
```json
{
  "name": "string",
  "totalLimit": number,
  "billingDate": number
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

#### DELETE /api/credit-cards/[id]

Delete a credit card and all associated transactions.

**Response:**
```json
{
  "success": true,
  "message": "Credit card deleted successfully"
}
```

### Credit Card Payments

#### POST /api/credit-cards/[id]/payments

Record a payment to a credit card.

**Request Body:**
```json
{
  "amount": number,
  "paymentDate": "string (ISO 8601)",
  "walletId": "string",
  "categoryId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction": { ... },
    "creditCard": { ... }
  }
}
```

### Credit Card Billing

#### GET /api/credit-cards/[id]/billing

Get monthly billing statement for a credit card.

**Query Parameters:**
- `month` (optional): Month (1-12), default: current month
- `year` (optional): Year, default: current year

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "string (e.g., 'January 2025')",
    "purchases": number,
    "installmentPayments": number,
    "payments": number,
    "totalBill": number
  }
}
```

### Installments

#### GET /api/installments

Get all installments for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "description": "string",
      "totalAmount": number,
      "monthlyPayment": number,
      "tenor": number,
      "currentInstallment": number,
      "startDate": "string (ISO 8601)",
      "creditCardId": "string",
      "categoryId": "string",
      "userId": "string"
    }
  ]
}
```

#### DELETE /api/installments/[id]

Delete an installment and all related transactions.

**Response:**
```json
{
  "success": true,
  "message": "Installment deleted successfully",
  "data": {
    "creditCard": { ... }
  }
}
```

### Dashboard Summary

#### GET /api/summary

Get financial summary for the authenticated user.

**Query Parameters:**
- `month` (optional): Month (1-12), default: current month
- `year` (optional): Year, default: current year

**Response:**
```json
{
  "success": true,
  "data": {
    "totalIncome": number,
    "totalExpenses": number,
    "netBalance": number,
    "transactionCount": number
  }
}
```

### Categories Summary

#### GET /api/categories/summary

Get category breakdown for the specified period.

**Query Parameters:**
- `month` (optional): Month (1-12), default: current month
- `year` (optional): Year, default: current year
- `type` (optional): Filter by type ("income" | "expense")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "categoryId": "string",
      "categoryName": "string",
      "totalAmount": number,
      "transactionCount": number,
      "percentage": number
    }
  ]
}
```

## Data Models

### Transaction

```typescript
interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string; // ISO 8601
  categoryId: string;
  walletId: string;
  creditCardId?: string;
  isInstallment?: boolean;
  installmentTenor?: number;
  installmentMonthlyPayment?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
```

### Wallet

```typescript
interface Wallet {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
```

### Category

```typescript
interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
```

### CreditCard

```typescript
interface CreditCard {
  id: string;
  name: string;
  totalLimit: number;
  usedLimit: number;
  billingDate: number; // 1-31
  userId: string;
  createdAt: string;
  updatedAt: string;
}
```

### Installment

```typescript
interface Installment {
  id: string;
  description: string;
  totalAmount: number;
  monthlyPayment: number;
  tenor: number;
  currentInstallment: number;
  startDate: string; // ISO 8601
  creditCardId: string;
  categoryId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

## Rate Limiting

Currently, there is no rate limiting implemented. Consider implementing rate limiting for production use.

## Pagination

Pagination is not yet implemented but planned for future releases.

## Webhooks

Webhooks are not currently supported but may be added in future versions.

## SDK/Client Libraries

Currently, only REST API is available. SDK libraries may be developed in the future.

## Testing API Endpoints

You can test API endpoints using:

1. **Browser DevTools Console** (for authenticated requests)
2. **Postman** or **Insomnia**
3. **cURL** commands

### Example cURL Request

```bash
# Get transactions (with session cookie)
curl -X GET http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  --cookie "next-auth.session-token=YOUR_SESSION_TOKEN"
```

## Versioning

API versioning is not currently implemented. All endpoints are considered v1.

## Changelog

### Current Version
- All basic CRUD operations for transactions, wallets, categories, credit cards
- Installment tracking and management
- Dashboard summary and analytics
- Privacy blur features

### Coming Soon
- Pagination for large datasets
- Advanced filtering and search
- Export functionality (CSV, PDF)
- Recurring transactions
- Budget management
- Goals and savings tracking

---

For more information:
- [Getting Started](./getting-started.md)
- [Features Guide](./features.md)
