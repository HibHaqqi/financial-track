Membuat dashboard keuangan personal yang mengelola kartu kredit (khususnya fitur cicilan) memerlukan logika database dan manajemen state yang cukup detail.

Berikut adalah **Code Plan** untuk implementasi sistem tersebut:

---

## 1. Arsitektur Data (Database Schema)

Ini adalah bagian paling krusial. Kita perlu memisahkan antara **Transaksi Tunggal** dan **Transaksi Cicilan**.

### Tabel Utama:

* **Accounts/Cards**: Menyimpan info kartu (Limit total, sisa limit, tanggal cetak tagihan/billing cycle).
* **Transactions**: Catatan semua arus kas.
* **Installments (Cicilan)**: Tabel khusus untuk memecah transaksi besar ke beberapa bulan.
* `total_amount`: Total harga barang.
* `tenor`: Durasi (misal 12 bulan).
* `monthly_payment`: Hasil bagi `total_amount / tenor`.
* `current_installment`: Cicilan ke-berapa saat ini.
* `start_date`: Kapan cicilan dimulai.


* **Budgets**: Limit bulanan per kategori.

---

## 2. Alur Logika (Workflow)

### A. Input Transaksi Cicilan

Saat user memasukkan transaksi kartu kredit dengan opsi "Cicilan":

1. **Potong Limit Kartu**: Kurangi `available_limit` pada tabel *Cards* sebesar **Total Harga** (karena limit kartu biasanya langsung terpotong penuh).
2. **Generate Jadwal**: Simpan data ke tabel `Installments`.
3. **Link ke Budget**: Masukkan `monthly_payment` ke dalam kalkulasi pengeluaran bulan berjalan.

### B. Sinkronisasi Limit Bulanan

Sistem harus mampu menghitung:
`Sisa Budget = (Limit Bulanan) - (Total Transaksi Non-Cicilan Bulan Ini) - (Total Cicilan Berjalan Bulan Ini)`

---

## 3. Struktur Kode (Pseudo-code)

### Logika Penghitungan Cicilan (Backend/Logic Layer)

```javascript
// Menghitung beban cicilan yang jatuh tempo pada bulan tertentu
function getMonthlyInstallmentBurden(userId, targetMonth, targetYear) {
    const activeInstallments = db.installments.find({
        userId: userId,
        status: 'active',
        startDate: { $lte: new Date(targetYear, targetMonth) }
    });

    return activeInstallments.reduce((sum, item) => {
        // Cek apakah cicilan masih berjalan di bulan tersebut
        const monthsDiff = getMonthsDifference(item.startDate, new Date(targetYear, targetMonth));
        if (monthsDiff < item.tenor) {
            return sum + item.monthlyPayment;
        }
        return sum;
    }, 0);
}

```

---

## 4. Rencana Implementasi UI (Dashboard)

* **Widget Card Limit**: Progress bar yang menunjukkan `Sisa Limit` vs `Total Limit`.
* **Installment Tracker**: List cicilan yang sedang aktif, lengkap dengan informasi "3/12 bulan" (artinya sudah masuk bulan ketiga dari 12).
* **Budget vs Reality**: Grafik yang menggabungkan pengeluaran harian + beban cicilan tetap bulan tersebut.

---

## 5. Fitur Tambahan (Advanced)

* **Reminder Billing Cycle**: Notifikasi 3 hari sebelum tanggal cetak tagihan kartu kredit.
* **Auto-Post**: Setiap awal bulan, sistem otomatis membuat entri "Expense" di dashboard berdasarkan data dari tabel `Installments`.
* **Debt-to-Income Ratio**: Kalkulasi otomatis apakah cicilan user sudah melebihi batas aman (misal >30% pendapatan).

---
