# Restore Database Dump ke Database Baru "creditcard"

## File Dump: 27122025_financialtrack_backup.dump

---

## Skenario 1: File Dump Ada di Server Ubuntu (192.168.1.5)

### Langkah-langkah:

#### 1. SSH ke Server

```bash
ssh haqqi@192.168.1.5
```

#### 2. Cari Lokasi File Dump

```bash
# Cari file dump
find ~ -name "27122025_financialtrack_backup.dump" 2>/dev/null

# Atau jika tahu lokasinya, langsung ke sana
cd /path/to/backup/folder
ls -lh 27122025_financialtrack_backup.dump
```

#### 3. Cari Nama Container PostgreSQL

```bash
docker ps
```

**Catat nama container** (misal: `postgres`, `financetrack-db`, dll)

#### 4. Create Database Baru "creditcard"

```bash
# Set variables (EDIT sesuai container Anda)
CONTAINER="postgres"        # Nama container dari step 3
DB_USER="postgres"          # Username PostgreSQL

# Create database
docker exec $CONTAINER psql -U $DB_USER -d postgres -c "CREATE DATABASE creditcard WITH ENCODING 'UTF8';"
```

#### 5. Restore Dump ke Database Baru

**Jika file .dump (custom format):**

```bash
# Copy file ke dalam container
docker cp 27122025_financialtrack_backup.dump $CONTAINER:/tmp/backup.dump

# Restore menggunakan pg_restore
docker exec $CONTAINER pg_restore -U $DB_USER -d creditcard -v /tmp/backup.dump

# Cleanup
docker exec $CONTAINER rm /tmp/backup.dump
```

**Jika file .sql (plain text format):**

```bash
# Copy ke container
docker cp 27122025_financialtrack_backup.dump $CONTAINER:/tmp/backup.sql

# Restore menggunakan psql
docker exec $CONTAINER psql -U $DB_USER -d creditcard -f /tmp/backup.sql

# Cleanup
docker exec $CONTAINER rm /tmp/backup.sql
```

#### 6. Verify

```bash
# Cek database ada
docker exec $CONTAINER psql -U $DB_USER -d postgres -c "\l" | grep creditcard

# Cek isi data
docker exec $CONTAINER psql -U $DB_USER -d creditcard -c "SELECT COUNT(*) FROM \"User\";"
docker exec $CONTAINER psql -U $DB_USER -d creditcard -c "SELECT COUNT(*) FROM \"Transaction\";"
```

---

## Skenario 2: File Dump Ada di Windows

### Langkah-langkah:

#### 1. Upload File ke Server via SCP

```powershell
# Di Windows PowerShell
scp C:\path\to\27122025_financialtrack_backup.dump haqqi@192.168.1.5:~/
```

**Contoh:**

```powershell
# Jika file ada di Downloads
scp C:\Users\USER\Downloads\27122025_financialtrack_backup.dump haqqi@192.168.1.5:~/
```

#### 2. SSH ke Server

```bash
ssh haqqi@192.168.1.5
```

#### 3. Lanjut seperti Skenario 1 dari Step 3

---

## ONE-LINER untuk Server (Copy-Paste Friendly)

**Jika file dump sudah ada di server dan container bernama `postgres`:**

```bash
# Set variables
CONTAINER="postgres"
DB_USER="postgres"
DUMP_FILE="/path/to/27122025_financialtrack_backup.dump"

# Create DB, restore, verify
docker exec $CONTAINER psql -U $DB_USER -d postgres -c "CREATE DATABASE creditcard WITH ENCODING 'UTF8';" && \
docker cp $DUMP_FILE $CONTAINER:/tmp/backup.dump && \
docker exec $CONTAINER pg_restore -U $DB_USER -d creditcard -v /tmp/backup.dump && \
docker exec $CONTAINER rm /tmp/backup.dump && \
echo "Verification:" && \
docker exec $CONTAINER psql -U $DB_USER -d creditcard -c "SELECT COUNT(*) FROM \"User\";"
```

---

## Setelah Database Restore Berhasil

### Di Windows - Update .env

Edit file `.env`:

**BEFORE:**

```env
DATABASE_URL="postgresql://postgres:password@192.168.1.5:5432/financetrack?schema=public"
```

**AFTER:**

```env
DATABASE_URL="postgresql://postgres:YourPassword@192.168.1.5:5432/creditcard?schema=public"
```

### Generate Prisma Client & Run Migration

```bash
cd c:\Users\USER\Documents\Code\Financetrack

# Generate client
npx prisma generate

# Apply credit card migration
npx prisma migrate dev --name add-credit-cards-and-installments
```

### Restart Dev Server

```bash
# Stop: Ctrl+C in the terminal where npm run dev is running
# Start again:
npm run dev
```

---

## Troubleshooting

### Error: "role does not exist"

Tambahkan flag `-O` dan `-x`:

```bash
docker exec $CONTAINER pg_restore -U $DB_USER -d creditcard -O -x -v /tmp/backup.dump
```

### Error: "already exists"

Database sudah ada, drop dulu:

```bash
docker exec $CONTAINER psql -U $DB_USER -d postgres -c "DROP DATABASE creditcard;"
```

Lalu create lagi.

### Cek Format File Dump

```bash
# Cek apakah custom format atau SQL
file 27122025_financialtrack_backup.dump

# Jika output: "PostgreSQL custom database dump"
# -> Gunakan pg_restore

# Jika output: "ASCII text" atau "SQL script"
# -> Gunakan psql
```

---

## Info yang Dibutuhkan

Tolong konfirmasi:

1. **Lokasi file dump**: Di Windows atau di server Ubuntu?
2. **Path lengkap**: Di mana file tersebut berada?
3. **Nama container PostgreSQL**: Dari `docker ps` di server

Dengan info ini saya bisa kasih command yang lebih spesifik! 🚀
