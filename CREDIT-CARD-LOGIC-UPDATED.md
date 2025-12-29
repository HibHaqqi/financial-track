# Credit Card Logic - Updated Implementation

## 📋 Overview

This document describes the **updated and improved** credit card logic that aligns with the comprehensive approach outlined in `cc-logic.md`. The system now properly manages **Liquidity** (Bank Wallets), **Debt Capacity** (Credit Card Limits), and **Time** (Installment Tenors) with proper atomic transactions and validation.

---

## 🎯 Key Changes

### 1. **Database Schema**
- ✅ Added `linkedWalletId` to `Installment` model for autopay source
- ✅ Removed `@unique` constraint from `Transaction.installmentId` (allowing multiple transactions per installment)
- ✅ Removed direct relation between Transaction and Installment

### 2. **Atomic Transactions**
- ✅ All credit card operations use `prisma.$transaction()` for data consistency
- ✅ Prevents "ghost money" if operations fail
- ✅ Credit card updates are atomic with transaction creation

### 3. **Credit Limit Validation**
- ✅ Validates purchases against available credit limit
- ✅ Throws error if purchase would exceed limit
- ✅ Shows available limits in console logs

### 4. **Monthly Installment Worker**
- ✅ API endpoint: `/api/installments/process-monthly`
- ✅ Creates expense transactions from linked wallet
- ✅ Reduces credit card used limit (restores available credit)
- ✅ Increments installment progress
- ✅ Supports cron job integration

### 5. **UI Updates**
- ✅ Transaction form requires `linkedWalletId` for installments
- ✅ "Payment Source Wallet" field for autopay selection

---

## 🔧 How It Works

### Phase 1: Database Setup ✅

**Migration:** `prisma/migrations/20251229_update_cc_logic_linked_wallet/migration.sql`

Changes:
- Added `linkedWalletId` to `Installment` table (optional field)
- Removed unique constraint from `Transaction.installmentId`
- Added foreign key to `Wallet` for autopay source

---

### Phase 2: Credit Card Purchase Logic ✅

**When a user makes a credit card purchase:**

1. **Detection:** Transaction description matches credit card patterns
   - Examples: `"BCA Platinum - Grocery"`, `"Purchase at Store - Mandiri Gold"`

2. **Validation:** Checks available credit limit
   ```javascript
   const availableLimit = creditCard.totalLimit - creditCard.usedLimit;
   if (amount > availableLimit) {
     throw new Error(`Purchase declined: Amount exceeds available credit limit`);
   }
   ```

3. **Atomic Update:** Uses transaction context
   ```javascript
   await prisma.$transaction(async (tx) => {
     // Create transaction
     const newTransaction = await tx.transaction.create({...});

     // Update credit card limit atomically
     await tx.creditCard.update({
       where: { id: creditCard.id },
       data: { usedLimit: { increment: amount } }
     });
   });
   ```

**Effect:**
| Wallet Balance | CC Used Limit | CC Available Limit |
|---|---|---|
| No change | **Up ↑** | **Down ↓** |

---

### Phase 3: Credit Card Payment Logic ✅

**When a user pays their credit card bill:**

1. **Detection:** Transaction description matches payment patterns
   - Examples: `"Credit Card Payment - BCA Platinum"`, `"Bayar Kartu Kredit - Mandiri Gold"`

2. **Atomic Update:**
   ```javascript
   await tx.creditCard.update({
     where: { id: creditCard.id },
     data: { usedLimit: { decrement: amount } }
   });
   ```

3. **Installment Matching:** If payment matches monthly installment amount
   - Automatically increments installment progress
   - Updates oldest installment first

**Effect:**
| Wallet Balance | CC Used Limit | CC Available Limit |
|---|---|---|
| **Down ↓** | **Down ↓** | **Up ↑** |

---

### Phase 4: Monthly Installment Worker ✅

**API Endpoint:** `POST /api/installments/process-monthly`

**What it does:**
1. Finds all active installments (where `currentInstallment < tenor`)
2. For each installment:
   - Creates an expense transaction from `linkedWalletId`
   - Reduces credit card `usedLimit` by `monthlyPayment`
   - Increments `currentInstallment`
   - Marks as complete when `currentInstallment == tenor`

**Console Output:**
```
🔄 Starting monthly installment processing...
📊 Found 5 active installments
✅ Processed installment: MacBook Pro
   Payment: Rp2,000,000 from BCA Bank Account
   Progress: 3/12
   Transaction created: abc-123-def
💳 Credit card limit reduced by Rp2,000,000
✅ Monthly installment processing complete: 5 installments processed
```

**Setting up Cron Job (Vercel):**
```json
{
  "crons": [{
    "path": "/api/installments/process-monthly",
    "schedule": "0 0 1 * *"
  }]
}
```

**Manual Trigger:**
```bash
curl -X POST https://your-app.com/api/installments/process-monthly \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📊 Complete Transaction Flow

### Scenario 1: Regular Credit Card Purchase

**User Action:**
```
Transaction: "BCA Platinum - Buy Laptop"
Amount: Rp15,000,000
Type: Expense
```

**System Response:**
```javascript
✅ Transaction created
💳 Credit card purchase detected: BCA Platinum
   Available limit before: Rp50,000,000
   Available limit after: Rp35,000,000
```

**Result:**
- Transaction recorded in source wallet
- Credit card used limit: +Rp15,000,000
- Available limit: -Rp15,000,000

---

### Scenario 2: Creating an Installment

**User Action:**
1. Enable "Pay with Credit Card Installment"
2. Select: BCA Platinum
3. Tenor: 12 months
4. **NEW:** Select: BCA Bank Account (for autopay)
5. Amount: Rp24,000,000

**System Response:**
```javascript
✅ Transaction created: Rp24,000,000
✅ Installment created: MacBook Pro (12 months)
   Total: Rp24,000,000, Monthly: Rp2,000,000
💳 Credit card used limit increased by: Rp24,000,000
   Available limit before: Rp50,000,000
   Available limit after: Rp26,000,000
```

**What happens:**
1. Initial transaction created (records the purchase)
2. Installment record created with `linkedWalletId = BCA Bank Account`
3. Credit card used limit increased by **TOTAL amount** (Rp24,000,000)
4. System now expects monthly payments of Rp2,000,000

**Monthly (via cron job):**
```javascript
// Month 1
✅ Processed installment: MacBook Pro
   Payment: Rp2,000,000 from BCA Bank Account
   Progress: 1/12
💳 Credit card used limit decreased by: Rp2,000,000
   Available limit restored: Rp28,000,000

// Month 2
✅ Processed installment: MacBook Pro
   Payment: Rp2,000,000 from BCA Bank Account
   Progress: 2/12
💳 Credit card used limit decreased by: Rp2,000,000
   Available limit restored: Rp30,000,000
```

---

### Scenario 3: Manual Credit Card Payment

**User Action:**
```
Transaction: "Credit Card Payment - BCA Platinum"
Amount: Rp5,000,000
Type: Expense
```

**System Response:**
```javascript
✅ Transaction created
💳 Credit card payment detected: BCA Platinum
   Payment amount: Rp5,000,000
📊 Installment updated: MacBook Pro → 3/12
💳 Credit card used limit decreased by: Rp5,000,000
   Available limit restored: Rp35,000,000
```

**What happens:**
1. Payment reduces used limit (frees up credit)
2. If payment matches installment amount, increments progress
3. Updates oldest matching installment

---

## 🛡️ Safety Features

### 1. **Atomic Transactions**
```javascript
await prisma.$transaction(async (tx) => {
  // Either ALL succeed or ALL fail
  await tx.transaction.create({...});
  await tx.creditCard.update({...});
  await tx.installment.update({...});
});
```

### 2. **Credit Limit Validation**
```javascript
if (amount > availableLimit) {
  throw new Error(
    `Purchase declined: Rp${amount} exceeds available limit Rp${availableLimit}`
  );
}
```

### 3. **Cron Job Authentication**
- Requires `CRON_SECRET` environment variable
- Also supports user authentication for manual triggers

### 4. **Installment Completion Check**
- Automatically stops processing when `currentInstallment >= tenor`
- Prevents over-payment

---

## 🎨 UI/UX Changes

### Transaction Form Updates

**New Field for Installments:**
```
┌─────────────────────────────────────┐
│ ☐ Pay with Credit Card Installment  │
└─────────────────────────────────────┘
     ↓ (when checked)
┌──────────────────┬─────────────────┬──────────────────┐
│ Credit Card      │ Tenor (months)  │ Payment Source   │
│ BCA Platinum     │ 12              │ BCA Bank Acct    │
│ Mandiri Gold     │ 24              │ Mandiri Savings  │
└──────────────────┴─────────────────┴──────────────────┘
                    ↓
           Monthly: Rp2,000,000
```

**Validation Messages:**
- "For installments, please select a credit card, specify tenor, and choose a wallet for monthly payments"
- "Purchase declined: Amount (Rp15,000,000) exceeds available credit limit (Rp10,000,000) for card 'BCA Platinum'"

---

## 🔍 Monitoring & Logging

### Console Logs (Development)

**Purchase:**
```
💳 Credit card purchase detected: BCA Platinum, Amount: 15000000
   Available limit before: Rp50,000,000
   Available limit after: Rp35,000,000
```

**Payment:**
```
💳 Credit card payment detected: BCA Platinum, Amount: 5000000
📊 Installment updated: MacBook Pro → 3/12
```

**Installment Creation:**
```
✅ Installment created: MacBook Pro
   Total: Rp24,000,000, Monthly: Rp2,000,000
   Credit card used limit increased by: Rp24,000,000
```

**Monthly Worker:**
```
🔄 Starting monthly installment processing...
📊 Found 5 active installments
✅ Processed installment: MacBook Pro
   Payment: Rp2,000,000 from BCA Bank Account
   Progress: 3/12
   Transaction created: abc-123
✅ Monthly installment processing complete: 5 installments processed
```

---

## 📝 Environment Variables

Add to `.env`:
```bash
# Secret for cron job authentication
CRON_SECRET=your-secret-key-here

# Optional: Schedule (if using external cron)
# CRON_SCHEDULE="0 0 1 * *"  # First day of every month
```

---

## 🚀 Deployment Checklist

- [x] Database migration applied
- [x] Schema updated with `linkedWalletId`
- [x] Transaction form updated to require linked wallet
- [x] Atomic transactions implemented
- [x] Credit limit validation added
- [x] Monthly worker API endpoint created
- [x] Build succeeds without errors
- [ ] Set `CRON_SECRET` in production
- [ ] Configure cron job (Vercel/GitHub Actions)
- [ ] Test with real transactions
- [ ] Monitor first monthly run

---

## 🧪 Testing

### Test Credit Card Purchase
1. Create card: "Test Card" with limit Rp50,000,000
2. Add transaction: `"Test Card - Test Purchase"` amount Rp10,000,000
3. Check: Used limit should be Rp10,000,000
4. Check: Available limit should be Rp40,000,000

### Test Purchase Declined
1. Add transaction: `"Test Card - Large Purchase"` amount Rp60,000,000
2. Should error: "Purchase declined: exceeds available credit limit"

### Test Installment Creation
1. Enable installment option
2. Select card, tenor 12, and linked wallet
3. Amount: Rp24,000,000
4. Check: Used limit increased by Rp24,000,000
5. Check: Installment created with linkedWalletId

### Test Monthly Worker
```bash
curl -X POST http://localhost:3000/api/installments/process-monthly \
  -H "Authorization: Bearer your-secret"
```

Expected response:
```json
{
  "success": true,
  "message": "Successfully processed 5 installments",
  "processed": 5,
  "details": [...]
}
```

---

## 📚 API Reference

### POST /api/installments/process-monthly

Process all active installments (monthly autopay).

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Successfully processed 5 installments",
  "processed": 5,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "details": [
    {
      "installmentId": "abc-123",
      "description": "MacBook Pro",
      "progress": "3/12",
      "isComplete": false,
      "transactionId": "def-456",
      "amount": 2000000
    }
  ]
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

## 🎉 Benefits

1. **No Manual Math** - System calculates everything automatically
2. **Real-time Tracking** - Always know your available credit
3. **Prevents Over-limit** - Validates purchases before processing
4. **Autopay Support** - Monthly payments automated via cron
5. **Data Consistency** - Atomic transactions prevent ghost money
6. **Flexible** - Works with any credit card and wallet combination
7. **Transparent** - Clear console logs for debugging

---

**Last Updated:** 2025-12-29
**Status:** ✅ Implementation Complete
**Build:** ✅ Passing
**Next Steps:** Deploy and configure cron job
