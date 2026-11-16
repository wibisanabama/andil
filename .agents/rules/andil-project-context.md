---
description: Konteks penuh arsitektur, aturan bisnis, database Supabase, dan desain aplikasi Andil untuk seluruh AI Agent anggota tim.
---

# Aturan & Konteks Proyek Andil

Setiap kali mengerjakan fitur, perbaikan bug, atau perubahan UI pada repositori **Andil**, wajib mematuhi konteks dan aturan berikut (detail lengkap tersedia di `AI_CONTEXT.md`):

1. **Zero Mock / Zero Dummy Data**:
   - Jangan pernah menambahkan data palsu, mock, atau hardcoded (seperti `ANDIL-2026` atau `Budi Santoso`). Seluruh operasi harus terhubung ke Supabase melalui `src/utils/storageSync.js`.
2. **Alur Guru (`/guru`, `/guru/buat-room`, `/guru/room`, `/guru/room/nilai`)**:
   - Guru wajib login/register (`TeacherAuthGate.jsx`, minimal kata sandi 4 karakter).
   - Pembuatan Room mewajibkan minimal 1 kelompok dan minimal **2 siswa per kelompok** (`Target Siswa >= Jumlah Kelompok * 2`), serta minimal 2 peran dasar wajib yang terkunci: **`Ketua Kelompok`** dan **`Anggota`**.
   - Halaman `/guru/room` khusus menampilkan Pembagian Kelompok (`isGroupFinalized === false`), Pantauan Kelompok (`isGroupFinalized === true`), Kelola Peran, dan Persetujuan Siswa Terlambat (Approve Otomatis/Manual ke kelompok yang belum penuh).
   - Halaman `/guru/room/nilai` (`TeacherRoomGradingPage.jsx`) adalah halaman terpisah khusus untuk memeriksa bukti pekerjaan (termasuk pratinjau foto & unduh berkas dari Supabase Storage bucket `evidence`) dan memberi nilai individu urut absen (`01..N`).
3. **Alur Siswa (`/siswa`, `/siswa/peran`, `/siswa/workspace`)**:
   - Masuk Room 2 tahap di `/siswa`: cek Kode Room terlebih dahulu, lalu isi No. Absen (`1` s.d. `planned_student_count`), Nama Lengkap, dan Kata Sandi/PIN (wajib, minimal 4 karakter).
   - 1 Nomor Absen hanya untuk 1 siswa unik dan dikunci dengan `session_token` agar tidak bisa digunakan oleh 2 pengguna bersamaan. Sesi siswa disimpan di `window.sessionStorage` (terisolasi per tab browser).
   - Siswa yang masuk sebelum pembagian kelompok selesai (`!isGroupFinalized`) atau yang masuk terlambat (`joinStatus === 'pending_late'`) berada di Ruang Tunggu (`StudentWaitingRoom.jsx`) sampai dikonfirmasi/di-approve Guru.
   - Di `/siswa/peran`, kelompok **wajib memiliki 1 Ketua Kelompok** sebelum dapat membuka `/siswa/workspace`.
4. **Desain & Color Palette**:
   - Gunakan palet warna resmi logo Andil: Deep Navy `#1B3B6F`, Primary Blue `#2563EB`, Sky Container `#E0F2FE` & `#EDF5FD`, Surface `#F4F9FF`, dan Border `#DCE8F5`.
   - Hanya gunakan font `Plus Jakarta Sans` dan `Material Symbols Outlined` (tanpa `font-mono` dan tanpa karakter em dash).
