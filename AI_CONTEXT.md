# Konteks Proyek & Panduan AI Agent: Andil

Dokumen ini berisi rangkuman lengkap arsitektur, aturan bisnis, skema database Supabase, daftar halaman (routes), dan standar desain aplikasi **Andil** agar seluruh AI Agent anggota tim memiliki pemahaman konteks yang 100% seragam.

---

## 1. Gambaran Umum Aplikasi
**Andil** adalah platform web manajemen tugas kelompok dan evaluasi kontribusi individu berbasis bukti untuk sekolah/kelas.
- **Tech Stack**: React 19, Vite 6, Tailwind CSS v4, React Router v7, Supabase (`@supabase/supabase-js` — Database PostgreSQL, Realtime, & Storage).
- **Prinsip Data**: **Zero Mock / Zero Dummy Data**. Seluruh data berasal murni dari database cloud Supabase (`public.users`, `public.rooms`, `public.groups`, `public.students`, `public.tasks`, dan Storage bucket `evidence`).

---

## 2. Daftar Halaman (Routes) & Komponen Utama
1. **`/` (`src/components/LandingPage.jsx`)**:
   - Halaman utama (Landing Page) berisi penjelasan 3 pilar Andil dan 2 pintu masuk (**Masuk sebagai Guru** & **Masuk sebagai Siswa**).
2. **`/guru` (`src/components/guru/TeacherAuthGate.jsx` & `TeacherRoomList.jsx`)**:
   - Dilindungi oleh `TeacherAuthGate` (Login & Register akun Guru ke tabel `public.users`, kata sandi minimal 4 karakter, dilengkapi tombol lihat/sembunyikan kata sandi).
   - Menampilkan daftar Room milik Guru yang sedang login, statistik peserta/kelompok/task, tombol salin kode, dan tombol hapus Room (dilengkapi modal konfirmasi hapus).
3. **`/guru/buat-room` (`src/components/guru/TeacherCreateRoom.jsx`)**:
   - Form pembuatan Room baru oleh Guru:
     - Kode Room unik (bisa di-*generate* atau diketik).
     - Judul Room, Judul Tugas, Deskripsi Tugas, dan **Deadline Pengumpulan** (`type="date"`).
     - **Validasi Kerja Kelompok**: Minimal 1 kelompok dan minimal **2 siswa per kelompok** (`Target Jumlah Siswa >= Jumlah Kelompok × 2`). Pratinjau distribusi kapasitas kelompok dihitung otomatis oleh `calculateGroupCapacities` (`src/utils/groupAllocator.js`).
     - **Pengaturan Peran Kelompok**: Minimal wajib ada 2 peran dasar yang terkunci yaitu **`Ketua Kelompok (Wajib & Maks 1)`** dan **`Anggota (Wajib)`**. Guru dapat menambahkan/menghapus peran tambahan.
     - **Metode Pembagian Kelompok**: Pilihan **`auto` (Otomatis oleh Sistem)** atau **`manual` (Manual oleh Guru)**.
4. **`/guru/room` (`src/components/guru/TeacherRoomDetail.jsx` & `TeacherGroupsTab.jsx`)**:
   - Halaman pengelolaan Room & pantauan kelompok (tidak digabung dengan tabel penilaian agar tampilan tetap rapi):
     - **Saat `room.isGroupFinalized === false` (Fase Pembagian Kelompok)**:
       - Jika metode `auto`: Siswa yang masuk langsung ditempatkan secara acak & seimbang ke kelompok. Guru memiliki tombol **Acak Ulang Otomatis**.
       - Jika metode `manual`: Siswa yang masuk muncul di panel **Siswa Menunggu Penempatan Kelompok Manual** (`groupId = null`), dan Guru memilihkan kelompok tiap siswa lewat *dropdown*.
       - Tombol **Selesaikan Pembagian & Pantau Kelompok** terkunci selama belum ada kelompok yang terisi minimal 2 siswa atau masih ada siswa yang belum ditempatkan.
       - Tombol `✕` pada nama siswa menghapus siswa dari Supabase sekaligus otomatis me-*logout* layar siswa yang bersangkutan kembali ke `/siswa`.
     - **Saat `room.isGroupFinalized === true` (Fase Pantauan Kelompok)**:
       - Menampilkan ringkasan status task kelas dan kartu progres masing-masing kelompok.
       - Header memiliki tombol aksi dalam *grid* 2×2: **Kelola Peran** (tetap bisa menambah/menghapus peran walau Room sudah dibuat), **Siswa Terlambat**, **Halaman Penilaian Individu**, dan indikator **Fase Pantauan Aktif**.
     - **Manajemen Siswa Terlambat (`activeView === 'late'`)**:
       - Siswa yang baru bergabung setelah `isGroupFinalized === true` masuk ke daftar **Siswa Terlambat (`pending_late`)**.
       - Guru dapat memilih **Setujui (Approve)** (muncul modal pilihan penempatan **Otomatis oleh Sistem** atau **Manual oleh Guru** ke kelompok yang kuotanya belum terpenuhi) atau **Tolak**.
5. **`/guru/room/nilai` (`src/components/guru/TeacherRoomGradingPage.jsx` & `TeacherGradingTab.jsx`)**:
   - Halaman khusus evaluasi & penilaian individu urut Nomor Absen (`01..N`):
     - Menampilkan daftar siswa urut absen, filter per kelompok, tombol **Kunci/Buka Kunci Deadline**, serta **Ekspor CSV & Cetak PDF** (`src/utils/exportHelper.js`).
     - Panel kanan menampilkan detail task milik siswa terpilih, **Pratinjau Foto Bukti**, tombol **Buka / Unduh Berkas** (dari Supabase Storage bucket `evidence`), tautan eksternal, riwayat waktu (`logs`), serta form **Nilai Individu (0–100) & Catatan Evaluasi Guru** (hanya terlihat oleh Guru, tidak pernah ditampilkan di halaman Siswa).
6. **`/siswa` (`src/components/siswa/StudentJoinView.jsx`)**:
   - Alur masuk siswa 2 tahap:
     - **Tahap 1**: Masukkan **Kode Room** -> verifikasi ke Supabase (`verifyRoomCodeInSupabase`).
     - **Tahap 2**: Isi **No. Absen** (dibatasi `1` s.d. `planned_student_count` yang diatur Guru), **Nama Lengkap Siswa**, dan **Kata Sandi / PIN Siswa** (wajib, minimal 4 karakter, dengan tombol lihat/sembunyikan kata sandi).
     - **Keamanan Absen & Sesi**:
       - 1 Nomor Absen hanya untuk 1 Nama Siswa (tidak bisa ditimpa oleh siswa lain dengan nama berbeda).
       - 1 Nomor Absen tidak bisa digunakan oleh 2 pengguna/perangkat secara bersamaan (`session_token`).
       - Sesi siswa disimpan per tab browser menggunakan `window.sessionStorage` agar pengujian multi-tab (misal Siswa 1 di Workspace & Siswa 2 terlambat di Ruang Tunggu) tidak saling menimpa.
7. **`/siswa/peran` (`src/components/siswa/StudentWaitingRoom.jsx` & `StudentRoleView.jsx`)**:
   - **Ruang Tunggu Kelas (`StudentWaitingRoom.jsx`)**:
     - Ditampilkan otomatis selama `room.isGroupFinalized === false` (status **Tidak Telat / Tepat Waktu**) atau saat siswa masuk terlambat (`joinStatus === 'pending_late'` / `'rejected'`).
     - Begitu Guru menyelesaikan pembagian kelompok (atau meng-*approve* siswa terlambat), halaman otomatis berpindah secara *realtime* ke pemilihan peran kelompok.
   - **Pilih Peran Kelompok (`StudentRoleView.jsx`)**:
     - Menampilkan anggota kelompok dan kartu peran yang tersedia.
     - **Aturan Ketua Kelompok**: Maksimal 1 **Ketua Kelompok** per kelompok, dan **wajib ada 1 Ketua Kelompok** sebelum anggota kelompok dapat membuka Workspace (`/siswa/workspace`). Jika anggota lain sudah memilih peran selain Ketua, anggota terakhir otomatis dikunci untuk memilih **Ketua Kelompok**.
8. **`/siswa/workspace` (`src/components/siswa/StudentWorkspace.jsx`)**:
   - Papan Kanban 4 kolom (**1. Not Started**, **2. In Progress**, **3. On Hold / Terkendala**, **4. Completed (Wajib Bukti)**).
   - Siswa hanya dapat membuat, mengedit, menghapus, dan memindahkan status task miliknya sendiri (`ownerId === currentStudentId`); task teman sekelompok bersifat **Hanya Lihat**.
   - Memindahkan task ke **Completed** wajib mengisi **Modal Kumpulkan Bukti Pekerjaan** (deskripsi + tautan atau unggah berkas/foto ke Supabase Storage bucket `evidence`).

---

## 3. Skema Database & Storage Supabase
File referensi SQL: `supabase/schema_and_seed.sql`
1. **`public.users`**: `id`, `email`, `password`, `name`, `role`, `created_at`
2. **`public.rooms`**: `code` (PK), `teacher_id`, `title`, `task_title`, `description`, `deadline`, `deadline_label`, `is_deadline_locked`, `is_group_finalized`, `planned_student_count`, `group_count`, `division_method`, `available_roles` (JSONB), `created_at`
3. **`public.groups`**: `id` (PK, format `grp-<roomcode>-<index>`), `room_code`, `name`, `capacity`
4. **`public.students`**: `id` (PK, format `std-<roomcode>-<absen>`), `room_code`, `absen`, `name`, `password`, `session_token`, `is_late`, `join_status` (`'approved' | 'pending_late' | 'rejected'`), `group_id`, `role`, `grade`, `teacher_note`
5. **`public.tasks`**: `id` (PK), `room_code`, `group_id`, `owner_id`, `owner_name`, `owner_role`, `title`, `description`, `status`, `evidence` (JSONB berisi `notes`, `linkUrl`, `fileName`, `fileSize`, `fileUrl`, `mimeType`, `submittedAt`), `logs` (JSONB), `updated_at`
6. **Storage Bucket `evidence`**: Bucket publik untuk menyimpan berkas/foto bukti pekerjaan siswa.

---

## 4. Standar UI, Tipografi, & Color Palette (Selaras Logo Andil)
- **Logo**:
  - Favicon & Icon Brand: `/public/logo.png`
  - Wordmark Header: `/public/logo-teks.png`
- **Color Palette**:
  - **Deep Navy (`#1B3B6F`)**: Warna utama teks judul, tombol *hover*, dan kontras utama (mengikuti warna huruf `logo-teks.png`).
  - **Cerulean / Azure Blue (`#2563EB`)**: Warna tombol utama (CTA), *focus ring*, dan aksen aktif (mengikuti sampul buku & toga `logo.png`).
  - **Sky Blue Container (`#E0F2FE` & `#EDF5FD`)**: Warna *badge*, *pill*, dan latar kartu sekunder.
  - **Ice Surface Background (`#F4F9FF`)**: Warna latar belakang halaman utama.
  - **Border Halus (`#DCE8F5`)**: Warna garis tepi kartu dan kontainer.
- **Tipografi & Aturan Penulisan**:
  - Maksimal 2 jenis font: `'Plus Jakarta Sans'` untuk seluruh teks UI dan `'Material Symbols Outlined'` untuk ikon (jangan gunakan `font-mono`).
  - Jangan gunakan karakter *em dash* (`—`) pada teks UI maupun komentar kode.
