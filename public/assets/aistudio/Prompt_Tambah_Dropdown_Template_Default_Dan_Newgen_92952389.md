Tambahkan fitur **Pemilih Template Desain (`Default` vs `New Gen`)** pada aplikasi **"Workshop Invoice System - CV PERKASA MANDIRI PUTRA"** untuk dokumen **Invoice** maupun **PKB (Perintah Kerja Bengkel)** dengan spesifikasi lengkap berikut:

---

### 1. DROPDOWN PEMILIH TEMPLATE DI TOP BAR (DI SEBELAH TOMBOL `Reset Form`)
1. **Posisi & Komponen UI:**
   - Pada Top Bar kanan atas (baik di halaman `Buat Invoice` maupun `Buat PKB`), tepat di **sebelah tombol `Reset Form`**, tambahkan komponen dropdown / select bertema rapi (dengan ikon `LayoutTemplate` dari `lucide-react`):
     - **Opsi 1:** `Default` (Template klasik asli CV Perkasa Mandiri Putra yang sudah berjalan saat ini — **jangan diubah sedikit pun**)
     - **Opsi 2:** `New Gen` (Template baru Minimalis Otomotif Elegan sesuai PDF referensi yang dilampirkan)
2. **State & Persistensi:**
   - Simpan pilihan state `templateStyle: "default" | "newgen"` di `localStorage` sehingga saat halaman di-refresh atau saat user berpindah antara menu `Buat Invoice` dan `Buat PKB`, pilihan template tetap tersimpan.
   - Saat `templateStyle` diubah antara `Default` dan `New Gen`, **Live Preview A4**, **Cetak Printer (`@media print`)**, dan **Download PDF (`jsPDF`)** pada Invoice maupun PKB langsung berubah mengikuti template yang dipilih.

---

### 2. SPESIFIKASI TEMPLATE `Default` (PERTAHANKAN 100% SEPERTI SEKARANG)
- Jika user memilih **`Default`**, gunakan 100% tampilan Live Preview A4 dan fungsi generator `jsPDF` yang sudah berjalan saat ini tanpa perubahan.

---

### 3. SPESIFIKASI VISUAL TEMPLATE `New Gen` (LIVE PREVIEW, PRINT, & NATIVE VECTOR `jsPDF`)
Jika user memilih **`New Gen`**, terapkan desain **Minimalis Otomotif Elegan (Hemat Tinta Hard Copy)** yang **100% identik dengan lampiran PDF `Mockup_Desain_Opsi2_Invoice_dan_PKB_PMP.pdf`** menggunakan palet warna Slate/Monokrom bersih (`--ink: #0f172a`, `--muted: #475569`, `--subtle: #64748b`, `--border: #cbd5e1`, `--border-strong: #1e293b`, `--tint: #f8fafc`):

#### A. Kop Surat Murni `New Gen` (Sama untuk Invoice & PKB):
- **Di Atas Garis Kop (`border-bottom: 2px solid #1e293b`):**
  - **Kiri (Logo & Identitas berdampingan secara horizontal):**
    - Logo `PMP_LOGO_BASE64` di sebelah kiri (lebar `~20mm`, tinggi `~10mm`).
    - Tepat di sebelah kanan logo:
      - Nama Bengkel (Bold `12pt`, `#0f172a`): `CV PERKASA MANDIRI PUTRA` (atau `CV. PERKASA MANDIRI PUTRA` pada PKB).
      - Alamat 2 baris rapi (`9pt`, `#475569`):
        `Jl. Balai Rakyat No. 101, RT 012/RW 001, Kel. Cakung Timur,`
        `Kec. Cakung, Kota Jakarta Timur, DKI Jakarta 13910`
  - **Kanan (Kontak Berikon & NPWP, rata kanan, bertumpuk 3 baris):**
    - Baris 1: `[Ikon Telepon]` `081314456911` (`9pt`, `#0f172a`)
    - Baris 2: `[Ikon Amplop Email]` `putramandiriperkasa97@gmail.com` (`9pt`, `#0f172a`)
    - Baris 3: `NPWP : 76.435.446.0-452.000` (`9pt`, `#475569`)
- **Baris Judul Dokumen (Tepat di Bawah Garis Kop Surat):**
  - **Kiri:** Judul besar tebal (`14pt`, Bold, `letter-spacing: 0.08em`, `#0f172a`): **`INVOICE`** (untuk Invoice) atau **`PERINTAH KERJA BENGKEL`** (untuk PKB).
  - **Kanan:** Badge kapsul ber-border halus (`background: #f8fafc`, `border: 1px solid #cbd5e1`, `border-radius: 4px`, `padding: 3px 10px`, Bold `9pt`): menampilkan **`[Kategori Pekerjaan]`** (contoh: `SERVICE BERKALA` atau `GENERAL REPAIR CAR` pada Invoice; dan `SERVICE` pada PKB).

#### B. Halaman `INVOICE` pada Template `New Gen`:
1. **2 Kartu Informasi (`KEPADA YTH` & `INFORMASI BENGKEL`):**
   - Dua kotak bersebelahan (`grid-template-columns: 1.25fr 1fr`, `gap: 14px`), masing-masing memiliki `border: 1px solid #cbd5e1`, `border-radius: 6px`, `padding: 10px 12px`.
   - Di dalam tiap kartu terdapat sub-header kecil (`9pt`, uppercase, `#64748b`) dengan garis bawah tipis (`1px solid #cbd5e1`): **`KEPADA YTH`** di kartu kiri dan **`INFORMASI BENGKEL`** (`Hal`, `No Inv`, `Tgl Inv`, serta `No. SPK` jika aktif) di kartu kanan.
2. **Strip Data Kendaraan (Kotak Abu-Abu Tipis):**
   - Satu kotak penuh (`background: #f8fafc`, `border: 1px solid #cbd5e1`, `border-radius: 6px`, `padding: 8px 12px`) berisi 4 kolom:
     - `NO. POLISI` (label kecil `#64748b` di atas, nilai tebal `#0f172a` di bawah)
     - `MODEL KENDARAAN`
     - `TAHUN`
     - `NOMOR SPO`
3. **Tabel `LIST JASA` & `LIST SPAREPART`:**
   - Judul seksi **`LIST JASA`** dan **`LIST SPAREPART`** memakai aksen garis vertikal tebal di sebelah kiri (`border-left: 3px solid #1e293b`, `padding-left: 8px`, Bold `10pt`).
   - Header tabel memiliki latar `#f8fafc` dengan garis atas & bawah tegas (`1.5px solid #1e293b`): `NO` | `JASA` (atau `PART`) | `HARGA SATUAN` | `QTY` | `JUMLAH`.
   - Setiap baris item memiliki garis bawah tipis (`1px solid #e2e8f0`). Format uang tetap `Rp` di kiri kolom dan angka rata kanan dengan pemisah koma.
   - Baris subtotal di kanan bawah tabel: **`Sub. Total (Jasa) : Rp ...`** dan **`Sub. Total (Sparepart) : Rp ...`** (atau `Sub. Total (Part) :` untuk OLXMobbi), diikuti baris PPN / PPh jika pajak diaktifkan.
4. **Bagian Bawah (`INFORMASI BANK`, Kotak `TOTAL`, dan Ruang Tanda Tangan Luas):**
   - Dibatasi garis horizontal tegas (`1.5px solid #1e293b`) di atas area footer.
   - **Kiri:** Kartu **`INFORMASI BANK`** (`background: #f8fafc`, `border: 1px solid #cbd5e1`, `border-radius: 6px`, `padding: 10px 14px`) berisi `BANK MANDIRI`, **`1270012686075`** (Bold `11pt`), `a.n CV. PERKASA MANDIRI PUTRA`, `JAKARTA`.
   - **Kanan Atas:** Kotak sorotan **`TOTAL`** (`border: 1.5px solid #1e293b`, `border-radius: 6px`, `background: #f8fafc`, `padding: 9px 14px`) menampilkan label `TOTAL` di kiri dan nominal `Rp [Grand Total]` tebal (`12pt`) di kanan.
   - **Kanan Bawah (Kolom Tanda Tangan Luas):**
     - `Jakarta, [Tanggal Invoice]`
     - **Ruang tanda tangan ekstra lega** (jarak vertikal `~28mm` / `84px` agar tanda tangan basah dan stempel muat leluasa).
     - Garis tipis tanda tangan (`border-top: 1px solid #cbd5e1`, lebar `~60mm`), di bawahnya tertulis **`[Nama Penandatangan]`** (Bold `10pt`) dan `[Jabatan Penandatangan]` (`9.5pt`, `#475569`, sembunyikan jika kosong).

#### C. Halaman `PKB` pada Template `New Gen`:
1. **Kop Surat & Baris Judul:** Menggunakan Kop Surat Murni `New Gen` yang sama, dengan judul kiri **`PERINTAH KERJA BENGKEL`** dan badge kanan **`SERVICE`**.
2. **Strip Informasi PKB (5 Kolom):**
   - Satu kotak penuh (`background: #f8fafc`, `border: 1px solid #cbd5e1`, `border-radius: 6px`, `padding: 8px 12px`) berisi 5 kolom: `NO PKB` | `NO POLISI` | `TYPE` | `TANGGAL` | `KM`.
3. **Tabel `RINCIAN JASA` & `RINCIAN PART`:**
   - Judul seksi **`RINCIAN JASA`** dan **`RINCIAN PART`** memakai aksen `border-left: 3px solid #1e293b`.
   - Header tabel (`background: #f8fafc`, garis atas & bawah `1.5px solid #1e293b`): `NO` | `JASA` (atau `PART`) | `QTY` | `HARGA SATUAN` | `BIAYA JASA`.
   - Subtotal: **`Sub. Total Jasa : Rp ...`** dan **`Sub. Total Part : Rp ...`**.
4. **Kotak `TOTAL` PKB (Tanpa Bank & Tanpa Tanda Tangan):**
   - Garis horizontal pembatas di bawah tabel part, diikuti kotak **`TOTAL`** (`border: 1.5px solid #1e293b`, `border-radius: 6px`, `background: #f8fafc`) di sisi kanan bawah.

---

### 4. DUKUNGAN NATIVE VECTOR `jsPDF` UNTUK TEMPLATE `New Gen`
- Pastikan saat `templateStyle === "newgen"`, tombol **`Download PDF Invoice`** dan **`Download PDF PKB`** menggambar seluruh elemen desain `New Gen` menggunakan fungsi vektor asli `jsPDF` (`doc.roundedRect()`, `doc.rect()`, `doc.line()`, `doc.text()`, `doc.setFillColor(248, 250, 252)`, `doc.setDrawColor(203, 213, 225)`, serta ikon telepon & email vektor di kop surat) sehingga hasil PDF `New Gen` tetap **100% tajam (vektor)** dan **seluruh teksnya bisa diblok & di-copy-paste**.
