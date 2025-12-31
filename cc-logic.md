It sounds like you are building this with **Anti Gravity** (likely referring to the React/Next.js stack or a specific UI framework). To ensure your credit card and installment logic is flawless, here is your coding summary and execution plan.

### 📋 The Logic Summary

You are managing three moving parts: **Liquidity** (Bank Wallets), **Debt Capacity** (Credit Card Limits), and **Time** (Installment Tenors).

* **Fund Source = Credit Card:** Increases `usedLimit`. No impact on cash.
* **Fund Source = Bank Wallet:** Decreases wallet balance.
* **Payment to CC:** Decreases `usedLimit` (restores limit) and decreases Bank Wallet.
* **Installments:** Blocks the `totalAmount` on the CC immediately, then creates monthly `expense` transactions from the Wallet to slowly "buy back" that limit.

---

### 🚀 Execution Plan

#### Phase 1: Database Setup (Prisma)

Ensure your `Installment` model is linked to a `linkedWalletId`. This is the "autopay" source.

* Update `Transaction` to have an optional `installmentId` (remove `@unique`).
* Update `Installment` to include `linkedWalletId`.

#### Phase 2: The "Purchase" Controller

When a transaction is created:

1. **Check Fund Source:** If the user selects a Credit Card:
* Create the `Transaction` record.
* `prisma.creditCard.update`: Increment `usedLimit` by the transaction amount.


2. **Check if Installment:** If "Is Installment" is checked:
* Create the `Installment` record.
* `usedLimit` increments by the **Total Amount**, not just the first month.



#### Phase 3: The "Payment/Transfer" Controller

When paying the CC bill from a Bank Wallet:

1. Create a `Transaction` with `type: transfer`.
2. Decrement `Wallet.balance`.
3. Decrement `CreditCard.usedLimit`.

#### Phase 4: The Monthly Worker (Installment Logic)

Create a function/cron job that runs monthly:

1. Find all `isActive` installments.
2. **For each:**
* Create an `expense` Transaction assigned to the `linkedWalletId`.
* Reduce `CreditCard.usedLimit` by the `monthlyPayment`.
* Increment `Installment.currentInstallment`.
* If `currentInstallment == tenor`, set `isActive: false`.



---

### 🛠️ Key Implementation Details

| Action | Wallet Balance | CC Used Limit | CC Available Limit |
| --- | --- | --- | --- |
| **Buy Item (CC)** | No change | **Up ↑** | **Down ↓** |
| **Pay Bill (Wallet → CC)** | **Down ↓** | **Down ↓** | **Up ↑** |
| **Installment Month 1** | **Down ↓** | **Down ↓** | **Up ↑** |

---

### 💡 Pro-Tips for Anti Gravity

* **Validation:** Always check if `(totalLimit - usedLimit) >= transactionAmount` before allowing a CC purchase.
* **Atomic Transactions:** Use `prisma.$transaction([])` when updating a wallet and a credit card at the same time. This prevents "ghost money" if one update fails.
* **UI Feedback:** In your dashboard, show a "Credit Utilization" percentage: `(usedLimit / totalLimit) * 100`.


