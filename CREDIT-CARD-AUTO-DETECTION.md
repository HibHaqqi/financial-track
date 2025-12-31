# Credit Card Auto-Detection Guide

## 🎯 What It Does

The system now **automatically detects** credit card transactions and updates your credit card limits!

### Two Types of Detection:

1. **💳 Credit Card Purchases** → Increases used limit
2. **💳 Credit Card Payments** → Decreases used limit

---

## 📝 How to Use

### 1. Recording Credit Card Purchases

When you buy something with your credit card, create a transaction like this:

**Format:** `{Card Name} - {Description}`

**Examples:**
```
✅ "BCA Platinum - Grocery at Supermarket"
✅ "Mandiri Gold - Lunch at Restaurant"
✅ "BCA Platinum - Electric Bill"
```

**What happens:**
- Transaction is recorded (expense)
- Credit card used limit **increases** by the amount
- Available limit **decreases**

---

### 2. Recording Credit Card Payments

When you pay your credit card bill, create a transaction like this:

**Format:** `Credit Card Payment - {Card Name}`

**Examples:**
```
✅ "Credit Card Payment - BCA Platinum"
✅ "Payment - Mandiri Gold Credit Card"
✅ "Bayar Kartu Kredit - BCA Platinum"
✅ "Pembayaran Kartu Kredit - Mandiri Gold"
```

**What happens:**
- Transaction is recorded (expense)
- Credit card used limit **decreases** by the amount
- Available limit **increases**
- If payment matches installment amount, installment progress updates!

---

## 📊 Complete Examples

### Scenario 1: Buy Something with Credit Card

**Step 1:** Make a purchase
```
Transaction: "BCA Platinum - Buy Laptop"
Amount: 15.000.000
Type: Expense
```

**Result:**
```
BCA Platinum Card:
- Used Limit: +15.000.000 ✅ (increased)
- Available: Decreased by 15.000.000
```

---

### Scenario 2: Pay Credit Card Bill

**Step 1:** Pay your credit card
```
Transaction: "Credit Card Payment - BCA Platinum"
Amount: 5.000.000
Type: Expense
```

**Result:**
```
BCA Platinum Card:
- Used Limit: -5.000.000 ✅ (decreased)
- Available: Increased by 5.000.000
```

**Bonus:** If you have an installment with monthly payment of 5.000.000, the installment progress auto-updates!

---

## 🎨 Supported Formats

### Purchase Formats (Increases Used Limit):

```
{Card Name} - {Description}
  ✅ "BCA Platinum - Groceries"
  ✅ "Mandiri Gold - Gas Station"
  ✅ "Citi Bank - Online Shopping"

Purchase at {Store} - {Card Name}
  ✅ "Purchase at Tokopedia - BCA Platinum"

Belanja - {Card Name}
  ✅ "Belanja bulanan - Mandiri Gold"
```

### Payment Formats (Decreases Used Limit):

```
Credit Card Payment - {Card Name}
  ✅ "Credit Card Payment - BCA Platinum"

Payment - {Card Name} Credit Card
  ✅ "Payment - Mandiri Gold Credit Card"

Bayar Kartu Kredit - {Card Name}
  ✅ "Bayar Kartu Kredit - BCA Platinum"

Pembayaran Kartu Kredit - {Card Name}
  ✅ "Pembayaran Kartu Kredit - Mandiri Gold"
```

---

## 💡 Tips

### 1. Naming Consistency
Make sure your credit card name matches what you created:

```
Created card: "BCA Platinum"
Use in transaction: "BCA Platinum - Groceries" ✅

Created card: "Mandiri Gold"
Use in transaction: "Mandiri Gold - Lunch" ✅
```

### 2. Monthly Installment Tracking

When you have an installment:
```
Installment: 2.000.000/month for 12 months
```

Just create a payment transaction:
```
"Credit Card Payment - BCA Platinum"
Amount: 2.000.000
```

The system will:
- ✅ Decrease your used limit by 2.000.000
- ✅ Auto-update installment progress (1/12 → 2/12)
- ✅ Track that you've made the payment

### 3. Combining with Installments

You can use BOTH features together:

**Scenario:** Buy laptop with 12-month installment

**Step 1:** Create installment transaction (via form)
```
Type: Expense
✅ Pay with Credit Card Installment: Checked
Credit Card: BCA Platinum
Amount: 24.000.000
Tenor: 12 months
```
→ Used limit increases by 24.000.000

**Step 2:** Each month, pay the bill
```
Transaction: "Credit Card Payment - BCA Platinum"
Amount: 2.000.000
```
→ Used limit decreases by 2.000.000
→ Installment updates: 1/12 → 2/12

---

## 🔍 How It Works (Technical)

### Detection Logic:

```javascript
// Purchase Detection
if (description matches "{Card Name} - {Description}") {
  Find credit card by name
  Increase used limit by amount
  Log: "💳 Credit card purchase detected"
}

// Payment Detection
if (description matches "Credit Card Payment - {Card Name}") {
  Find credit card by name
  Decrease used limit by amount

  // Check if payment matches installment
  if (amount ≈ monthly installment) {
    Increment installment progress
    Log: "📊 Installment updated"
  }
}
```

### Console Logs:

When transactions are processed, you'll see:
```
💳 Credit card purchase detected: BCA Platinum, Amount: 15000000
💳 Credit card payment detected: BCA Platinum, Amount: 5000000
📊 Installment updated: MacBook Pro → 2/12
```

---

## ✅ What's Automated

- ✅ Detect credit card purchases from description
- ✅ Increase/decrease used limits automatically
- ✅ Update installment progress when payment matches
- ✅ Works with regular transactions (no UI changes needed)
- ✅ Supports English and Indonesian formats

---

## 🧪 Testing

### Test Purchase:
1. Create card: "Test Card" with limit 50.000.000
2. Add transaction: "Test Card - Test Purchase"
3. Amount: 10.000.000
4. Check /credit-cards page
5. ✅ Used limit should be 10.000.000

### Test Payment:
1. Add transaction: "Credit Card Payment - Test Card"
2. Amount: 5.000.000
3. Check /credit-cards page
4. ✅ Used limit should be 5.000.000

---

## 🎉 Benefits

1. **No Manual Math** - System calculates used limits automatically
2. **Real-time Tracking** - Always know your available credit
3. **Installment Tracking** - Progress updates when you pay
4. **Simple Format** - Just use descriptive transaction names
5. **Flexible** - Works with any card name

---

## ⚠️ Important Notes

1. **Card Name Must Match**
   - Created as "BCA Platinum"
   - Use "BCA Platinum - Purchase" ✅
   - Use "BCA - Purchase" ❌ (won't match)

2. **Payment Detection Priority**
   - System checks for payment patterns first
   - If payment detected, won't process as purchase

3. **Installment Matching**
   - Payment must be within Rp 100 of monthly amount
   - Updates oldest installment first

4. **No Undo** (Currently)
   - Once processed, changes are saved
   - To undo, manually edit the credit card

---

**Start using it now!** Just create transactions with the supported formats and watch your credit card limits update automatically! 🚀
