# Clone PostgreSQL Database di Docker (192.168.1.5)

## Opsi 1: Menggunakan Script Bash (Paling Mudah)

### Di Ubuntu Server (192.168.1.5):

1. **SSH ke server:**

   ```bash
   ssh user@192.168.1.5
   ```

2. **Upload script atau buat file baru:**
   ```bash
   nano clone-db.sh
   ```
3. **Copy isi dari `scripts/clone-database-docker.sh` ke file tersebut**

4. **Edit konfigurasi di script:**

   - `DOCKER_CONTAINER`: nama container PostgreSQL
   - `SOURCE_DB`: nama database saat ini (cek dari .env)
   - `DB_USER`: biasanya `postgres`

5. **Jalankan script:**
   ```bash
   chmod +x clone-db.sh
   ./clone-db.sh
   ```

---

## Opsi 2: Manual Commands Step by Step

### A. Cari Nama Container PostgreSQL

```bash
# SSH ke server dulu
ssh user@192.168.1.5

# List container yang running
docker ps

# Atau cari yang ada postgres
docker ps | grep postgres
```

Output akan seperti:

```
CONTAINER ID   IMAGE         NAMES
abc123...      postgres:15   my-postgres
```

**Catat nama container-nya!** (contoh: `my-postgres`)

---

### B. Clone Database

**Ganti variabel berikut:**

- `CONTAINER_NAME`: nama container dari langkah A
- `SOURCE_DB`: nama database existing (dari .env, misal: `financetrack`)
- `DB_USER`: username PostgreSQL (biasanya `postgres`)

```bash
# 1. Masuk ke container
docker exec -it CONTAINER_NAME bash

# 2. Di dalam container, buat database baru
psql -U postgres -d postgres -c "CREATE DATABASE creditcard WITH ENCODING 'UTF8';"

# 3. Clone data
pg_dump -U postgres -d SOURCE_DB > /tmp/backup.sql
psql -U postgres -d creditcard < /tmp/backup.sql

# 4. Cleanup
rm /tmp/backup.sql

# 5. Keluar dari container
exit
```

**Contoh lengkap:**

```bash
# Jika container bernama 'postgres' dan database 'financetrack'
docker exec -it postgres bash
psql -U postgres -d postgres -c "CREATE DATABASE creditcard WITH ENCODING 'UTF8';"
pg_dump -U postgres -d financetrack > /tmp/backup.sql
psql -U postgres -d creditcard < /tmp/backup.sql
rm /tmp/backup.sql
exit
```

---

### C. Verifikasi Clone Berhasil

```bash
# Cek database yang ada
docker exec CONTAINER_NAME psql -U postgres -d postgres -c "\l"

# Cek jumlah data di database baru
docker exec CONTAINER_NAME psql -U postgres -d creditcard -c "SELECT COUNT(*) FROM \"User\";"
```

---

## Opsi 3: One-Liner Commands dari Ubuntu Server

Jika sudah tahu nama container dan database:

```bash
# Ganti: my-postgres, financetrack sesuai dengan milik Anda
CONTAINER=my-postgres
SOURCE=financetrack

# Create database
docker exec $CONTAINER psql -U postgres -d postgres -c "CREATE DATABASE creditcard WITH ENCODING 'UTF8';"

# Clone data (one command)
docker exec $CONTAINER sh -c "pg_dump -U postgres -d $SOURCE | psql -U postgres -d creditcard"
```

---

## Setelah Clone Selesai

### Di Windows (PC Development Anda):

1. **Update file .env:**

   ```env
   # Ganti dengan kredensial yang sesuai
   DATABASE_URL="postgresql://postgres:YourPassword@192.168.1.5:5432/creditcard?schema=public"
   ```

2. **Generate Prisma Client:**

   ```bash
   npx prisma generate
   ```

3. **Run migration untuk add credit card tables:**

   ```bash
   npx prisma migrate dev --name add-credit-cards-and-installments
   ```

4. **Restart dev server:**
   ```bash
   # Stop current (Ctrl+C)
   npm run dev
   ```

---

## Troubleshooting Docker

### Jika tidak tahu nama database saat ini:

```bash
# List semua database di container
docker exec CONTAINER_NAME psql -U postgres -d postgres -c "\l"
```

### Jika tidak tahu username PostgreSQL:

Biasanya `postgres`, tapi bisa dicek di .env file Windows Anda.

### Jika port PostgreSQL tidak di-expose:

Akses harus dari dalam server menggunakan Docker exec (sudah dijelaskan di atas).

---

## Info yang Saya Butuhkan untuk Membantu Lebih Lanjut:

Dari komputer Windows Anda, bisa kasih info:

1. **Nama container Docker** (dari `docker ps` di server)
2. **Isi DATABASE_URL** dari file .env (tanpa password kalau private)
   - Format: `postgresql://USER:***@192.168.1.5:PORT/DBNAME?schema=public`

Dengan info ini saya bisa buatkan command yang lebih spesifik!
