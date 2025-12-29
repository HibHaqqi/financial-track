# Quick Clone Script for SSH Access

## Copy-Paste Commands ini ke Terminal SSH Anda

### 1. SSH ke Server

```bash
ssh haqqi@192.168.1.5
```

### 2. Cari Container PostgreSQL

```bash
docker ps
```

**Catat nama container PostgreSQL!** (misal: `postgres`, `financetrack-db`, dll)

---

### 3. Set Variables (Ganti sesuai hasil di atas)

```bash
# EDIT INI:
CONTAINER="postgres"        # Nama container dari step 2
SOURCE_DB="financetrack"    # Nama database existing (dari .env Windows)
DB_USER="postgres"          # Username PostgreSQL

# Jangan edit ini:
TARGET_DB="creditcard"
```

---

### 4. Jalankan Clone Commands

**Copy-paste satu per satu:**

```bash
# Check if target DB exists, if yes drop it
docker exec $CONTAINER psql -U $DB_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$TARGET_DB'" | grep -q 1 && \
docker exec $CONTAINER psql -U $DB_USER -d postgres -c "DROP DATABASE $TARGET_DB;"

# Create new database
docker exec $CONTAINER psql -U $DB_USER -d postgres -c "CREATE DATABASE $TARGET_DB WITH ENCODING 'UTF8';"

# Clone data (this may take a few seconds)
docker exec $CONTAINER sh -c "pg_dump -U $DB_USER -d $SOURCE_DB | psql -U $DB_USER -d $TARGET_DB"

# Verify
echo "Source DB users:"
docker exec $CONTAINER psql -U $DB_USER -d $SOURCE_DB -tAc "SELECT COUNT(*) FROM \"User\";"

echo "Target DB users:"
docker exec $CONTAINER psql -U $DB_USER -d $TARGET_DB -tAc "SELECT COUNT(*) FROM \"User\";"
```

Jika kedua angka sama, **CLONE BERHASIL!** ✅

---

### 5. List All Databases (Optional - untuk verify)

```bash
docker exec $CONTAINER psql -U $DB_USER -d postgres -c "\l"
```

Anda harus lihat database `creditcard` di list!

---

## Setelah Selesai di Server

### Kembali ke Windows, Update .env

Di file `.env` di Windows, ubah DATABASE_URL:

**BEFORE:**

```env
DATABASE_URL="postgresql://postgres:password@192.168.1.5:5432/financetrack?schema=public"
```

**AFTER:**

```env
DATABASE_URL="postgresql://postgres:password@192.168.1.5:5432/creditcard?schema=public"
```

_(Ganti `password` dengan password PostgreSQL yang benar)_

---

## Jalankan Migration di Windows

```bash
# Di Windows PowerShell/Terminal
cd c:\Users\USER\Documents\Code\Financetrack

# Generate Prisma Client
npx prisma generate

# Run migration (add CreditCard tables)
npx prisma migrate dev --name add-credit-cards-and-installments
```

---

## Restart Dev Server

```bash
# Stop: Ctrl+C
# Start:
npm run dev
```

---

## DONE! 🎉

Sekarang aplikasi akan:

- ✅ Menggunakan database `creditcard` yang sudah punya semua data lama
- ✅ Plus tabel `CreditCard` dan `Installment` yang baru
- ✅ Database `financetrack` tetap aman tidak tersentuh

---

## Rollback (Jika Ada Masalah)

Tinggal ubah .env kembali ke:

```env
DATABASE_URL="postgresql://...@192.168.1.5:5432/financetrack?schema=public"
```

Dan restart server!
