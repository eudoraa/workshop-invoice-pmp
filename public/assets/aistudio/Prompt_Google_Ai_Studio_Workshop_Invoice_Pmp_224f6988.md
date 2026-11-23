Buatkan aplikasi web lengkap **"Workshop Invoice System - CV PERKASA MANDIRI PUTRA"** menggunakan React, TypeScript, Tailwind CSS, Lucide Icons, `jspdf` (untuk pembuatan PDF Vektor asli yang tajam & teksnya bisa di-copy-paste), dan `pdfjs-dist` (untuk membaca teks file PDF SPO/PO secara instan).

Pastikan seluruh fitur di bawah ini berjalan 100% lancar, tanpa data dummy/contoh yang mengunci sistem, mengikuti 100% presisi dokumen asli CV PERKASA MANDIRI PUTRA serta struktur SPO GoFleet dan OLXMobbi yang dilampirkan, dan siap di-deploy ke Vercel maupun Cloud Run.

---

### 1. ARSITEKTUR LAYOUT (2 KOLOM) & TEMA WARNA BIRU-PUTIH
- **Tema Warna:** Gunakan palet **Biru & Putih Profesional** (`bg-slate-50` untuk latar belakang kerja, `bg-white` untuk kartu panel, `bg-blue-900` untuk sidebar kiri, dan `bg-blue-600 hover:bg-blue-700` untuk tombol utama).
- **Layout 2 Kolom Utama:**
  1. **Kolom Kiri (Sidebar Navigasi Tetap - Lebar ~250px):**
     - Header Sidebar: Ikon bengkel + judul **`CV PERKASA MANDIRI PUTRA`** dan sub-judul `Workshop Invoice System`.
     - Seksi `MENU UTAMA`: Menu aktif **`Buat Invoice`**.
     - Seksi `PENGEMBANGAN`: Menu placeholder non-aktif **`Menu Lainnya (Menyusul)`**.
     - Bagian bawah sidebar: Indikator kecil **`Preset Tujuan Aktif`** (menampilkan nama klien yang sedang dipilih).
  2. **Kolom Kanan (Area Kerja Utama):**
     - **Top Bar:** Menampilkan judul halaman **`Buat Invoice`**, nama file target (`Invoice_[NoInv]_[NoPolisi].pdf`), dan 4 tombol aksi di kanan atas:
       - **`Ekstrak SPO`**
       - **`Reset Form`**
       - **`Cetak Printer`**
       - **`Download PDF Invoice`** (Tombol utama biru)
     - **Workspace (Grid 2 Panel):**
       - **Panel Kiri:** Form Pengaturan & Input Invoice (Auto-save ke `localStorage`).
       - **Panel Kanan:** Live Preview Kertas A4 yang identik 100% dengan hasil cetak dan PDF.
- **Aturan Bersih UI:**
  - **JANGAN** gunakan angka urut (`01.`, `02.`, `03.`) pada judul seksi form. Langsung tulis judulnya: `Penomoran & Informasi Bengkel`, `Data Kendaraan & SPO`, `Informasi Klien (Kepada Yth)`, `Tabel List Jasa`, `Tabel List Sparepart`, `Pengaturan Pajak & Penandatangan`.
  - **JANGAN** tampilkan tombol `"Data Contoh"` di form utama, dan **JANGAN** tampilkan kata `"Contoh"` di dalam modal Ekstrak SPO.

---

### 2. DUA PRESET KLIEN TETAP ("KEPADA YTH") & LOGIKA OTOMATIS `No. SPK`
Pada seksi **`Informasi Klien (Kepada Yth)`**, **hapus** fitur tambah/simpan klien dan **hapus** kolom input manual nama/alamat klien. Alamat klien dikunci mengikuti preset (mengabaikan alamat cabang/depo pada SPO). Cukup tampilkan **2 Tombol Kartu Preset Klien** berikut:

#### A. Preset Klien 1: `SOLUSI MOBILITAS BANGSA` (GoFleet)
Saat dipilih, otomatis atur state berikut:
- **Nama Klien:** `SOLUSI MOBILITAS BANGSA`
- **Alamat Baris 1:** `GEDUNG PASARAYA BLOK M GEDUNG B LT. 4, JL. INSKANDARSYAH II`
- **Alamat Baris 2:** `NO. 02 RT 02 RW 01, MELAWAI KEBAYORAN BARU`
- **Kategori Pekerjaan:** `SERVICE BERKALA`
- **Sertakan No. SPK:** Otomatis **`true` (Aktif / Tampil di Form & Kertas A4)**
- **Pola Otomatis `No. SPK`:** Setiap kali `No. Invoice` diisi atau diubah (misal `PMP20266922`), otomatis perbarui `No. SPK` dengan pola **`SPK/PMP/GR/[4 digit terakhir No. Invoice]`** (contoh: `SPK/PMP/GR/6922`), kecuali jika user mengedit kolom `No. SPK` secara manual.
- **Label Subtotal Sparepart:** `Sub. Total (Sparepart)`
- **Nama Penandatangan:** `Jesica Prameswari`
- **Jabatan Penandatangan:** `(Kepala Administrasi)`

#### B. Preset Klien 2: `PT. SERASI MITRA MOBIL - OLXMOBBI` (OLX)
Saat dipilih, otomatis atur state berikut:
- **Nama Klien:** `PT. SERASI MITRA MOBIL - OLXMOBBI`
- **Alamat Baris 1:** `JL. TB SIMATUPANG NO. 25`
- **Alamat Baris 2:** `CILANDAK BARAT, JAKARTA SELATAN`
- **Kategori Pekerjaan:** `GENERAL REPAIR CAR`
- **Sertakan No. SPK:** Otomatis **`false` (Disembunyikan dari Kertas A4 & PDF, sehingga bagian Informasi Bengkel hanya menampilkan `Hal`, `No Inv`, dan `Tgl Inv`)**
- **Label Subtotal Sparepart:** `Sub. Total (Part)`
- **Nama Penandatangan:** `(Adi Bram Suryana)`
- **Jabatan Penandatangan:** `""` (Kosong / tidak menampilkan baris jabatan di bawah nama)

*(Catatan: Sediakan juga checkbox `"Sertakan No. SPK"` di seksi Penomoran yang otomatis berubah mengikuti preset di atas, namun tetap bisa dicentang/dilepas manual oleh user).*

---

### 3. FORM INPUT & KALKULASI OTOMATIS
1. **Penomoran & Informasi Bengkel:**
   - `No. Invoice` (Input teks manual, contoh: `PMP20266922` atau `SJM202602446`). Saat user mengetik `No. Invoice` dan `Sertakan No. SPK` aktif, otomatis sinkronkan `No. SPK` menjadi `SPK/PMP/GR/[4 digit terakhir No. Invoice]`.
   - `No. SPK` (Input teks manual + checkbox `Sertakan No. SPK`, contoh: `SPK/PMP/GR/6922`).
   - `Tanggal Invoice` (Input teks format Indonesia contoh `10 November 2026` berdampingan dengan pemilih kalender `<input type="date">` yang otomatis mengonversi tanggal ke format bahasa Indonesia).
   - `Kategori Pekerjaan` (Input teks manual, otomatis terisi `SERVICE BERKALA` atau `GENERAL REPAIR CAR` sesuai preset klien).
   - `Hal` (Input teks manual, default `1`).
2. **Data Kendaraan & SPO:**
   - `No. Polisi` (Contoh: `B1071DOJ` atau `B1640DFM`)
   - `Model Kendaraan` (Hanya Merk + Tipe Utama, contoh: `DAIHATSU SIGRA` atau `MG ZS`)
   - `Tahun` (Contoh: `2023` atau dikosongkan jika tidak ada di SPO agar bisa diisi manual)
   - `Nomor SPO` (Contoh: `PO-SMB-2611-009173` atau `PO/B2C27/26/10/000002`)
3. **Tabel List Jasa & Tabel List Sparepart:**
   - Tombol `+ Tambah Jasa` dan `+ Tambah Sparepart`.
   - Setiap baris memiliki input: `Nama Jasa / Part`, `Harga Satuan` (angka bulat), `Qty` (angka bulat), tampilan `Jumlah` (`Harga Satuan * Qty`), dan tombol hapus baris.
4. **Opsi Toggle Pajak (PPN & PPh):**
   - Secara default **OFF** (`Total = Sub. Total Jasa + Sub. Total Sparepart`).
   - Jika toggle **PPN** (default 11%) atau **PPh 23** (default 2%) diaktifkan, tampilkan baris perhitungannya di atas `Total`.

---

### 4. SPESIFIKASI VISUAL KERTAS INVOICE A4 (100% PERSIS CONTOH INVOICE ASLI)
Desain dokumen A4 (Live Preview, Cetak Printer, dan PDF Vektor) harus **100% identik dengan contoh invoice PDF CV PERKASA MANDIRI PUTRA** (`padding: 15mm 18mm`, font sans-serif bersih seperti Arial/Helvetica/Calibri untuk isi dokumen, dan **TANPA garis vertikal sama sekali** pada seluruh tabel):

1. **Kop Surat (Header):**
   - **Logo Monogram `PMP` (Kiri Atas):** Komponen SVG / tipografi Serif hitam tebal (`Times New Roman` / `Georgia`) untuk ligatur **`PMP`** di mana huruf **`P` kiri dicerminkan horizontal (`scaleX(-1)`)** menghadap ke kiri dan tiang vertikalnya menyatu dengan kaki kiri huruf **`M`**, sementara huruf **`P` kanan** menghadap normal ke kanan dan tiang vertikalnya menyatu dengan kaki kanan huruf **`M`**.
   - **Identitas Bengkel (Kiri, tepat di bawah logo `PMP`, ukuran font kecil ~9pt, rata kiri):**
     - `CV PERKASA MANDIRI PUTRA`
     - `JL. BALAI RAKYAT NO. 101, RT 012 RW 001 KEL. CAKUNG TIMUR,`
     - `KEC. CAKUNG, KOTA JAKARTA TIMUR, DKI JAKARTA - 13910`
     - `Telp 081314456911`
   - **Info Kontak & Kategori (Kanan Atas, sejajar area kop, rata kiri pada blok kanan):**
     - Baris 1: `[Kategori Pekerjaan]` (Huruf Kapital, ukuran ~11pt, contoh: `SERVICE BERKALA` atau `GENERAL REPAIR CAR`)
     - Baris 2: `Email : putramandiriperkasa97@gmail.com`
     - Baris 3: `NPWP : 76.435.446.0-452.000`
   - **Judul Tengah & Garis Kop:** Teks **`INVOICE`** (Bold, Kapital, ukuran ~12pt) tepat di tengah atas, diikuti **garis horizontal penuh** di bawahnya yang membatasi kop surat.
2. **Informasi Klien & Informasi Bengkel (2 Kolom di Bawah Garis Kop):**
   - **Kiri (`Kepada Yth`):**
     - Label `Kepada Yth` diikuti 1 baris spasi kosong, lalu:
     - `[Nama Klien]`
     - `[Alamat Baris 1]`
     - `[Alamat Baris 2]`
   - **Kanan (`Informasi Bengkel`):**
     - Label `Informasi Bengkel` diikuti 1 baris spasi kosong, lalu:
     - `Hal` : `: [Hal]`
     - `No Inv` : `: [No. Invoice]`
     - `Tgl Inv` : `: [Tanggal Invoice]`
     - `No. SPK` : `: [No. SPK]` *(Sembunyikan baris ini jika `Sertakan No. SPK` tidak dicentang / OFF)*.
3. **Tabel Data Kendaraan (1 Baris, Hanya Garis Horizontal Atas & Bawah):**
   - Diapit oleh garis horizontal di atas header dan garis horizontal di bawah baris isi (tanpa garis tengah dan tanpa garis vertikal):
   - 4 Kolom rata kiri: `NO. POLISI` (Bold) | `MODEL` (Bold) | `TAHUN` (Bold) | `NOMOR SPO` (Bold), dengan nilai data tepat di baris bawahnya.
4. **Tabel `LIST JASA` dan `LIST SPAREPART` (Hanya Garis Horizontal):**
   - Judul seksi **`LIST JASA`** (Bold, rata kiri).
   - Header kolom: `No` (tengah) | `Jasa` (tengah di header, rata kiri di isi) | `HARGA SATUAN` (tengah) | `QTY` (tengah) | `JUMLAH` (tengah).
   - **Garis Horizontal Tabel:** Hanya ada garis horizontal tepat di **bawah header kolom** dan garis horizontal di **bawah baris item terakhir** (TIDAK ADA garis di atas header `No | Jasa...` dan TIDAK ADA garis vertikal).
   - **Format Mata Uang (`HARGA SATUAN` & `JUMLAH`):** Simbol `Rp` rata kiri di dalam kolomnya, dan nominal angka rata kanan dengan pemisah ribuan **koma** (contoh: `Rp          100,000`).
   - **Baris Subtotal Jasa:** Di bawah garis penutup `LIST JASA`, tampilkan `Sub. Total (Jasa)` di tengah-kanan, tanda `:`, lalu `Rp` di kiri dan nominal rata kanan di bawah kolom `JUMLAH`.
   - Judul seksi **`LIST SPAREPART`** (Bold, rata kiri) dengan struktur kolom dan garis yang sama (`No` | `Part` | `HARGA SATUAN` | `QTY` | `JUMLAH`).
   - **Baris Subtotal Sparepart & Total Akhir:**
     - Di bawah garis penutup `LIST SPAREPART`, tampilkan `Sub. Total (Sparepart)` (atau `Sub. Total (Part)` jika OLXMOBBI) `: Rp [Nominal]`.
     - Di bawahnya (jika pajak aktif), tampilkan baris PPN / PPh.
     - Di bawahnya, tampilkan baris **`Total`** `: Rp [Grand Total]` yang **diapit oleh garis horizontal penuh di atas baris `Total` dan garis horizontal penuh di bawah baris `Total`** (dengan jarak spasi yang proporsional seperti contoh invoice asli).
5. **Footer (2 Kolom Bawah):**
   - **Kiri (`Informasi Bank`):**
     - `Informasi Bank` (diikuti jarak spasi vertikal)
     - `BANK MANDIRI`
     - `1270012686075`
     - `a.n CV. PERKASA MANDIRI PUTRA`
     - `JAKARTA`
   - **Kanan (Tanda Tangan - Rata Tengah pada Blok Kanan):**
     - `Jakarta, [Tanggal Invoice]`
     - *(Ruang kosong tanda tangan ~25mm)*
     - `[Nama Penandatangan]` (**Teks Reguler / TIDAK bold dan TIDAK bergaris bawah / tanpa underline**, persis contoh invoice asli)
     - *(Jarak 1 baris kosong)*
     - `[Jabatan Penandatangan]` (Contoh: `(Kepala Administrasi)` — sembunyikan jika kosong).

---

### 5. FITUR "EKSTRAK SPO / PO" (100% SESUAI DOKUMEN ASLI GOFLEET & OLXMOBBI)
Pastikan modal **"Ekstraksi Otomatis Dokumen SPO / PO"** bebas dari bug state nyangkut dan mengenali struktur eksak dari PDF **SPO GoFleet** maupun **SPO OLXMobbi**:

1. **Reset State Bersih & Tanpa Hardcoded Fallback:**
   - Gunakan `useRef` pada `<input type="file">`. Setiap kali user memilih file baru, menghapus file, atau membuka modal, bersihkan state teks dan hasil bacaan sebelumnya.
   - **DILARANG KERAS** menaruh data fallback statis/contoh di dalam fungsi ekstraksi.
2. **Pembacaan Baris PDF Presisi (`PDF.js`):**
   - Saat file `.pdf` dipilih, ekstrak teks dari semua halaman menggunakan `pdfjs-dist` (via CDN worker yang stabil).
   - Kelompokkan item teks berdasarkan koordinat vertikal `Y` (dengan toleransi `Math.abs(y1 - y2) <= 3`) dari atas ke bawah dan urutkan `X` dari kiri ke kanan, lalu gabungkan per baris dengan `\n` agar baris tabel tetap utuh.
   - Simpan juga file dalam bentuk Base64 di state untuk kebutuhan ekstraksi multimodal Gemini API jika diperlukan.
3. **Parser Lokal Multi-Format (`parseSpoTextLocally(rawText)`):**
   Buat parser Regex JavaScript yang menangani struktur asli kedua dokumen berikut secara akurat:

   - **Format A — SPO GoFleet (`PT SOLUSI MOBILITAS BANGSA`):**
     - **Deteksi:** Mengandung `gofleet`, `SOLUSI MOBILITAS BANGSA`, atau `PO-SMB-`. Otomatis aktifkan **Preset Klien 1** (alamat otomatis terkunci ke Pasaraya Blok M & `No. SPK` otomatis berpola `SPK/PMP/GR/[4 digit terakhir No. Inv]`).
     - **`Nomor SPO`:** Tangkap `PO-SMB-\d{4}-\d+` (contoh: `PO-SMB-2611-009173`). *(Abaikan `Nomor SPK : PR-SMB-...` dari SPO karena `No. SPK` invoice menggunakan pola `SPK/PMP/GR/[4 digit terakhir No Inv]`).*
     - **`Data Kendaraan`:** Pada baris `Keterangan Unit : B1071DOJ / DAIHATSU/SIGRA/1.2 R MT/2023`, pisahkan berdasarkan `/`:
       - `No. Polisi`: segmen ke-1 (`B1071DOJ`).
       - `Model Kendaraan`: **hanya ambil Merk + Tipe utamanya saja** yaitu gabungan segmen ke-2 dan ke-3 (`DAIHATSU SIGRA`), buang varian detail (`1.2 R MT`).
       - `Tahun`: segmen terakhir (`2023`).
     - **`Tabel Item GoFleet`:**
       - Struktur baris di PDF GoFleet adalah: `[No] [Kode MMD-xxxxxx] [Description] [Qty] [Units] [Price/Unit (titik ribuan)] [Net Price (titik ribuan)]` (contoh: `1 MMD-001297 GASKET - CALYA/SIGRA 1 Units 6.000 6.000` dan `4 MMD-001507 JASA PERGANTIAN OLI MESIN 1 Units 100.000 100.000`).
       - **Aturan Ekstraksi Item GoFleet:** Buang nomor urut dan kode `MMD-\d+`, ambil nama item **apa adanya sesuai teks tabel** (contoh: `JASA PERGANTIAN OLI MESIN`, `GASKET - CALYA/SIGRA`, `OIL FILTER CALYA SIGRA`, `OLI WIN 10W-30`), ambil `Qty`, dan konversi `Price/Unit` bertitik ribuan (`60.000` -> `60000`).

   - **Format B — SPO OLXMobbi (`PT. SERASI MITRA MOBIL`):**
     - **Deteksi:** Mengandung `SERASI MITRA MOBIL`, `OLXMOBBI`, atau pola `PO/[A-Z0-9]+/`. Otomatis aktifkan **Preset Klien 2** (alamat otomatis terkunci ke `JL. TB SIMATUPANG NO. 25, CILANDAK BARAT, JAKARTA SELATAN` dan `Sertakan No. SPK` otomatis `false`).
     - **`Nomor SPO`:** Tangkap pola `PO\/[A-Z0-9\/-]+` (contoh: `PO/B2C27/26/10/000002`).
     - **`Data Kendaraan`:** Pada baris `Keterangan Unit : B1640DFM MG ZS 1.5 Magnify Bensin-AT`:
       - `No. Polisi`: tangkap plat nomor di awal (`B1640DFM`).
       - `Model Kendaraan`: **hanya ambil Merk + Tipe utamanya saja** (2 kata pertama setelah plat nomor, contoh: `MG ZS`, buang detail varian `1.5 Magnify Bensin-AT`).
       - `Tahun`: jika tidak ada tahun kendaraan pada `Keterangan Unit`, biarkan `""` (kosong) agar bisa diisi manual oleh user (jangan mengambil tahun dari tanggal cetak SPO).
     - **`Tabel Item Gabungan OLXMobbi`:**
       - Di PDF SPO OLXMobbi, Jasa dan Part berada di dalam **1 tabel gabungan** (`Kode | Pekerjaan dan Pergantian Part/Bahan | Qty | Harga Satuan (Rp) | Tax (Rp) | Jumlah (Rp)`), di mana kode sering menempel langsung ke nama item atau terpotong menjadi 2 baris, serta angka menggunakan desimal `.00` dan pemisah ribuan koma:
         - Contoh Jasa: `JS-000737JASA SERVICE STEERING RACK 1.0 850,000.00 0.00 850,000.00` dan `JS-000461JASA SPOORING 1.0 180,000.00 0.00 180,000.00`
         - Contoh Part (kode 2 baris): `M88-\nSPRI016-0000ROTOR DISC BRAKE 2.0 1,250,000.00 0.00 2,500,000.00` dan `M88-\nSPRI001-0002BRAKE PAD FR 1.0 1,250,000.00 0.00 1,250,000.00`
       - **Aturan Pembersihan & Pemisahan Otomatis OLXMobbi:**
         1. Gabungkan baris kode yang terpotong (seperti `M88-` di baris atas dengan `SPRI...` di baris bawahnya).
         2. **Hapus kode awalan** baik untuk jasa (`JS-\d+`) maupun sparepart (`M88-[A-Z0-9-]+` atau `SPRI[A-Z0-9-]+` atau kode part sejenis) sehingga nama item bersih menjadi `JASA SERVICE STEERING RACK`, `JASA SPOORING`, `ROTOR DISC BRAKE`, `BRAKE PAD FR`.
         3. Bulatkan `Qty` desimal (`1.0` -> `1`, `2.0` -> `2`) dan bulatkan `Harga Satuan` berdesimal (`850,000.00` -> `850000`, `1,250,000.00` -> `1250000`).
         4. **Klasifikasi Jasa vs Sparepart:** Semua item dengan kode berawalan `JS-` atau yang namanya mengandung kata `JASA`, `SERVICE`, `SERVIS`, `SPOORING`, `BALANCING`, `TUNE UP`, `PERBAIKAN`, `ONGKOS`, `LABOR`, `PASANG`, `BONGKAR` otomatis masuk ke **`jasaList`**. Semua item dengan kode `M88-` / `SPRI` atau part lainnya otomatis masuk ke **`sparepartList`**.

4. **Ekstraksi & Fallback Multimodal Gemini API (`gemini-2.5-flash`):**
   - Sediakan juga ekstraksi cerdas menggunakan Gemini API (`gemini-2.5-flash` dengan `thinkingConfig: { thinkingBudget: 0 }`) yang otomatis terpanggil jika hasil parser lokal kosong atau jika user mengunggah gambar/scan.
   - Berikan instruksi sistem (system instruction) yang sama persis kepada Gemini API: ambil nama item apa adanya sesuai tabel tanpa kode `MMD-`/`JS-`/`M88-SPRI...`, ambil Merk + Tipe Utama saja untuk `model` (misal `DAIHATSU SIGRA` atau `MG ZS`), bulatkan `qty` dan `hargaSatuan`, serta pisahkan `jasaList` dan `sparepartList` dengan akurat.

---

### 6. DOWNLOAD PDF VEKTOR ASLI (TAJAM & BISA COPY-PASTE) + CETAK PRINTER RAPI
1. **Tombol `"Download PDF Invoice"` (WAJIB Native Vector `jsPDF` — JANGAN Gunakan `html2canvas` / `html2pdf.js`):**
   - Buat fungsi generator PDF menggunakan `new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })`.
   - Gambar seluruh elemen invoice menggunakan fungsi vektor asli `doc.text()`, `doc.line()`, dan `doc.rect()` dengan margin kiri-kanan `15mm` dan atas-bawah `15mm` sehingga:
     - Hasil PDF **100% tajam (vektor)** walaupun di-zoom 500%.
     - **Seluruh teks dan angka di dalam PDF bisa diblok dan di-copy-paste**.
     - Tata letak kop surat monogram `PMP`, 2 kolom info klien & bengkel, tabel kendaraan (hanya garis horizontal atas-bawah), tabel `LIST JASA` & `LIST SPAREPART` (hanya garis horizontal, `Rp` di kiri dan angka rata kanan), garis pengapit `Total`, info Bank Mandiri, dan blok tanda tangan (nama penandatangan reguler tanpa garis bawah + spasi 1 baris ke jabatan) sama persis 100% dengan Contoh Invoice PDF.
   - Unduh otomatis dengan nama file: `Invoice_${noInv || 'DRAFT'}_${noPolisi || 'UNIT'}.pdf`.
2. **Tombol `"Cetak Printer"`:**
   - Gunakan `@media print` dengan `@page { size: A4 portrait; margin: 14mm 16mm; }` (serta fallback pop-up print window jika di dalam iframe) yang menyembunyikan seluruh sidebar dan form, lalu hanya mencetak kertas A4 dengan margin tepi yang rapi.
3. **Kompatibilitas Deployment (Vercel & Cloud Run):**
   - Pastikan seluruh package (`jspdf`, `pdfjs-dist`, `lucide-react`, `@google/genai`) terdaftar rapi di `package.json`, `vite build` berjalan tanpa error TypeScript, dan konfigurasi `vite.config.ts` mendukung `host: '0.0.0.0'` serta `port: Number(process.env.PORT) || 3000`.
