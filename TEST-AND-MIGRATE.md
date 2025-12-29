# Test Koneksi Database Baru & Apply Migration

## ⚠️ PENTING: Jalankan di Terminal yang Sama dengan `npm run dev`

Karena terminal saat ini ada execution policy issue, tolong jalankan command ini di terminal yang sama dimana Anda menjalankan `npm run dev`.

---

## Step 1: Stop Dev Server

Di terminal `npm run dev`, tekan:

```
Ctrl + C
```

---

## Step 2: Test Koneksi Database

```bash
npx prisma db pull
```

**Jika berhasil**: Anda akan lihat pesan "Introspecting based on datasource..."

**Jika gagal**: Ada masalah dengan connection string di .env

---

## Step 3: Generate Prisma Client

```bash
npx prisma generate
```

Ini akan generate Prisma Client dengan schema yang sudah include CreditCard dan Installment.

---

## Step 4: Apply Migration (Tambah Tabel Credit Card)

```bash
npx prisma migrate dev --name add-credit-cards-and-installments
```

**Yang akan terjadi:**

- ✅ Tabel `CreditCard` akan dibuat
- ✅ Tabel `Installment` akan dibuat
- ✅ Kolom `installmentId` ditambahkan ke tabel `Transaction` (OPTIONAL/nullable)
- ✅ Relasi ditambahkan ke `User` dan `Category`
- ✅ **SEMUA DATA EXISTING AMAN** - tidak ada yang dihapus

**Output yang diharapkan:**

```
Applying migration `add-credit-cards-and-installments`
The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20250129_xxxxxx_add-credit-cards-and-installments/
    └─ migration.sql

Your database is now in sync with your schema.
```

---

## Step 5: Verify Migration Berhasil

```bash
npx prisma studio
```

Browser akan terbuka dengan Prisma Studio. Anda harus lihat:

- ✅ Tabel `CreditCard` (kosong - belum ada data)
- ✅ Tabel `Installment` (kosong)
- ✅ Tabel `User`, `Transaction`, `Wallet`, `Category` (dengan data existing)

---

## Step 6: Restart Dev Server

```bash
npm run dev
```

---

## Step 7: Test UI Credit Card

1. Buka browser: `http://localhost:3000`
2. Login
3. Navigasi ke **Credit Cards** (dari menu atau `/credit-cards`)
4. Klik **"Add Card"**
5. Coba tambah kartu kredit:
   - Name: "BCA Platinum"
   - Total Limit: 50000000
   - Billing Date: 25

**Jika form terbuka dan bisa diisi** = Front-end ✅

---

## Troubleshooting

### Error: "P1001: Can't reach database server"

- Database server tidak bisa diakses
- Check: apakah 192.168.1.5:5432 bisa diakses?
- Coba ping: `ping 192.168.1.5`

### Error: "database xxx does not exist"

- Database name salah di .env
- Check DATABASE_URL di .env

### Error: "password authentication failed"

- Password salah di .env
- Update password di DATABASE_URL

### Migration Warning: "already exists"

- Migration sudah pernah dijalankan
- Aman untuk di-skip atau reset: `npx prisma migrate reset` (HATI-HATI: akan hapus data!)

---

## Verify Everything Works

Jalankan ini untuk test koneksi end-to-end:

```bash
npx prisma db seed
```

Atau cek langsung:

```bash
npx prisma studio
```

---

## Summary

Setelah semua step selesai:

✅ Database `creditcard` terhubung
✅ Tabel `CreditCard` & `Installment` ada
✅ Data existing masih utuh
✅ Front-end credit card features siap digunakan
✅ API endpoints siap untuk ditambahkan

---

**Silakan jalankan step-by-step dan beri tahu kalau ada error! 🚀**
