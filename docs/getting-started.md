# Getting Started with FinanceFlow

This guide will help you set up and run FinanceFlow on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn** or **pnpm**
- **PostgreSQL** (v12 or higher)
- **Git** (for cloning the repository)

## Installation Steps

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Financetrack
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/financeflow"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Optional: OpenAI API for AI categorization
OPENAI_API_KEY="your-openai-api-key"
```

**Generate NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

### 4. Set Up the Database

#### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE financeflow;

# Exit
\q
```

#### Run Migrations

```bash
npx prisma migrate dev
# or
npx prisma migrate deploy
```

#### Seed Database (Optional)

```bash
npm run seed
# or
npx prisma db seed
```

### 5. Start the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
Financetrack/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (BlurProvider, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and types
│   └── styles/           # Global styles
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seed file
├── public/               # Static assets
└── docs/                 # Documentation
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Run database migrations
- `npx prisma generate` - Generate Prisma Client

## First Time Setup

### 1. Create User Account

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Click "Sign Up"
3. Enter your email and password
4. Submit the form

### 2. Create Your First Wallet

1. Go to "Wallets" in the menu
2. Click "Add Wallet"
3. Enter wallet name (e.g., "Cash", "Bank Account")
4. Set initial balance
5. Click "Save"

### 3. Add Categories

1. Go to "Categories" in the menu
2. Click "Add Category"
3. Enter category name
4. Select an icon
5. Choose a color
6. Click "Save"

### 4. Add Your First Transaction

1. Click "Add Transaction" button
2. Select transaction type (Income/Expense)
3. Enter amount and description
4. Select category and wallet
5. Choose date
6. Click "Save"

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Ensure PostgreSQL is running:
   ```bash
   # Linux/Mac
   sudo service postgresql start

   # Windows
   # Start PostgreSQL service from Services
   ```

2. Verify your `DATABASE_URL` in `.env`

3. Check database exists:
   ```bash
   psql -U postgres -l
   ```

### Migration Errors

If migrations fail:

```bash
# Reset database (WARNING: This deletes all data)
npx prisma migrate reset

# Or create new migration
npx prisma migrate dev --name init
```

### Port Already in Use

If port 3000 is already in use:

```bash
# Kill process on port 3000
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Production Deployment

### Build the Application

```bash
npm run build
```

### Environment Variables for Production

Ensure these are set in your production environment:

- `DATABASE_URL` - Production database connection
- `NEXTAUTH_URL` - Your production domain
- `NEXTAUTH_SECRET` - Secure secret key

### Deploy Platforms

FinanceFlow can be deployed to:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Digital Ocean App Platform**
- **Self-hosted** with Node.js server

See [Deployment Guide](./deployment.md) for detailed instructions.

## Next Steps

- Read the [Features Guide](./features.md) to learn about all features
- Check [API Documentation](./api.md) for API endpoints
- Visit [Contributing Guide](./contributing.md) to contribute

## Support

If you encounter any issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing [GitHub Issues](../../issues)
3. Create a new issue with details

Happy tracking! 🚀
