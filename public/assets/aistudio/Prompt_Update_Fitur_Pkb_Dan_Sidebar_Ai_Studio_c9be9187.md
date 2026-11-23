Lakukan pembaruan fitur pada aplikasi **"Workshop Invoice System - CV PERKASA MANDIRI PUTRA"** dengan rincian perubahan UI Sidebar, penambahan fitur utama **`Buat PKB` (Perintah Kerja Bengkel)** khusus GoFleet, serta sinkronisasi otomatis antara Invoice dan PKB berikut ini:

---

### 1. PEMBARUAN SIDEBAR NAVIGASI (HAPUS "PENGEMBANGAN" & TAMBAH FITUR BUKA-TUTUP / COLLAPSIBLE)
1. **Hapus Seksi `PENGEMBANGAN`:**
   - Hapus total teks header `PENGEMBANGAN` dan tombol placeholder `Menu Lainnya (Menyusul)` dari sidebar kiri.
2. **Tambahkan Menu `Buat PKB` di `MENU UTAMA`:**
   - Di bawah seksi `MENU UTAMA`, tampilkan 2 menu utama:
     1. **`Buat Invoice`** (Ikon `FileText`)
     2. **`Buat PKB`** (Ikon `ClipboardList` atau `Wrench`)
3. **Fitur Buka-Tutup Sidebar (Collapsible Sidebar):**
   - Tambahkan tombol toggle buka/tutup sidebar (`PanelLeftClose` / `PanelLeftOpen` atau `ChevronLeft` / `ChevronRight`) di bagian header sidebar dan/atau di sebelah kiri Top Bar.
   - **Saat Sidebar Terbuka (`isSidebarOpen = true`):** Lebar `~250px` (`w-64`), menampilkan logo/judul lengkap, label `MENU UTAMA`, teks menu `Buat Invoice` & `Buat PKB`, serta indikator `Preset Tujuan Aktif` di bagian bawah.
   - **Saat Sidebar Tertutup (`isSidebarOpen = false`):** Lebar menyempit (`w-16` / `~64px`) atau tersembunyi rapi dengan transisi halus (`transition-all duration-300`), hanya menampilkan ikon menu dengan tooltip dan tombol untuk membuka kembali sidebar, sehingga area kerja form & Live Preview A4 menjadi lebih luas.

---

### 2. SINKRONISASI OTOMATIS ANTARA `BUAT INVOICE` DAN `BUAT PKB` (TERHUBUNG OTOMATIS)
Karena `PKB` (Perintah Kerja Bengkel) **hanya digunakan untuk klien GoFleet (`SOLUSI MOBILITAS BANGSA`)** dan dibuat dari SPO yang sama dengan Invoice:
1. **State Terhubung & Sinkronisasi Otomatis:**
   - Saat user melakukan **Ekstrak SPO** (baik dari halaman `Buat Invoice` maupun `Buat PKB`), data hasil ekstraksi otomatis mengisi state **Invoice** sekaligus state **PKB**.
   - **Sinkronisasi Nomor (`No Inv` <-> `No PKB` <-> `No. SPK`):**
     - Jika user mengetik atau mengubah `No. Invoice` (contoh: `PMP20266909`), maka:
       - `No. SPK` pada Invoice otomatis menjadi `SPK/PMP/GR/6909` (`SPK/PMP/GR/[4 digit terakhir No Inv]`).
       - `No PKB` pada PKB otomatis terisi `PMP6909` (`PMP[4 digit terakhir No Inv]`), namun kolom `No PKB` tetap bisa diedit manual oleh user jika diperlukan.
   - **Sinkronisasi Item Jasa & Part:**
     - Tabel `Rincian Jasa` dan `Rincian Part` pada PKB otomatis mengambil item dari `jasaList` dan `sparepartList` hasil ekstraksi SPO (nama item tetap diambil **apa adanya sesuai teks tabel SPO** tanpa kode `MMD-xxxxx`, contoh: `JASA SERVICE KECIL`, `GASKET - CALYA/SIGRA`, `OLI WIN 10W-30`, `OIL FILTER CALYA SIGRA`), namun tetap bisa ditambah/diedit/dihapus di form PKB.
2. **Khusus GoFleet:**
   - Saat user membuka tab **`Buat PKB`**, pastikan indikator klien mengacu pada **GoFleet (`SOLUSI MOBILITAS BANGSA`)**. Jika sebelumnya user sedang memilih preset OLXMobbi di tab Invoice, tampilkan badge informasi bahwa dokumen PKB dikhususkan untuk unit GoFleet.

---

### 3. FORM INPUT & TOP BAR PADA HALAMAN `BUAT PKB`
Saat menu **`Buat PKB`** aktif:
1. **Top Bar Halaman `Buat PKB`:**
   - Judul halaman: **`Buat PKB (Perintah Kerja Bengkel)`**
   - Nama file target: **`PKB_[NoPKB]_[NoPolisiTanpaSpasi].pdf`** (Contoh: `PKB_PMP6909_B1550DOC.pdf`)
   - 4 Tombol Aksi di kanan atas:
     - **`Ekstrak SPO`** (Membuka modal ekstraksi SPO yang langsung mengisi PKB & Invoice)
     - **`Reset Form`**
     - **`Cetak Printer`**
     - **`Download PDF PKB`** (Tombol utama biru `bg-blue-600 hover:bg-blue-700`)
2. **Panel Kiri — Form Pengaturan & Input PKB (Tanpa nomor urut `01.`, `02.`):**
   - **Seksi `Informasi PKB & Kendaraan`:**
     - `No PKB` (Input teks, contoh: `PMP6909` — otomatis terisi `PMP` + 4 digit terakhir `No. Invoice`, tetap bisa diedit manual)
     - `Tanggal PKB` (Format `DD/MM/YYYY`, contoh: `04/11/2026` — dilengkapi pemilih kalender `<input type="date">` yang otomatis mengonversi ke `DD/MM/YYYY`)
     - `No Polisi` (Format dengan spasi, contoh: `B 1550 DOC` — otomatis diformat dengan spasi dari plat nomor SPO `B1550DOC` -> `B 1550 DOC`)
     - `Type / Model Kendaraan` (Hanya Merk + Tipe Utama, contoh: `DAIHATSU SIGRA`)
     - `KM` (Angka kilometer dari `KM Unit` pada SPO GoFleet, contoh: `220162`)
   - **Seksi `Tabel Rincian Jasa` & `Tabel Rincian Part`:**
     - Tombol `+ Tambah Jasa` dan `+ Tambah Part`.
     - Input per baris: `Nama Jasa / Part`, `Qty`, `Harga Satuan`, tampilan `Biaya Jasa` (`Qty * Harga Satuan`), dan tombol hapus baris.

---

### 4. ATURAN EKSTRAKSI SPO GOFLEET KE PKB
Saat mengekstrak file PDF/Gambar SPO GoFleet (seperti `PO-SMB-2611-008836 - SK. 220000 - B1550DOC.pdf`), pastikan parser menangkap field tambahan khusus PKB berikut:
1. **`Tanggal PKB` (`DD/MM/YYYY`):**
   - Di SPO GoFleet tertulis `Tanggal SPO : 11/04/2026` (format `MM/DD/YYYY` yaitu 4 November 2026) atau di footer tertulis `05/11/2026`.
   - Konversi `Tanggal SPO` (`MM/DD/YYYY`) menjadi format **`DD/MM/YYYY`** untuk field `Tanggal` pada PKB (contoh: `11/04/2026` -> **`04/11/2026`**).
2. **`No Polisi` Ber-spasi (`B 1550 DOC`):**
   - Dari `Keterangan Unit : B1550DOC / DAIHATSU/SIGRA/1.2 R MT/2023`, ambil `B1550DOC`:
     - Untuk **Invoice**: simpan tanpa spasi (`B1550DOC`) dan untuk nama file PDF (`PKB_PMP6909_B1550DOC.pdf`).
     - Untuk tampilan **PKB**: otomatis beri spasi antara kode wilayah, angka, dan seri huruf belakang menjadi **`B 1550 DOC`** (gunakan regex `^([A-Z]{1,2})\s*(\d{1,4})\s*([A-Z]{1,3})$` -> `$1 $2 $3`).
3. **`Type` (`DAIHATSU SIGRA`):**
   - Ambil Merk + Tipe utamanya saja (`DAIHATSU SIGRA`), buang varian `1.2 R MT`.
4. **`KM` (`220162`):**
   - Tangkap angka setelah `KM Unit :` pada SPO GoFleet (contoh: `KM Unit : 220162` -> **`220162`**) menggunakan regex `/KM\s*Unit\s*:\s*([0-9.,]+)/i` (bersihkan titik/koma jika ada sehingga menjadi `220162`).
5. **`Rincian Jasa` & `Rincian Part`:**
   - Ambil deskripsi item **apa adanya sesuai teks tabel SPO** tanpa kode `MMD-xxxxxx` (contoh: `JASA SERVICE KECIL` masuk ke `Rincian Jasa`; `GASKET - CALYA/SIGRA`, `OIL FILTER CALYA SIGRA`, `OLI WIN 10W-30` masuk ke `Rincian Part`).

---

### 5. SPESIFIKASI VISUAL KERTAS A4 & NATIVE VECTOR PDF (`jsPDF`) UNTUK PKB (100% PERSIS `PKB_PMP6909_B1550DOC.pdf`)
Pastikan **Live Preview A4**, **Cetak Printer**, dan **Download PDF PKB (`jsPDF`)** mengikuti **100% persis** tata letak, ejaan, posisi kolom, dan garis pada contoh **`PKB_PMP6909_B1550DOC.pdf`**:

1. **Kop Surat PKB (Berbeda dari Kop Invoice):**
   - **Kiri (Logo & Identitas berdampingan secara horizontal):**
     - Di sebelah kiri: Gambar **Logo Monogram `PMP`** (`PMP_LOGO_BASE64`) berukuran lebih besar (lebar `~34mm`, tinggi `~17mm`).
     - Tepat di sebelah kanan logo `PMP` (sejajar vertikal):
       - Baris 1: **`CV. PERKASA MANDIRI PUTRA`** (Bold, Kapital, dengan titik setelah `CV.`, ukuran ~11pt)
       - Baris 2: `Jl. Balai Raykat No. 101,` (Reguler, ~9pt)
       - Baris 3: `RT 012, RW 001, Cakung Timur, Cakung, Jakarta` (Reguler, ~9pt)
   - **Kanan Atas (Judul Dokumen, rata tengah pada blok kanan):**
     - Baris 1: **`Perintah Kerja Bengkel`** (Bold, ~10pt)
     - Baris 2: **`Service`** (Bold, ~10pt)
     - *(Tanpa Email, tanpa NPWP, dan tanpa teks INVOICE di tengah).*
   - **Garis Pembatas Kop:** Satu garis horizontal tegas melintang penuh dari batas kiri ke kanan tepat di bawah kop surat.

2. **Informasi PKB & Unit (2 Kolom di Bawah Garis Kop):**
   - **Kolom Kiri:**
     - `No PKB` : `: [No PKB]` (Contoh: `PMP6909`)
     - `No Polisi` : `: [No Polisi]` (Contoh: `B 1550 DOC`)
     - `Type` : `: [Type]` (Contoh: `DAIHATSU SIGRA`)
   - **Kolom Kanan:**
     - `Tanggal` : `: [Tanggal]` (Contoh: `04/11/2026`, nilai tanggal rata kanan di ujung kolom kanan)
     - `KM` : `: [KM]` (Contoh: `220162`, nilai angka KM rata kanan di ujung kolom kanan)

3. **Tabel `Rincian Jasa` (Perhatikan Garis & Urutan Kolom):**
   - Judul seksi **`Rincian Jasa`** (Bold, rata kiri) dengan **garis horizontal penuh tepat di bawah tulisan `Rincian Jasa`**.
   - **Header Kolom (Urutan Kolom PKB Berbeda dari Invoice — `Qty` di kiri `Harga Satuan`, dan kolom kanan bernama `Biaya Jasa`):**
     `No` (tengah) | `Jasa` (tengah di header, rata kiri di isi) | `Qty` (tengah) | `Harga Satuan` (tengah) | `Biaya Jasa` (tengah)
   - **Garis Horizontal:** Garis horizontal di bawah header kolom, dan garis horizontal di bawah baris item terakhir (TANPA garis vertikal).
   - **Format Angka (`Harga Satuan` & `Biaya Jasa`):** Simbol `Rp` di kiri kolom dan angka rata kanan dengan pemisah ribuan koma (contoh: `Rp          20,000`).
   - **Baris Subtotal Jasa:** Di bawah garis penutup tabel, tampilkan **`Sub. Total Jasa :`** (Bold, tanpa tanda kurung) diikuti `Rp` di kiri dan nominal rata kanan di bawah kolom `Biaya Jasa`.

4. **Tabel `Rincian Part` & `Total`:**
   - Judul seksi **`Rincian Part`** (Bold, rata kiri) dengan **garis horizontal penuh tepat di bawah tulisan `Rincian Part`**.
   - **Header Kolom (Kolom paling kanan tetap bernama `Biaya Jasa` persis contoh PKB asli):**
     `No` (tengah) | `Part` (tengah di header, rata kiri di isi) | `Qty` (tengah) | `Harga Satuan` (tengah) | `Biaya Jasa` (tengah)
   - **Garis Horizontal:** Garis horizontal di bawah header kolom, dan garis horizontal di bawah baris item terakhir (TANPA garis vertikal).
   - **Baris Subtotal Part:** Di bawah garis penutup tabel, tampilkan **`Sub. Total Part :`** (Bold, tanpa tanda kurung) diikuti `Rp` di kiri dan nominal rata kanan.
   - **Baris `Total :`:** Beri jarak vertikal (~10mm), lalu buat **1 garis horizontal penuh di atas baris `Total :`** (tanpa garis di bawahnya, persis `PKB_PMP6909_B1550DOC.pdf`), dan tampilkan **`Total :`** (Bold) diikuti `Rp` di kiri dan nominal grand total rata kanan (`Rp         290,000`).

5. **Tanpa Footer Bank & Tanpa Tanda Tangan:**
   - Pada dokumen PKB, **JANGAN** tampilkan Informasi Bank Mandiri dan **JANGAN** tampilkan blok tanda tangan di bagian bawah kertas (area bawah dibiarkan bersih persis contoh `PKB_PMP6909_B1550DOC.pdf`).

6. **Generator PDF Vektor `jsPDF` untuk PKB (`Download PDF PKB`):**
   - Buat fungsi `generatePkbPdf()` tersendiri menggunakan native vector `jsPDF` (`doc.addImage(PMP_LOGO_BASE64, "PNG", 18, 14, 34, 17)`, `doc.text()`, `doc.line()`) sehingga hasil unduhan `PKB_[NoPKB]_[NoPolisi].pdf` 100% tajam (vektor), teksnya bisa di-copy-paste, dan identik 100% dengan `PKB_PMP6909_B1550DOC.pdf`.
