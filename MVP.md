# ANDIL — Dokumen Konsep Sistem & Spesifikasi Final MVP Lomba Programming ISCOMFEST 2026

**Tagline:** *Pantau Peran, Catat Bukti, Nilai Lebih Adil.*  
**Kategori Lomba:** Lomba Programming — Information System Competition Festival (ISCOMFEST) 2026  
**Penyelenggara:** HMPSSI Universitas Mercu Buana Yogyakarta  
**Arsitektur Teknis:** 100% *Client-Side Web App* (Tanpa Server Backend — `LocalStorage` + *Multi-Tab Sync*)  
**Sistem Desain UI/UX:** [Material Design 3](https://m3.material.io/) — *Top Navbar Seragam (Tanpa Sidebar Kiri)*  
**Struktur Navigasi & POV:** `/` (Landing Page) $\rightarrow$ `/guru/...` (1 POV Guru) & `/siswa/...` (1 POV Siswa)  
**Target Deployment & Kolaborasi:** GitHub Repository (6 Issues + Feature Branches $\rightarrow$ PR ke `main`) + Vercel (`vercel.json` SPA Rewrite)  

## 1. Prinsip Utama Pengembangan: Eksplisit Berdasarkan Buku Panduan Lomba

Dokumen ini merupakan spesifikasi **100% Final MVP (Minimum Viable Product)** aplikasi **Andil** yang disusun berdasarkan aturan resmi **Buku Panduan Lomba Programming ISCOMFEST 2026** yang menyatakan secara eksplisit di empat bagian berbeda bahwa **kompleksitas teknis bukan penilaian utama**:

> **Bab II Poin A — Deskripsi Lomba (Halaman 4):**  
> "Penilaian menitikberatkan pada ide, kebermanfaatan, fungsi, dan kualitas hasil website. Kompleksitas teknis bukan penilaian utama, sehingga kompetisi ini adil bagi pelajar maupun mahasiswa dengan tingkat pengalaman yang berbeda."

> **Bab II Poin F.3 — Ketentuan Teknis Karya (Halaman 7):**  
> "Website statis maupun dinamis diperbolehkan. Penggunaan backend dan database tidak diwajibkan. Ide, kebermanfaatan, fungsi, dan kualitas hasil lebih diutamakan daripada kompleksitas teknis."

> **Bab II Poin J — Kriteria Penilaian (Halaman 10):**  
> "Penilaian tahap penyisihan dilakukan berdasarkan kriteria pada Lampiran 1, sedangkan penilaian tahap final berdasarkan kriteria pada Lampiran 2. Pelajar dan mahasiswa dinilai dengan kriteria yang sama, dan kompleksitas teknis bukan penilaian utama."

> **Lampiran 1 — Kriteria Penilaian Tahap Penyisihan (Halaman 13):**  
> "Kompleksitas teknis bukan penilaian utama. Website sederhana yang bermanfaat, berfungsi baik, dan tertata rapi dapat memperoleh nilai tinggi."

### Pedoman Eksekusi Teknis (Untuk Tim & Google Antigravity)

1. **100% Client-Side (Tanpa Server Backend):** Aplikasi berjalan sepenuhnya di peramban menggunakan penyimpanan `LocalStorage` yang dilengkapi sinkronisasi antar-tab (`window.addEventListener('storage')`) dan data awal siap pakai (`sampleRoomData.js`), sehingga 100% bebas risiko *server down*, *database timeout*, atau gagal *upload* saat diuji juri pada 17–18 November 2026.
2. **Alur 2 POV yang Alami (`/` $\rightarrow$ `/guru` & `/siswa`):** Pengguna memulai dari halaman **`/` (Landing Page)** lalu memilih masuk ke **`/guru`** (1 POV Guru) atau **`/siswa`** (1 POV Siswa — Budi Santoso, Absen 02).
3. **Konsistensi Visual Material Design 3 (M3) dengan 1 Top Navbar Seragam:** Menghindari penggunaan *sidebar* kiri yang berubah-ubah; seluruh halaman menggunakan **1 *Top App Bar* Horizontal yang konsisten**, bersih, dan lega di layar laptop maupun ponsel.
4. **Siap Deploy di Vercel Tanpa Error 404:** Proyek dilengkapi berkas konfigurasi `vercel.json` agar setiap *route* (`/`, `/guru/...`, `/siswa/...`) aman di-*refresh* kapan saja oleh dewan juri, serta berkas `README.md` lengkap untuk mengamankan 15% bobot kualitas kode.

## 2. Gambaran Umum Aplikasi Andil

**Andil** adalah platform berbasis website yang dirancang untuk membantu **Guru** dan **Siswa** dalam mengelola tugas kelompok sekaligus melacak kontribusi (*andil*) setiap anggota secara individu.

### Latar Belakang Masalah

Ketika guru memberikan tugas kelompok, penilaian sering kali hanya berfokus pada satu hasil akhir yang dikumpulkan oleh kelompok. Padahal, kontribusi setiap anggota di dalam kelompok belum tentu sama:
* Ada siswa yang mengerjakan sebagian besar pekerjaan dari awal hingga akhir.
* Ada siswa yang hanya mengerjakan bagian kecil.
* Ada siswa yang sekadar menumpang nama (*free-rider*) tanpa berkontribusi nyata.

Melalui **Andil**, guru dapat melihat proses kerja setiap siswa secara transparan—mulai dari pembagian peran, daftar *task* yang dibuat dan dikerjakan sendiri, riwayat perkembangan pengerjaan (*activity log*), hingga bukti pekerjaan yang dikumpulkan—sehingga guru memiliki dasar yang objektif untuk memberikan **nilai individu yang adil**.

### Inspirasi & Referensi Pengalaman Pengguna

* **Google Classroom:** Sistem pembuatan *Room* tugas dengan **Kode Room**, pengaturan *deadline*, pengumpulan bukti hasil kerja, halaman penilaian oleh guru, serta bahasa visual **[Material Design 3](https://m3.material.io/)**.
* **Quizizz:** Kemudahan bergabung ke *Room* hanya menggunakan **Kode Room**, **Nomor Absen**, dan **Nama Lengkap** (tanpa registrasi email/password).
* **Trello:** Sistem *Kanban Board* untuk membuat dan memantau *task* berdasarkan status pengerjaan dengan aturan kepemilikan *task* per individu.

### Pemisahan Jenis Pengguna (Role) vs Peran Kelompok

| Kategori | Jenis / Contoh | Hak Akses & Tanggung Jawab Utama |
| :--- | :--- | :--- |
| **Role Pengguna Aplikasi** | **1. Guru (`/guru/...`)** | Membuat & mengelola *Room*, menentukan daftar peran kelompok, membagi kelompok (**Otomatis** atau **Manual**), memantau progres kelompok, serta memberikan nilai individu (`0–100`) urut nomor absen. |
| **Role Pengguna Aplikasi** | **2. Siswa (`/siswa/...`)** | Bergabung ke *Room* menggunakan **Kode Room**, memilih 1 peran utama di kelompok, membuat & mengelola *task* miliknya sendiri di *Kanban Board*, serta mengumpulkan bukti pekerjaan. |
| **Peran di Dalam Kelompok** | **Ketua Kelompok [Wajib], Pembuat PPT, Pencari Materi, Penyusun Laporan, Presenter** | Ditentukan oleh Guru saat membuat *Room* untuk menunjukkan pembagian tanggung jawab kerja siswa di dalam kelompoknya. Posisi **Ketua Kelompok** dikunci maksimal 1 orang per kelompok dan tidak memiliki hak untuk mengedit *task* milik anggota lain. |

## 3. Pemetaan MVP Andil terhadap 100% Bobot Kriteria Penilaian

| Kriteria Penilaian | Bobot | Implementasi Konkret pada MVP Andil |
| :--- | :---: | :--- |
| **1. Ide dan Manfaat Solusi** *(Kejelasan masalah, kebermanfaatan, keunikan pendekatan)* | **25%** | Mengangkat masalah nyata ketimpangan kontribusi tugas kelompok (*free-rider*) dengan rantai data terstruktur: `Identitas Siswa -> Kelompok -> Peran -> Task Individu -> Riwayat -> Bukti -> Nilai Guru`. |
| **2. Fungsionalitas** *(Fitur berjalan sesuai tujuan, stabil/minim error, kelengkapan fitur utama)* | **25%** | Berjalan 100% stabil tanpa *backend*: kalkulator kapasitas kelompok otomatis (`5-5-4-4-4-4-4`), pembagian kelompok Otomatis & Manual, kunci 1 Ketua, validasi pemilik *task*, wajib bukti saat *Completed*, dan kunci *deadline*. |
| **3. Tampilan dan Pengalaman Pengguna** *(Kerapian, kemudahan navigasi, responsif)* | **25%** | Menerapkan **[Material Design 3 (M3)](https://m3.material.io/)** dengan **1 Top Navbar seragam** (tanpa *sidebar* yang berubah-ubah), pemisahan alur `/` $\rightarrow$ `/guru` & `/siswa` yang jelas, **Kanban 4 Kolom Proporsional**, serta tabel penilaian urut nomor absen. |
| **4. Kualitas dan Kerapian Kode** *(Struktur jelas, keterbacaan & README, praktik pemrograman baik)* | **15%** | Struktur kode modular dengan **Skema Data JSON yang seragam**, pengecekan hak akses di lapis logika (`src/utils/permissions.js`), sinkronisasi antar-tab, konfigurasi `vercel.json`, dan dokumentasi `README.md` lengkap. |
| **5. Dokumentasi dan Demo** *(Kejelasan proposal & kualitas video demo maks 5 menit)* | **10%** | Alur aplikasi mengikuti skenario cerita nyata (*Kelompok 1: Andi, Budi, Citra, Deni, Eka*) yang selaras 100% antara isi Proposal PDF, Video Demo 5 menit, dan simulasi langsung saat Grand Final. |
| **Total Bobot Penyisihan** | **100%** | **Seluruh indikator penilaian terpenuhi secara utuh, sederhana, dan rapi.** |

## 4. Ringkasan 10 Keputusan Final Penyederhanaan MVP (Telah Dikunci)

| No. | Aspek Sistem | Keputusan Final MVP Andil |
| :---: | :--- | :--- |
| **1** | **Struktur URL & Pintu Masuk (`/`)** | Halaman **`/`** berfungsi murni sebagai **Landing Page Andil** yang memperkenalkan produk dan menyediakan 2 tombol utama: **Masuk sebagai Guru (`/guru`)** dan **Masuk sebagai Siswa (`/siswa`)**. |
| **2** | **1 POV Guru & 1 POV Siswa** | Tidak perlu fitur ganti-ganti banyak akun siswa. Cukup **1 POV Guru** dan **1 POV Siswa aktif (Budi Santoso — Absen 02)**, sementara 29 siswa lainnya tetap ada di dalam sistem sebagai rekan sekelompok dan anggota kelas. |
| **3** | **Kerangka Navigasi (*App Shell*)** | **Menghapus *sidebar* kiri sepenuhnya** dan menggunakan **1 *Top Navbar* Horizontal yang konsisten di semua halaman** agar tampilan bersih, tidak berubah-ubah, dan papan *Kanban* serta tabel absen tampil lega. |
| **4** | **Akses Room dengan Kode Saja (Tanpa QR Code)** | Menggunakan **Kode Room Unik (contoh: `ANDIL-2026`)** dengan tombol *Salin Kode* tanpa gambar/pemindai *QR Code*, sehingga seluruh elemen yang tampil 100% fungsional. |
| **5** | **Pembuatan Daftar Peran oleh Guru** | Daftar peran kelompok **dibuat oleh Guru saat membuat Room** (menyediakan **5 peran default otomatis**: *Ketua Kelompok, Pembuat PPT, Pencari Materi, Penyusun Laporan, Presenter* + input ringan `+ Tambah Peran`). Peran **Ketua Kelompok** dikunci permanen (wajib ada & maksimal 1 orang per kelompok). |
| **6** | **Metode Pembagian Kelompok (Tanpa Spin & Tanpa Fitur Siswa Terlambat)** | Disederhanakan menjadi **2 metode bersih**: **(1) Otomatis (Acak Seimbang oleh Sistem)** sesuai kuota kapasitas (`5-5-4-4-4-4-4`) dan **(2) Manual (Ditentukan/Dipindahkan oleh Guru)** tanpa animasi *Spin Random* maupun skenario siswa terlambat. |
| **7** | **Mode Pemilihan Peran & Masuk Workspace** | Setiap siswa memilih **1 Peran Utama (*Single Role Selection*)** dari daftar peran yang telah disiapkan Guru. Di POV Budi, posisi *Ketua Kelompok* tampil terkunci karena sudah dipilih oleh Andi. Setelah memilih peran, siswa langsung masuk ke `/siswa/workspace`. |
| **8** | **Kanban 4 Kolom & Kunci Kepemilikan Task** | Papan *Kanban* di `/siswa/workspace` memiliki **4 kolom proporsional** (*Not Started, In Progress, On Hold / Terkendala, Completed*). Kartu milik **Budi** dapat dibuat, diedit, dan dipindahkan statusnya, sedangkan kartu milik rekan setimnya (*Andi, Citra, Deni, Eka*) tampil **Terkunci (Hanya Lihat)**. |
| **9** | **Formulir Bukti Pekerjaan Tanpa Backend** | Saat memindahkan *task* milik sendiri ke **Completed**, terbuka **M3 Dialog Modal** dengan **2 input bersih**: **(1) Deskripsi Hasil Kerja (Teks Wajib)** dan **(2) Tautan Bukti (Link URL) atau Lampiran Berkas/Foto Lokal** (`LocalStorage`). |
| **10** | **Penilaian Individu Urut Absen & Ekspor** | Di `/guru/room` (Tab Penilaian), guru memeriksa tabel 30 siswa urut **Nomor Absen (`01–30`)**, membuka panel detail siswa untuk melihat bukti & riwayat waktu, menginput **Nilai (`0–100`) + Catatan Guru**, serta mengunduh **CSV** atau **Cetak PDF (`window.print()`)**. |

## 5. Peta Halaman & Alur Sistem Berdasarkan URL (`/` $\rightarrow$ `/guru` & `/siswa`)

### A. Halaman `/` — Landing Page Resmi Andil
*(Referensi Desain: `docs/design-references/01_Landing_Page_Andil.png`)*

* **Header Navbar:** Logo **Andil** di kiri + tombol pintasan **Masuk sebagai Guru (`/guru`)** dan **Masuk sebagai Siswa (`/siswa`)** di kanan.
* **Hero Section:** Judul utama *"Kerja Kelompok Lebih Transparan, Penilaian Individu Lebih Adil"*, penjelasan singkat cara **Andil** mengatasi masalah *free-rider* dalam tugas kelompok, serta **2 Kartu Pintu Masuk Utama**:
  1. **Masuk sebagai Guru (`/guru`)** — Mengelola *Room*, membagi kelompok secara otomatis/manual, memantau *Kanban*, dan memberi nilai individu.
  2. **Masuk sebagai Siswa (`/siswa`)** — Bergabung ke *Room* dengan Kode, memilih peran, dan mengelola *task* serta bukti kerja.
* **Section Cara Kerja (3 Langkah Singkat):** *(1) Bagi Kelompok & Peran Secara Adil*, *(2) Kelola Task Individu & Kumpulkan Bukti di Kanban*, *(3) Pantau Riwayat & Nilai Individu Urut Nomor Absen*.

### B. Alur POV Guru (`/guru/...`)

Seluruh halaman Guru menggunakan *Top Navbar* Guru yang menampilkan tautan navigasi: `Daftar Room (/guru)` | `Buat Room (/guru/buat-room)` | `Kelola & Penilaian Room (/guru/room)` | serta tombol `Keluar (/)`.

1. **`/guru` (Dashboard Daftar Room Guru):**  
   *(Referensi Desain: `docs/design-references/02_Guru_Daftar_Room.png`)*
   * Menampilkan kartu *Room* tugas yang aktif (sudah tersedia *Room* **`ANDIL-2026` — Tugas Kelompok Informatika: Presentasi Perkembangan Teknologi** dengan `30 Siswa • 7 Kelompok` agar juri bisa langsung memeriksanya) serta tombol **`+ Buat Room Baru`**.
2. **`/guru/buat-room` (Halaman Buat Room, Kapasitas Otomatis, & Pengaturan Peran):**  
   *(Referensi Desain: `docs/design-references/03_Guru_Buat_Room_Baru.png`)*
   * Guru mengisi **Judul Room**, **Judul Tugas**, **Deskripsi**, **Deadline**, **Jumlah Siswa** (contoh: `30`), dan **Jumlah Kelompok** (contoh: `7`).
   * Sistem menampilkan **Tabel Pratinjau Kapasitas Otomatis** (`floor(N / K)` dengan sisa `N % K`):
     * *Kelompok 1 & 2:* masing-masing **5 siswa**
     * *Kelompok 3, 4, 5, 6, & 7:* masing-masing **4 siswa** (Total = **30 siswa**).
   * Guru menetapkan **Daftar Peran Kelompok** (5 peran *default* sudah terpilih otomatis: *Ketua Kelompok [Wajib & Terkunci], Pembuat PPT, Pencari Materi, Penyusun Laporan, Presenter* + bisa menambah peran kustom lewat kolom `+ Tambah Peran`).
   * Guru memilih metode pembagian kelompok (**Otomatis oleh Sistem** atau **Manual oleh Guru**), lalu menekan **Simpan & Buka Halaman Kelola Room** menuju `/guru/room`.
3. **`/guru/room` — Tab 1 (`1. Pembagian Kelompok`):**  
   *(Referensi Desain: `docs/design-references/04_Guru_Tab1_Pembagian_Kelompok.png`)*
   * Menampilkan **Kode Room (`ANDIL-2026`)** dengan tombol *Salin Kode* serta sakelar **Kunci Deadline (OFF / ON)**.
   * Menyediakan 2 kontrol bersih untuk pembagian kelompok:
     1. **Bagi Otomatis (Acak Seimbang):** Sistem langsung membagi seluruh 30 siswa secara acak dan proporsional ke dalam Kelompok 1 s.d. Kelompok 7 sesuai kapasitas (`5-5-4-4-4-4-4`).
     2. **Atur / Pindah Manual oleh Guru:** Guru dapat memindahkan siswa ke kelompok yang diinginkan melalui pilihan kelompok pada daftar anggota.
4. **`/guru/room` — Tab 2 (`2. Pantauan Kelompok`):**  
   *(Referensi Desain: `docs/design-references/05_Guru_Tab2_Pantauan_Kelompok.png`)*
   * Menampilkan statistik seluruh *task* kelas berdasarkan 4 status (*Not Started, In Progress, On Hold, Completed*) serta kartu *Kelompok 1* s.d. *Kelompok 7* lengkap dengan daftar anggota, peran masing-masing, dan progres penyelesaian kelompok.
5. **`/guru/room` — Tab 3 (`3. Penilaian Individu — Urut Absen`):**  
   *(Referensi Desain: `docs/design-references/06_Guru_Tab3_Penilaian_Individu_Absen.png`)*
   * Menampilkan tabel seluruh 30 siswa diurutkan berdasarkan **Nomor Absen (`01` s.d. `30`)**, dilengkapi pencarian nama, filter kelompok, tombol **Unduh Rekap CSV**, dan **Cetak Laporan PDF**.
   * Saat guru mengklik baris siswa (misalnya **02 — Budi Santoso**), panel detail di sebelah kanan menampilkan:
     * Identitas, Kelompok 1, Peran (*Pembuat PPT*), dan ringkasan statistik *task*.
     * Daftar *task* milik Budi beserta **Bukti Hasil Pekerjaan** (deskripsi, tautan URL, & nama berkas) dan **Riwayat Aktivitas Ber-Timestamp**.
     * Form **Input Nilai Individu (`0–100`)** dan **Catatan Umpan Balik Guru**.

### C. Alur POV Siswa (`/siswa/...`)

Seluruh halaman Siswa menggunakan *Top Navbar* Siswa yang menampilkan identitas siswa aktif (**`02 — Budi Santoso • Kelompok 1`**), menu `Gabung Room (/siswa)` | `Pilih Peran (/siswa/peran)` | `Workspace Kanban (/siswa/workspace)`, serta tombol `Keluar (/)`.

1. **`/siswa` (Halaman Gabung ke Room):**  
   *(Referensi Desain: `docs/design-references/07_Siswa_Gabung_Room.png`)*
   * Menampilkan kartu bersih tempat siswa memasukkan **Kode Room** (`ANDIL-2026`), **Nomor Absen** (`02`), dan **Nama Lengkap** (`Budi Santoso`)—sudah terisi *default* data Budi agar pengguna/juri cukup menekan tombol **"Masuk ke Kelompok 1"** dalam 1 klik.
2. **`/siswa/peran` (Halaman Pemilihan Peran Kelompok):**  
   *(Referensi Desain: `docs/design-references/08_Siswa_Pilih_Peran_Kelompok.png`)*
   * Menampilkan informasi **Kelompok 1 (5 Anggota)** beserta daftar teman satu timnya (*01. Andi Pratama, 02. Budi Santoso, 03. Citra Lestari, 04. Deni Kurniawan, 05. Eka Putri*).
   * Menampilkan kartu pilihan peran yang telah ditentukan oleh Guru:
     * Kartu **Ketua Kelompok** tampil dalam kondisi **Terkunci (*Disabled*)** dengan keterangan *"Sudah diambil oleh Andi Pratama (Maks 1 Ketua)"*.
     * Budi memilih 1 peran utamanya (default: **Pembuat PPT**) lalu menekan **Simpan Peran & Buka Workspace** menuju `/siswa/workspace`.
3. **`/siswa/workspace` (Workspace Kelompok, Kanban 4 Status, & Modal Bukti):**  
   *(Referensi Desain: `docs/design-references/09_Siswa_Workspace_Kanban.png` & `10_Siswa_Modal_Bukti_Completed.png`)*
   * Menampilkan ringkasan progres Kelompok 1, *deadline*, daftar peran tiap anggota, dan tombol **Extended FAB (`+ Buat Task Milikku`)**.
   * Menampilkan **Papan Kanban 4 Kolom Proporsional**:
     1. **Not Started** (contoh: *task* milik Eka Putri — *Hanya Lihat / Terkunci*)
     2. **In Progress** (contoh: *task* milik **Budi Santoso** — **Bisa Diedit & Dipindahkan Statusnya**)
     3. **On Hold / Terkendala** (contoh: *task* milik Deni Kurniawan — *Hanya Lihat / Terkunci*)
     4. **Completed (Wajib Bukti)** (contoh: *task* milik **Budi Santoso** dan *task* milik Andi Pratama yang sudah melampirkan bukti pekerjaan)
   * Ketika Budi memindahkan *task* miliknya ke kolom **Completed**, muncul **M3 Dialog Pengumpulan Bukti** (wajib mengisi *Deskripsi Hasil Pekerjaan* + *Tautan Bukti URL / Lampiran Berkas Lokal*).
   * Setiap kartu memiliki tombol **Log Riwayat** yang menampilkan catatan waktu perubahan status dari awal dibuat hingga *Completed*.
   * Semua perubahan yang dilakukan Budi di `/siswa/workspace` langsung tersimpan di `LocalStorage` dan otomatis terlihat ketika pengguna membuka `/guru/room` (Tab Penilaian).

## 6. Spesifikasi Sistem Desain Antarmuka: Material Design 3 (M3)

### A. Palet Warna Tonal (M3 Baseline & Education Color Roles)

| Token Peran Warna (M3 Color Role) | Kode Hex (Light Mode) | Penggunaan Spesifik pada Antarmuka Andil |
| :--- | :---: | :--- |
| **Primary** | `#0B57D0` *(Google Blue)* | Tombol aksi utama (*Filled Button*), indikator menu aktif, dan tautan utama. |
| **On Primary** | `#FFFFFF` | Teks dan ikon di atas tombol `Primary`. |
| **Primary Container** | `#D3E3FD` | Warna latar tombol **Extended FAB** (`+ Buat Task Milikku`) dan *pill* menu aktif di *Top Navbar*. |
| **On Primary Container** | `#041E49` | Teks dan ikon di dalam `Primary Container`. |
| **Secondary Container** | `#C2E7FF` | *Filter Chips*, lencana peran siswa (*Ketua, Pembuat PPT*), dan tombol sekunder (*Tonal Button*). |
| **Surface** | `#F8FAFD` | Latar belakang utama seluruh halaman aplikasi. |
| **Surface Container Low / High** | `#F0F4F9` / `#E9EEF6` | Latar belakang 4 kolom *Kanban*, *Top Navbar*, dan kartu kelompok. |
| **Status Semantic Tokens (4 Status Kanban)** | Slate (`#E2E8F0`), Blue (`#D3E3FD`), Amber (`#FEF3C7`), Emerald (`#D1FAE5`) | Warna kontainer lencana untuk *Not Started*, *In Progress*, *On Hold / Terkendala*, dan *Completed*. |

### B. Tipografi, Ikonografi, dan Bentuk Sudut (M3 Type, Icons, & Shape Scale)

* **Font Utama:** **Plus Jakarta Sans** / **Roboto** mengikuti 5 skala tipografi M3 (*Display, Headline, Title, Body, Label*).
* **Ikonografi:** **[Material Symbols Outlined](https://m3.material.io/styles/icons)**.
* **Skala Bentuk Sudut (*M3 Shape Scale*):**
  * **Full Pill (`rounded-full`):** Semua *Filled Button*, *Tonal Button*, *Segmented Button*, dan *Navbar Tab Pills*.
  * **Extra Large (`rounded-3xl` / `28px`):** *M3 Dialog Modal* (form tambah *task*, form bukti, & modal riwayat) serta kartu utama.
  * **Large (`rounded-2xl` / `16px`):** Kolom *Kanban* dan kartu *Task*.

## 7. Skema Data JSON Standar, Struktur Folder, & Pembagian GitHub Issues

### A. Skema Objek Data Standar (`JSON Schema` di `LocalStorage`)

```json
{
  "room": {
    "code": "ANDIL-2026",
    "title": "Tugas Kelompok Informatika",
    "taskTitle": "Presentasi Perkembangan Teknologi",
    "description": "Setiap kelompok membuat materi presentasi dan menyiapkan penyampaiannya.",
    "deadline": "2026-11-12T23:59:00",
    "isDeadlineLocked": false,
    "plannedStudentCount": 30,
    "groupCount": 7,
    "divisionMethod": "auto",
    "availableRoles": [
      "Ketua Kelompok",
      "Pembuat PPT",
      "Pencari Materi",
      "Penyusun Laporan",
      "Presenter"
    ]
  },
  "groups": [
    {
      "id": "grp-1",
      "name": "Kelompok 1",
      "capacity": 5
    }
  ],
  "students": [
    {
      "id": "std-01",
      "absen": 1,
      "name": "Andi Pratama",
      "groupId": "grp-1",
      "role": "Ketua Kelompok",
      "grade": 90,
      "teacherNote": "Koordinasi kelompok dan riset pembuka sangat baik."
    },
    {
      "id": "std-02",
      "absen": 2,
      "name": "Budi Santoso",
      "groupId": "grp-1",
      "role": "Pembuat PPT",
      "grade": 92,
      "teacherNote": "Seluruh slide selesai tepat waktu dengan bukti lengkap."
    }
  ],
  "tasks": [
    {
      "id": "tsk-101",
      "groupId": "grp-1",
      "ownerId": "std-02",
      "ownerName": "Budi Santoso",
      "ownerRole": "Pembuat PPT",
      "title": "Membuat Slide Presentasi Utama (10 Halaman)",
      "description": "Menyusun desain visual dan poin materi ke dalam slide presentasi.",
      "status": "Completed",
      "evidence": {
        "notes": "Slide 1 sampai 10 sudah selesai didesain dengan tema teknologi.",
        "linkUrl": "https://docs.google.com/presentation/d/contoh-slide-budi",
        "fileName": "Presentasi_Kelompok1_Budi.pptx",
        "fileSize": "2.4 MB",
        "submittedAt": "11 Nov, 15:00"
      },
      "logs": [
        { "time": "09 Nov, 08:00", "actor": "Budi Santoso", "action": "Membuat task (Not Started)" },
        { "time": "09 Nov, 09:15", "actor": "Budi Santoso", "action": "Mengubah status ke In Progress" },
        { "time": "10 Nov, 13:20", "actor": "Budi Santoso", "action": "Mengubah status ke On Hold / Terkendala" },
        { "time": "11 Nov, 08:30", "actor": "Budi Santoso", "action": "Mengubah status kembali ke In Progress" },
        { "time": "11 Nov, 15:00", "actor": "Budi Santoso", "action": "Mengirim bukti dan menyelesaikan task (Completed)" }
      ]
    }
  ]
}
```

### B. Struktur Folder Proyek (Bebas Merge Conflict & Sesuai 6 GitHub Issues)

```text
andil/
├── MVP.md                     # Dokumen Konsep Sistem & Spesifikasi Final MVP Andil
├── README.md                  # Dokumentasi lengkap proyek, fitur, sistem M3, & cara menjalankan
├── vercel.json                # Aturan rewrite SPA agar route /, /guru/*, /siswa/* aman di-refresh
├── index.html                 # Entry point utama aplikasi (memuat font Plus Jakarta Sans & Material Symbols)
├── docs/
│   └── design-references/     # 10 Gambar Referensi Desain Halaman (PNG) untuk acuan setiap GitHub Issue
│       ├── 01_Landing_Page_Andil.png
│       ├── 02_Guru_Daftar_Room.png
│       ├── 03_Guru_Buat_Room_Baru.png
│       ├── 04_Guru_Tab1_Pembagian_Kelompok.png
│       ├── 05_Guru_Tab2_Pantauan_Kelompok.png
│       ├── 06_Guru_Tab3_Penilaian_Individu_Absen.png
│       ├── 07_Siswa_Gabung_Room.png
│       ├── 08_Siswa_Pilih_Peran_Kelompok.png
│       ├── 09_Siswa_Workspace_Kanban.png
│       └── 10_Siswa_Modal_Bukti_Completed.png
├── src/
│   ├── theme/
│   │   └── materialTokens.js  # Definisi token warna, tipografi, dan shape Material Design 3
│   ├── data/
│   │   └── sampleRoomData.js  # Data awal Room ANDIL-2026 (30 siswa, 7 kelompok, & task Kelompok 1)
│   ├── utils/
│   │   ├── groupAllocator.js  # Rumus kapasitas (5-5-4-4-4-4-4), pembagian Otomatis, & pindah Manual Guru
│   │   ├── permissions.js     # Validasi logika (kunci 1 Ketua, hanya pemilik task bisa edit, kunci deadline)
│   │   ├── storageSync.js     # Penyimpanan LocalStorage & sinkronisasi real-time antar-tab browser
│   │   └── exportHelper.js    # Fungsi ekspor tabel nilai individu urut absen ke CSV & Cetak PDF
│   ├── components/
│   │   ├── TopNavbar.jsx          # 1 Top Navbar Horizontal Seragam (Issue #1 - @wibisanabama)
│   │   ├── LandingPage.jsx        # Route / : Landing Page Andil + Pintu Masuk Guru & Siswa (Issue #1 - @wibisanabama)
│   │   ├── guru/
│   │   │   ├── TeacherRoomList.jsx    # Route /guru : Daftar Room & Ringkasan Kelas (Issue #2 - @ALIFKA-HUB)
│   │   │   ├── TeacherCreateRoom.jsx  # Route /guru/buat-room : Form Room, Kapasitas, & 5 Peran + Kustom (Issue #2 - @ALIFKA-HUB)
│   │   │   ├── TeacherRoomDetail.jsx  # Route /guru/room : Container Header Room & Sub-Tab Navigasi (Issue #3 - @ALIFKA-HUB)
│   │   │   ├── TeacherGroupsTab.jsx   # Route /guru/room (Tab 1 & Tab 2) : Pembagian & Pantauan Kelompok (Issue #3 - @ALIFKA-HUB)
│   │   │   └── TeacherGradingTab.jsx  # Route /guru/room (Tab 3) : Tabel Absen 01-30, Bukti, Nilai, CSV/PDF (Issue #4 - @wibisanabama)
│   │   └── siswa/
│   │       ├── StudentJoinView.jsx    # Route /siswa : Input Kode Room, Nomor Absen, & Nama Lengkap (Issue #5 - @putrimaulidiayusuf)
│   │       ├── StudentRoleView.jsx    # Route /siswa/peran : Pilih 1 Peran (Ketua terkunci oleh Andi) (Issue #5 - @putrimaulidiayusuf)
│   │       └── StudentWorkspace.jsx   # Route /siswa/workspace : Kanban 4 Kolom & Modal Bukti (Issue #6 - @putrimaulidiayusuf)
│   ├── App.jsx                # Pengatur routing /, /guru/*, /siswa/* dan state aplikasi
│   └── main.jsx               # Inisialisasi aplikasi React + Vite
└── package.json
```

### C. Pembagian Tugas Tim (6 GitHub Issues & Alur Branch $\rightarrow$ Pull Request)

| Issue | Assignee | Nama Branch Kerja | Halaman & Komponen Utama | Gambar Referensi Desain |
| :---: | :--- | :--- | :--- | :--- |
| **Issue #1** *(Fondasi)* | `@wibisanabama` | `feat/issue-1-foundation-landing` | Fondasi React+Vite, `sampleRoomData.js`, `storageSync.js`, `TopNavbar.jsx`, `LandingPage.jsx` (`/`), & `vercel.json` | `01_Landing_Page_Andil.png` |
| **Issue #2** | `@ALIFKA-HUB` | `feat/issue-2-guru-room-setup` | `TeacherRoomList.jsx` (`/guru`), `TeacherCreateRoom.jsx` (`/guru/buat-room`), & `groupAllocator.js` | `02_Guru_Daftar_Room.png`, `03_Guru_Buat_Room_Baru.png` |
| **Issue #3** | `@ALIFKA-HUB` | `feat/issue-3-guru-kelola-kelompok` | `TeacherRoomDetail.jsx` & `TeacherGroupsTab.jsx` (`/guru/room` — Tab 1 Pembagian Otomatis/Manual & Tab 2 Pantauan) | `04_Guru_Tab1_Pembagian_Kelompok.png`, `05_Guru_Tab2_Pantauan_Kelompok.png` |
| **Issue #4** | `@wibisanabama` | `feat/issue-4-guru-penilaian-absen` | `TeacherGradingTab.jsx` (`/guru/room` — Tab 3 Penilaian Individu Urut Absen `01–30`) & `exportHelper.js` (CSV & Cetak PDF) | `06_Guru_Tab3_Penilaian_Individu_Absen.png` |
| **Issue #5** | `@putrimaulidiayusuf` | `feat/issue-5-siswa-join-peran` | `StudentJoinView.jsx` (`/siswa`), `StudentRoleView.jsx` (`/siswa/peran`), & validasi peran di `permissions.js` | `07_Siswa_Gabung_Room.png`, `08_Siswa_Pilih_Peran_Kelompok.png` |
| **Issue #6** | `@putrimaulidiayusuf` | `feat/issue-6-siswa-workspace-kanban` | `StudentWorkspace.jsx` (`/siswa/workspace` — Kanban 4 Kolom, Modal Bukti *Completed*, & Log Riwayat) | `09_Siswa_Workspace_Kanban.png`, `10_Siswa_Modal_Bukti_Completed.png` |