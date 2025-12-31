# Apply Credit Card Migration ke Database

## ✅ Prisma Client sudah di-generate!

Sekarang kita perlu apply migration untuk menambahkan tabel CreditCard dan Installment.

---

## Opsi 1: Jalankan di Terminal dengan Input Interaktif

Buka **Command Prompt** atau **Git Bash** (bukan PowerShell), lalu jalankan:

```bash
cd c:\Users\USER\Documents\Code\Financetrack
npx prisma migrate dev --name add-credit-cards-and-installments
```

Tekan **Enter** untuk confirm setiap prompt.

---

## Opsi 2: Apply SQL Migration Manual via SSH

### Di Windows:

```bash
ssh haqqi@192.168.1.5
```

### Di Server Ubuntu:

```bash
# Set variables (EDIT sesuai container Anda)
CONTAINER="postgres"  # Atau nama container PostgreSQL Anda
DB_USER="postgres"
DB_NAME="creditcard"

# Apply migration
docker exec -i $CONTAINER psql -U $DB_USER -d $DB_NAME << 'EOF'
-- CreateTable CreditCard
CREATE TABLE "CreditCard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalLimit" DOUBLE PRECISION NOT NULL,
    "usedLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "billingDate" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CreditCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable Installment
CREATE TABLE "Installment" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "monthlyPayment" DOUBLE PRECISION NOT NULL,
    "tenor" INTEGER NOT NULL,
    "currentInstallment" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3) NOT NULL,
    "creditCardId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);

-- AlterTable Transaction
ALTER TABLE "Transaction" ADD COLUMN "installmentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_installmentId_key" ON "Transaction"("installmentId");

-- AddForeignKey
ALTER TABLE "CreditCard" ADD CONSTRAINT "CreditCard_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Installment" ADD CONSTRAINT "Installment_creditCardId_fkey"
    FOREIGN KEY ("creditCardId") REFERENCES "CreditCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Installment" ADD CONSTRAINT "Installment_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_installmentId_fkey"
    FOREIGN KEY ("installmentId") REFERENCES "Installment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EOF
```

### Verify Migration

```bash
# Check tables exist
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c "\dt"

# Should show: CreditCard, Installment tables
```

---

## Opsi 3: Copy File SQL dan Execute

### 1. Copy file ke server:

```bash
scp add-credit-card-tables.sql haqqi@192.168.1.5:~/
```

### 2. SSH ke server:

```bash
ssh haqqi@192.168.1.5
```

### 3. Execute SQL:

```bash
CONTAINER="postgres"  # Edit sesuai container Anda
DB_USER="postgres"
DB_NAME="creditcard"

docker cp ~/add-credit-card-tables.sql $CONTAINER:/tmp/migration.sql
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -f /tmp/migration.sql
docker exec $CONTAINER rm /tmp/migration.sql
```

---

## Verify Migration Berhasil

Jalankan di Windows:

```bash
node ./node_modules/prisma/build/index.js db pull
```

Atau cek langsung di database via SSH:

```bash
ssh haqqi@192.168.1.5 "docker exec postgres psql -U postgres -d creditcard -c '\dt'"
```

**Output yang diharapkan:**

```
                List of relations
 Schema |     Name      | Type  |  Owner
--------+---------------+-------+----------
 public | Category      | table | postgres
 public | CreditCard    | table | postgres  ← NEW!
 public | Installment   | table | postgres  ← NEW!
 public | Transaction   | table | postgres
 public | User          | table | postgres
 public | Wallet        | table | postgres
```

---

## Start Dev Server & Test

```bash
npm run dev
```

Buka browser: `http://localhost:3000/credit-cards`

**Anda harus bisa:**

- ✅ Lihat halaman Credit Cards
- ✅ Klik tombol "Add Card"
- ✅ Form terbuka (walau backend API belum ada, UI sudah jalan)

---

## Troubleshooting

### Error: "relation CreditCard already exists"

Migration sudah pernah dijalankan. Skip atau check dengan:

```bash
ssh haqqi@192.168.1.5 "docker exec postgres psql -U postgres -d creditcard -c '\dt'"
```

### Error: "column installmentId already exists"

Sama, migration sudah applied. Safe to ignore.

---

**Pilih salah satu opsi di atas yang paling mudah untuk Anda!** 🚀

Setelah selesai, beri tahu hasilnya!
