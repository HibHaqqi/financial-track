# Features Guide

Complete guide to all FinanceFlow features and how to use them.

## Table of Contents

- [Dashboard](#dashboard)
- [Transactions](#transactions)
- [Wallets](#wallets)
- [Categories](#categories)
- [Credit Cards](#credit-cards)
- [Installments](#installments)
- [Privacy Features](#privacy-features)

## Dashboard

The dashboard provides a comprehensive overview of your financial health.

### Monthly Overview

- **Total Income**: Sum of all income transactions for the selected month
- **Total Expenses**: Sum of all expense transactions for the selected month
- **Net Balance**: Difference between income and expenses
  - Green: Positive balance
  - Red: Negative balance

### Filtering by Month/Year

Use the month and year dropdowns to view different time periods:
- Select any month from January to December
- Choose the year to view historical data
- Charts and summaries update automatically

### Balance Chart

Visual representation of your balance over time:
- Line chart showing balance trends
- Hover to see exact amounts for each date
- Identifies patterns in your spending/saving

### Category Breakdown

Pie chart showing expense distribution:
- Visual breakdown by category
- Color-coded for easy identification
- Hover to see percentage and amount

## Transactions

Track all your income and expenses in one place.

### Adding Transactions

1. Click the **"Add Transaction"** button in the header
2. Fill in the transaction details:
   - **Type**: Income (↑) or Expense (↓)
   - **Amount**: Enter the monetary value
   - **Description**: Brief description of the transaction
   - **Category**: Select from existing categories
   - **Wallet/Credit Card**: Choose the funding source
   - **Date**: Transaction date (defaults to today)
   - **Installment** (optional): For credit card purchases with installments
     - Number of months (tenor)
     - Monthly payment amount
3. Click **"Save"**

### Transaction Types

#### Income Transactions
- Marked with green arrow (↑)
- Increase wallet balances
- Examples: Salary, dividends, refunds

#### Expense Transactions
- Marked with red arrow (↓)
- Decrease wallet balances
- Examples: Groceries, rent, utilities

### Editing Transactions

1. Go to **Recent Transactions** on dashboard
2. Find the transaction you want to edit
3. Click the **Edit** (pencil) icon
4. Modify the details
5. Click **"Update Transaction"**

### Deleting Transactions

1. Find the transaction in **Recent Transactions**
2. Click the **Delete** (trash) icon
3. Confirm deletion in the dialog

**Note**: This action cannot be undone.

### AI-Powered Categorization

FinanceFlow uses AI to automatically suggest categories based on your transaction description:

1. Enter a description (e.g., "Starbucks coffee")
2. The AI analyzes the text
3. Suggests the most appropriate category (e.g., "Food & Drinks")
4. You can accept or override the suggestion

## Wallets

Manage multiple wallets and bank accounts.

### Creating a Wallet

1. Navigate to **Wallets** from the menu
2. Click **"Add Wallet"**
3. Enter wallet details:
   - **Name**: e.g., "Cash", "BCA", "GoPay"
   - **Initial Balance**: Starting amount
4. Click **"Save"**

### Wallet Balance

Your wallet balance updates automatically:
- **Increases** when you add income
- **Decreases** when you record expenses
- **Adjusts** when you transfer between wallets

### Editing a Wallet

1. Go to **Wallets** page
2. Click the **Edit** icon next to the wallet
3. Update the name or balance
4. Click **"Update"**

### Deleting a Wallet

1. Go to **Wallets** page
2. Click the **Delete** icon
3. Confirm deletion

**Warning**: Deleting a wallet also deletes all associated transactions.

## Categories

Organize your transactions with custom categories.

### Creating a Category

1. Navigate to **Categories** from the menu
2. Click **"Add Category"**
3. Enter category details:
   - **Name**: e.g., "Food", "Transport", "Salary"
   - **Icon**: Choose a representative icon
   - **Color**: Pick a color for visual identification
4. Click **"Save"**

### Category Types

Categories work for both transaction types:
- **Expense Categories**: Food, Transport, Entertainment, etc.
- **Income Categories**: Salary, Freelance, Investment, etc.

### Managing Categories

- **Edit**: Click the edit icon to modify name, icon, or color
- **Delete**: Remove unused categories (cannot delete if transactions exist)

## Credit Cards

Track and manage your credit cards effectively.

### Adding a Credit Card

1. Go to **Credit Cards** from the menu
2. Click **"Add Card"**
3. Fill in card details:
   - **Card Name**: e.g., "BCA Visa", "Mandiri Mastercard"
   - **Total Limit**: Your credit limit
   - **Billing Date**: Day of month (1-31)
4. Click **"Save"**

### Credit Limit Tracking

Monitor your credit usage:

- **Total Limit**: Your maximum credit amount
- **Used Limit**: Current outstanding balance
- **Available Limit**: Remaining credit you can use
- **Usage Percentage**: Visual progress bar

### Monthly Billing Statements

View detailed billing for each credit card:

1. Scroll to **Monthly Billing** section
2. Click on a card to expand billing details
3. See breakdown:
   - **Purchases**: Regular spending
   - **Installments**: Active installment plans
   - **Payments**: Amounts you've paid
   - **Total Bill**: Current outstanding amount

### Billing Period Selection

Filter billing by month and year:
- Use the dropdowns to select period
- View historical billing statements
- Track spending patterns over time

### Making Credit Card Payments

1. Find your credit card in the list
2. Click the **"Pay"** button
3. Enter payment details:
   - **Amount**: How much you're paying
   - **Payment Date**: When payment was made
   - **Source Wallet**: Which wallet to pay from
   - **Category**: Payment category (optional)
4. Click **"Record Payment"**

**Effect**:
- Decreases credit card used limit
- Decreases source wallet balance
- Records as expense transaction

### Editing Credit Cards

1. Click the **menu** (three dots) icon
2. Select **"Edit Card"**
3. Update details (limit, name, billing date)
4. Click **"Update"**

### Deleting Credit Cards

1. Click the **menu** (three dots) icon
2. Select **"Delete Card"**
3. Confirm deletion

**Warning**: This deletes all associated transactions and installments.

## Installments

Track installment plans for large purchases.

### Creating an Installment

Installments are created when you add a credit card transaction:

1. Add transaction with credit card as payment source
2. Check **"This is an installment"** checkbox
3. Enter installment details:
   - **Tenor**: Number of months (e.g., 6, 12, 24)
   - **Monthly Payment**: Amount per month
4. Save the transaction

### Viewing Installments

Go to the **Credit Cards** page and scroll to **Installments** section:

#### Active Installments
- Current progress with visual bar
- Months remaining
- Monthly payment amount (blurred for privacy)
- Total amount
- Progress indicator: X/Y months completed

#### Completed Installments
- All finished installment plans
- Original total amount
- Completion badge

### Deleting Installments

1. Find the installment in the list
2. Click the **Delete** (trash) icon
3. Confirm deletion

**Effects**:
- Deletes all related monthly transaction records
- Restores credit card limit
- Removes from installment tracking

### Installment Calculation

Installments automatically calculate:
- **Monthly Payment**: Total amount ÷ tenor
- **Progress**: Based on billing periods from start date
- **Completion**: When all months are paid

## Privacy Features

FinanceFlow includes privacy-focused features to protect your financial data.

### Privacy Blur (Default)

All money amounts are **blurred by default**:
- Dashboard summaries
- Transaction amounts
- Credit card limits
- Installment payments
- All monetary values

### Global Blur Toggle

Located in the **top header** (right side):

- **Eye Off Icon** (👁️‍🗨️): Amounts are hidden
- **Eye Icon** (👁️): Amounts are visible
- Click to toggle all amounts at once

### Individual Amount Toggle

Hover over any blurred amount:
- Eye icon appears on hover
- Click to show/hide that specific amount
- Also toggles global state

### Use Cases

- **Public Spaces**: Use in cafes, airports, or shared spaces
- **Screen Sharing**: Keep amounts private during video calls
- **Privacy Mode**: Hide sensitive information from prying eyes

### Blur Persistence

- Blur state persists during your session
- Resets to **blurred** on page refresh
- All amounts start blurred for maximum privacy

## Charts and Visualizations

### Balance Chart

- **Location**: Dashboard
- **Type**: Line chart
- **Shows**: Balance trends over time
- **Interaction**: Hover to see exact amounts

### Category Chart

- **Location**: Dashboard
- **Type**: Pie chart
- **Shows**: Expense distribution by category
- **Interaction**: Hover for percentages and amounts

### Progress Bars

- **Credit Card Usage**: Visual indicator of credit used
- **Installment Progress**: Shows completion status

## Tips and Best Practices

### Transaction Management

1. **Add transactions regularly** for accurate tracking
2. **Use descriptive names** for better AI categorization
3. **Review transactions** weekly to catch errors
4. **Reconcile** with bank statements monthly

### Category Organization

1. **Create broad categories** first (Food, Transport)
2. **Add sub-categories** as needed
3. **Use consistent colors** for similar expenses
4. **Review categories** periodically and merge unused ones

### Credit Card Management

1. **Track billing dates** to avoid late payments
2. **Monitor usage** to stay within limits
3. **Pay in full** when possible to avoid interest
4. **Review statements** monthly for accuracy

### Installment Tracking

1. **Check progress** monthly
2. **Plan ahead** for upcoming payments
3. **Complete early** if you have extra funds
4. **Avoid new installments** when existing ones are high

## Keyboard Shortcuts

Coming soon! Keyboard shortcuts will be added for quick transaction entry.

## Mobile Responsiveness

FinanceFlow is fully responsive:

- **Mobile**: Card-based layout for transactions
- **Tablet**: Optimized touch targets
- **Desktop**: Full table views and charts

Access your finances anywhere, on any device!

---

For more information, see:
- [Getting Started](./getting-started.md)
- [API Documentation](./api.md)
