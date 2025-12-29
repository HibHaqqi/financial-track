# Installment Mechanism - Complete Guide

## 🔄 How Installments Work

### Data Flow:
```
1. User creates transaction with "Installment" checkbox enabled
       ↓
2. System creates TWO records:
   - Transaction record (expense)
   - Installment record (payment plan)
       ↓
3. Credit Card's usedLimit is increased by total amount
       ↓
4. Installment appears in:
   - Credit Card page (linked to card)
   - Dashboard (shows monthly burden)
```

---

## 📊 Database Relationships

```
Transaction
  ├─ id
  ├─ description
  ├─ amount
  ├─ type (expense)
  ├─ walletId (which wallet to track expense)
  ├─ categoryId
  └─ installmentId → links to Installment

Installment
  ├─ id
  ├─ description
  ├─ totalAmount (full purchase amount)
  ├─ monthlyPayment (amount / tenor)
  ├─ tenor (number of months)
  ├─ currentInstallment (starts at 1)
  ├─ startDate
  ├─ creditCardId → which card was used
  ├─ categoryId
  └─ transactionId → links back to Transaction
```

---

## 💡 How It Works in Practice

### Example: Buying a Laptop with Installments

**Scenario:**
- Purchase: MacBook Pro - Rp 24.000.000
- Credit Card: BCA Platinum
- Tenor: 12 months
- Monthly Payment: Rp 2.000.000

**What happens:**

1. **Transaction Created:**
   ```
   Description: "MacBook Pro (12 months)"
   Amount: 24.000.000
   Type: expense
   Wallet: "Cash" (just for tracking)
   Category: "Electronics"
   ```

2. **Installment Created:**
   ```
   Description: "MacBook Pro"
   Total Amount: 24.000.000
   Monthly Payment: 2.000.000
   Tenor: 12
   Current Installment: 1
   Credit Card: BCA Platinum
   ```

3. **Credit Card Updated:**
   ```
   BCA Platinum:
   - Total Limit: 50.000.000
   - Used Limit: 24.000.000 (increased by 24M!)
   - Available: 26.000.000
   ```

4. **What You See:**
   - ✅ Transaction appears in wallet history (24M expense)
   - ✅ Installment appears on Credit Cards page
   - ✅ Dashboard shows: "Monthly Installment Burden: 2.000.000"
   - ✅ Progress: "1/12 months"

---

## 🎯 Key Features

### 1. **Wallet vs Credit Card**
- **Wallet**: Just tracks the expense for your budget
- **Credit Card**: Tracks the actual debt and available limit
- They work together but serve different purposes!

### 2. **Monthly Burden Calculation**
```
Total Monthly Burden = Sum of all active installment monthly payments
```

This shows how much you need to pay each month for ALL installments combined.

### 3. **Progress Tracking**
```
Current Installment: 3/12 months
Status: Active
```

Each month, you would increment this (future feature: auto-update via cron job).

### 4. **Safety Features**
- ❌ Cannot delete credit card with active installments
- ✅ Must select expense type for installments
- ✅ Must select credit card and tenor

---

## 📝 How to Create an Installment

### Step 1: Add Transaction
1. Go to "Add Transaction" page
2. Select **Type: Expense**
3. Fill in:
   - Description (e.g., "MacBook Pro")
   - Amount (e.g., 24000000)
   - Category (e.g., "Electronics")
   - Wallet (any wallet for tracking)
   - Date

### Step 2: Enable Installment
4. ✅ Check **"Pay with Credit Card Installment"**
5. Select **Credit Card** (e.g., "BCA Platinum")
6. Enter **Installment Period** in months (e.g., 12)

### Step 3: See Monthly Payment Preview
```
Total: 24.000.000
Months: 12
Monthly: 2.000.000 ← auto-calculated!
```

### Step 4: Submit
7. Click "Add Transaction"
8. Done! You'll see:
   - Transaction in wallet
   - Installment plan on Credit Cards page
   - Updated credit card limit

---

## 🔄 What Happens Each Month

### Current State:
- Installment is created with `currentInstallment: 1`
- Shows as "1/12 months"

### Future Enhancement (Not Yet Implemented):
```javascript
// Cron job runs monthly
await updateInstallmentProgress(installmentId);

// This increments currentInstallment
// Month 1: 1/12
// Month 2: 2/12
// ...
// Month 12: 12/12 (Complete!)
```

### Manual Update (via API):
```bash
PATCH /api/installments
{
  "id": "installment-id",
  "action": "increment"
}
```

---

## 📱 Where to See Installments

### 1. **Dashboard** (`/`)
- Credit Card Widget shows:
  - Total cards
  - Monthly burden (sum of all installments)
  - Total active installments

### 2. **Credit Cards Page** (`/credit-cards`)
- Each card shows:
  - Active installments count
  - List of all installments for that card
  - Progress bars for each

### 3. **Transaction History**
- Original transaction appears in wallet
- Description includes "(12 months)" suffix

---

## ⚠️ Important Notes

### 1. **Double Counting?**
No! The transaction and installment serve different purposes:
- **Transaction**: Records the purchase in your budget/expense tracking
- **Installment**: Tracks the payment plan and debt on credit card

### 2. **Why Wallet AND Credit Card?**
- **Wallet**: You need to track that you spent 24M this month (budget)
- **Credit Card**: You need to track that you owe 24M split over 12 months (debt)

### 3. **Payment Tracking**
Currently, the system records the installment plan but doesn't automatically track monthly payments. Future enhancement would be:
- Auto-create "payment" transactions each month
- Decrement credit card usedLimit each month
- Mark installments as paid

---

## 🛠️ Technical Implementation

### Frontend (transaction-form.tsx):
```javascript
if (isInstallment && creditCardId && installmentTenor) {
  const monthlyPayment = amount / installmentTenor;

  await addInstallmentWithTransaction(
    // Installment data
    { description, totalAmount, monthlyPayment, tenor, ... },
    // Transaction data
    { description, amount, type, walletId, ... }
  );
}
```

### Backend (actions.ts):
```javascript
export async function addInstallmentWithTransaction(
  installment, transaction
) {
  // 1. Create transaction
  const createdTransaction = await dbAddTransaction(transaction);

  // 2. Create installment
  await dbAddInstallment({
    ...installment,
    transactionId: createdTransaction.id,
  });

  // 3. Update credit card used limit
  await updateCreditCardUsedLimit(
    installment.creditCardId,
    installment.totalAmount
  );
}
```

---

## 🎉 Complete!

Your installment system is now fully functional! Here's what you can do:

✅ Create transactions with installments
✅ Track installment progress
✅ See monthly burden on dashboard
✅ View all installments per credit card
✅ Credit cards properly show used limits

### To Test:
1. Go to `/add-transaction`
2. Create expense with installment checked
3. Visit `/credit-cards` - see your installment!
4. Visit `/` - see monthly burden updated!
