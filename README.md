# Andil

Andil adalah aplikasi web manajemen tugas kelompok dan penilaian kontribusi individu untuk lingkungan pendidikan. Aplikasi ini mencatat pembagian peran, kepemilikan tugas pada papan Kanban, lampiran bukti hasil kerja, serta riwayat waktu pengerjaan sebagai dasar pemberian nilai individu yang objektif oleh guru.

## Fitur Utama

### 1. Sisi Guru (`/guru`)
- **Autentikasi Akun Guru**: Registrasi dan login akun guru (`public.users`) dengan validasi kata sandi minimal 4 karakter.
- **Pembuatan Room dan Validasi Kapasitas**: Konfigurasi kode room unik, judul tugas, tanggal batas waktu (*deadline*), target jumlah siswa, dan jumlah kelompok dengan aturan minimal 2 siswa per kelompok (`Target Siswa >= Jumlah Kelompok x 2`).
- **Manajemen Peran Kelompok**: Minimal terdapat 2 peran wajib (`Ketua Kelompok` maksimal 1 orang per kelompok dan `Anggota`). Guru dapat menambah atau menghapus peran tambahan baik saat pembuatan room maupun setelah room berjalan.
- **Pembagian Kelompok (Otomatis dan Manual)**:
  - **Otomatis (`auto`)**: Siswa yang bergabung langsung dialokasikan secara acak dan seimbang sesuai kapasitas kelompok, disertai opsi acak ulang otomatis.
  - **Manual (`manual`)**: Siswa yang bergabung masuk ke daftar tunggu penempatan untuk dipilihkan kelompoknya secara langsung oleh guru.
- **Penanganan Siswa Terlambat**: Siswa yang bergabung setelah pembagian kelompok diselesaikan otomatis ditandai sebagai terlambat (`pending_late`). Guru dapat menolak atau menyetujui (*approve*) siswa terlambat dengan pilihan penempatan otomatis maupun manual ke kelompok yang kuotanya belum terpenuhi.
- **Pantauan Kelompok dan Penilaian Individu Terpisah**:
  - Halaman `/guru/room` berfokus pada pembagian kelompok, manajemen peran, persetujuan siswa terlambat, dan pantauan progres kelompok.
  - Halaman `/guru/room/nilai` berfokus pada evaluasi individu urut nomor absen, pratinjau foto dan unduh berkas bukti kerja dari Supabase Storage, penguncian *deadline* (*read-only*), pemberian nilai (`0-100`) dan catatan guru, serta ekspor rekap nilai ke CSV atau cetak PDF.

### 2. Sisi Siswa (`/siswa`)
- **Masuk Room 2 Tahap dan Pengamanan Absen**:
  - Tahap 1: Verifikasi kode room di database.
  - Tahap 2: Pengisian nomor absen (dibatasi sesuai target jumlah siswa room), nama lengkap, dan kata sandi/PIN (wajib, minimal 4 karakter).
  - Satu nomor absen dikunci untuk satu nama siswa dan satu sesi aktif (`session_token`) agar tidak dapat digunakan secara bersamaan oleh dua pengguna. Sesi siswa diisolasi per tab browser menggunakan `sessionStorage`.
- **Ruang Tunggu Kelas (*Live Waiting Room*)**: Siswa yang masuk sebelum pembagian kelompok diselesaikan (status tepat waktu) maupun siswa terlambat menunggu di ruang tunggu dengan pembaruan *realtime* hingga guru mengonfirmasi pembagian atau menyetujui permintaan masuk.
- **Pemilihan Peran Kelompok**: Siswa memilih 1 peran di kelompoknya. Posisi `Ketua Kelompok` dibatasi maksimal 1 orang dan wajib terisi sebelum anggota kelompok dapat membuka papan Kanban (`/siswa/workspace`).
- **Workspace Kanban 4 Kolom dan Wajib Bukti**: Mengelola tugas pada kolom *Not Started*, *In Progress*, *On Hold / Terkendala*, dan *Completed*. Hanya pemilik tugas yang dapat mengubah, memindahkan status, atau menghapus tugasnya sendiri. Penyelesaian tugas ke status *Completed* mewajibkan pengisian catatan hasil kerja serta tautan atau unggahan berkas/foto ke Supabase Storage.

## Arsitektur dan Teknologi

- **Frontend**: React 18, Vite 6, React Router v6
- **Styling**: Tailwind CSS v4 (responsif untuk desktop dan perangkat mobile)
- **Backend & Database**: Supabase (`@supabase/supabase-js`)
  - **PostgreSQL**: Tabel `users`, `rooms`, `groups`, `students`, dan `tasks`
  - **Realtime**: Sinkronisasi perubahan data room, kelompok, siswa, dan tugas secara langsung
  - **Storage**: Bucket publik `evidence` untuk penyimpanan dan pratinjau berkas/foto bukti pekerjaan

## Struktur Halaman

| Halaman | Path URL | Deskripsi |
| :--- | :--- | :--- |
| Landing Page | `/` | Halaman utama dan pintu masuk akses Guru atau Siswa |
| Daftar Room Guru | `/guru` | Autentikasi guru dan daftar room tugas kelas aktif |
| Buat Room Baru | `/guru/buat-room` | Formulir konfigurasi room, kapasitas kelompok, metode pembagian, dan peran |
| Kelola & Pantau Kelompok | `/guru/room` | Pembagian kelompok, manajemen peran, siswa terlambat, dan pantauan progres |
| Penilaian Individu | `/guru/room/nilai` | Pemeriksaan bukti kerja, penilaian individu urut nomor absen, dan ekspor CSV/PDF |
| Gabung Room Siswa | `/siswa` | Verifikasi kode room, nomor absen, nama lengkap, dan kata sandi siswa |
| Ruang Tunggu & Pilih Peran | `/siswa/peran` | Ruang tunggu kelas dan pemilihan peran kelompok |
| Workspace Kanban | `/siswa/workspace` | Papan Kanban 4 kolom, pengumpulan bukti kerja, dan riwayat aktivitas |

## Konfigurasi dan Menjalankan Proyek Secara Lokal

Pastikan Node.js (versi 18 atau lebih baru) telah terpasang.

### 1. Konfigurasi Database Supabase
1. Buat project baru di Supabase.
2. Jalankan skema SQL pada berkas `supabase/schema_and_seed.sql` melalui Supabase SQL Editor untuk membuat tabel, kebijakan akses RLS, publikasi Realtime, dan bucket Storage `evidence`.

### 2. Variabel Lingkungan (`.env`)
Salin `.env.example` menjadi `.env` di root proyek, lalu isi kredensial project Supabase Anda:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-public-key
```

### 3. Instalasi dan Perintah Utama

```bash
# Pasang dependensi
npm install

# Jalankan server pengembangan
npm run dev

# Buat build produksi
npm run build

# Pratinjau hasil build produksi
npm run preview
```
