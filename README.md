# FinanceFlow

A comprehensive personal finance tracking application built with Next.js, featuring intelligent categorization, multi-wallet support, credit card management, and privacy-focused design.

## 🌟 Core Features

### User Management
- **User Authentication**: Secure registration and login using NextAuth
- **Profile Management**: Customizable user profiles and settings

### Transaction Management
- **Add Transactions**: Record expenses and income with date, category, and wallet tags
- **Transaction Types**: Support for both expense and revenue transactions
- **AI-Powered Categorization**: Intelligent auto-categorization using pre-trained models
- **Recent Transactions**: Quick view of recent financial activities
- **Edit & Delete**: Full CRUD operations on transactions

### Financial Dashboard
- **Monthly Dashboard**: Filtered view showing:
  - Total income
  - Total expenses
  - Net income/balance
  - Category breakdown with charts
- **Balance Charts**: Visual representation of financial trends over time
- **Category Analysis**: Pie charts showing expense distribution

### Multi-Wallet Support
- **Multiple Wallets**: Track transactions across different wallets and bank accounts
- **Wallet Management**: Create, edit, and delete wallets
- **Wallet Balances**: Real-time balance tracking across all wallets

### Credit Card Management
- **Credit Card Tracking**: Manage multiple credit cards
- **Limit Tracking**: Monitor total limit, used limit, and available credit
- **Monthly Billing**: Detailed billing statements with:
  - Purchases breakdown
  - Installment payments
  - Payment history
  - Total bill calculation
- **Payment Management**: Record and track credit card payments
- **Billing Date Tracking**: Customize billing dates for each card

### Installment Management
- **Installment Tracking**: Track installment plans for purchases
- **Progress Monitoring**: Visual progress indicators for installment completion
- **Monthly Payment Tracking**: Automatic monthly payment recording
- **Tenor Management**: Track payment tenure and completion status
- **Active & Completed Views**: Separate views for active and completed installments

### Categories
- **Custom Categories**: Create and manage expense/income categories
- **Category Icons**: Visual representation with customizable icons
- **Category Colors**: Color-coded categories for easy identification

### Privacy Features
- **Privacy Blur**: All money amounts are blurred by default
- **Global Toggle**: One-click toggle in header to show/hide all amounts
- **Individual Toggle**: Hover over any amount to reveal it
- **Privacy Mode**: Protect sensitive financial information from prying eyes

## 🎨 Design Guidelines

- **Primary Color**: Blue (#3490dc) - calm and trustworthy
- **Background**: Light gray (#f0f4f8) - clean, minimalist
- **Accent Color**: Darker blue (#2779bd) - interactive elements
- **Font**: Inter - modern, grotesque-style sans-serif
- **Icons**: Minimalist icons for categories and wallets
- **Layout**: Clean, structured with consistent spacing
- **Animations**: Subtle transitions for enhanced UX

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: NextAuth
- **UI Components**: Radix UI + Tailwind CSS
- **Charts**: Recharts
- **Database**: PostgreSQL with Prisma ORM
- **Icons**: Lucide React

## 📚 Documentation

For detailed documentation, visit the [docs](./docs) folder:

- [Getting Started](./docs/getting-started.md) - Setup and installation guide
- [Features Guide](./docs/features.md) - Complete feature documentation
- [API Documentation](./docs/api.md) - API endpoints and data models
- [Deployment Guide](./docs/deployment.md) - Production deployment instructions
- [Contributing](./docs/contributing.md) - Contribution guidelines

## 📝 License

This project is licensed under the MIT License.
