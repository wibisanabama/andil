import React from 'react';
import { Link } from 'react-router-dom';

const PILLARS = [
  {
    number: '1',
    title: 'Pembagian Kelompok & Peran Jelas',
    content: (
      <>
        Sistem menghitung kapasitas kelompok paling seimbang (misal 30 siswa ke 7 kelompok: 5-5-4-4-4-4-4), mendukung pembagian kelompok otomatis maupun manual oleh guru, serta kunci maksimal 1 Ketua Kelompok.
      </>
    ),
  },
  {
    number: '2',
    title: 'Kanban Berpemilik & Wajib Bukti',
    content: (
      <>
        Semua anggota dapat melihat progres kelompok, tetapi hanya pemilik task yang dapat mengubah pekerjaannya sendiri. Perpindahan ke status <em className="italic">Completed</em> wajib melampirkan bukti pekerjaan dan tercatat waktunya.
      </>
    ),
  },
  {
    number: '3',
    title: 'Evaluasi Guru Urut Nomor Absen',
    content: (
      <>
        Setelah batas waktu (<em className="italic">deadline</em>) terkunci, guru dapat memeriksa seluruh task, bukti hasil kerja, dan riwayat aktivitas setiap siswa berdasarkan urutan nomor absen untuk memberikan nilai individu yang objektif.
      </>
    ),
  },
];

export function LandingPage() {
  return (
    <main className="bg-[#F4F9FF] min-h-[calc(100vh-72px)] py-5 sm:py-8 px-3.5 sm:px-8">
      <div className="max-w-[1180px] mx-auto space-y-5 sm:space-y-6">
        {/* Hero Card Besar */}
        <section
          aria-labelledby="hero-heading"
          className="bg-white rounded-[24px] sm:rounded-[32px] border border-[#DCE8F5] shadow-[0_2px_12px_rgba(15,23,42,0.03)] px-4 sm:px-14 py-7 sm:py-12 text-center"
        >
          {/* Top Badge */}
          <div className="inline-flex items-center justify-center gap-2 bg-[#E0F2FE] text-[#1B3B6F] px-3.5 sm:px-4 py-1.5 rounded-full text-[11.5px] sm:text-[13px] font-bold mb-5 sm:mb-6 max-w-full">
            <span
              className="material-symbols-outlined material-symbols-filled text-[16px] sm:text-[17px] text-[#1B3B6F] shrink-0"
              aria-hidden="true"
            >
              verified
            </span>
            <span className="leading-snug">
              Platform Manajemen Tugas Kelompok &amp; Penilaian Kontribusi Individu
            </span>
          </div>

          {/* Main Heading */}
          <h1
            id="hero-heading"
            className="text-[24px] sm:text-[42px] font-extrabold text-[#1B3B6F] leading-[1.22] sm:leading-[1.18] tracking-[-0.02em] max-w-3xl mx-auto mb-4 sm:mb-5"
          >
            Kerja Kelompok Lebih Transparan,{' '}
            <br className="hidden sm:block" />
            Penilaian Individu Lebih Adil
          </h1>

          {/* Subtitle / Description */}
          <p className="text-[14px] sm:text-[17px] text-[#475569] leading-[1.65] max-w-[730px] mx-auto mb-7 sm:mb-9">
            Selama ini penilaian tugas kelompok sering disamaratakan karena guru hanya melihat hasil akhir. Melalui{' '}
            <strong className="font-bold text-[#334155]">Andil</strong>, setiap siswa mencatat tugas dan bukti kerjanya sendiri di papan Kanban sehingga guru dapat menilai kontribusi nyata tiap individu berdasarkan nomor absen.
          </p>

          {/* 2 Kartu Pintu Masuk Utama Berdampingan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-[820px] mx-auto text-left">
            {/* Kartu (a): Masuk sebagai Guru */}
            <article className="bg-[#EDF5FD] rounded-[20px] sm:rounded-[24px] p-5 sm:p-7 border border-[#DCE8F5] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span
                    className="w-12 h-12 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center shadow-2xs"
                    aria-hidden="true"
                  >
                    <span className="material-symbols-outlined material-symbols-filled text-[22px]">
                      school
                    </span>
                  </span>
                </div>

                <h2 className="text-[20px] font-extrabold text-[#1B3B6F] mb-2.5">
                  Masuk sebagai Guru
                </h2>

                <p className="text-[13.5px] text-[#475569] leading-[1.6] mb-6">
                  Buat Room tugas kelas, atur kapasitas kelompok otomatis &amp; daftar peran, bagi kelompok secara otomatis atau manual, pantau Kanban tim, dan beri nilai individu urut nomor absen.
                </p>
              </div>

              <Link
                to="/guru"
                className="w-full bg-[#2563EB] hover:bg-[#1B3B6F] text-white font-bold text-[14px] py-3.5 px-6 rounded-full inline-flex items-center justify-center gap-2 transition-colors"
              >
                <span>Masuk ke Halaman Guru</span>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            </article>

            {/* Kartu (b): Masuk sebagai Siswa */}
            <article className="bg-[#EDF5FD] rounded-[20px] sm:rounded-[24px] p-5 sm:p-7 border border-[#DCE8F5] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span
                    className="w-12 h-12 rounded-2xl bg-white border border-[#DCE8F5] text-[#2563EB] flex items-center justify-center shadow-2xs"
                    aria-hidden="true"
                  >
                    <span className="material-symbols-outlined material-symbols-filled text-[22px]">
                      person
                    </span>
                  </span>
                </div>

                <h2 className="text-[20px] font-extrabold text-[#1B3B6F] mb-2.5">
                  Masuk sebagai Siswa
                </h2>

                <p className="text-[13.5px] text-[#475569] leading-[1.6] mb-6">
                  Gabung ke Room menggunakan Kode Room, Nomor Absen, dan Nama Lengkap, pilih peran di kelompok, kelola task milikmu sendiri, serta kumpulkan bukti kerja.
                </p>
              </div>

              <Link
                to="/siswa"
                className="w-full bg-white hover:bg-[#F4F9FF] text-[#2563EB] border border-[#93C5FD] font-bold text-[14px] py-3.5 px-6 rounded-full inline-flex items-center justify-center gap-2 transition-colors"
              >
                <span>Masuk ke Halaman Siswa</span>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            </article>
          </div>
        </section>

        {/* 3 Kartu Pilar Cara Kerja */}
        <section
          aria-label="Tiga Pilar Cara Kerja Andil"
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
        >
          {PILLARS.map((pillar) => (
            <article
              key={pillar.number}
              className="bg-white rounded-[20px] sm:rounded-[24px] border border-[#DCE8F5] shadow-[0_2px_10px_rgba(15,23,42,0.02)] p-5 sm:p-7 text-left"
            >
              <div
                className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#2563EB] font-extrabold text-[15px] flex items-center justify-center mb-4"
                aria-hidden="true"
              >
                {pillar.number}
              </div>
              <h3 className="text-[16.5px] font-extrabold text-[#1B3B6F] mb-2.5">
                {pillar.title}
              </h3>
              <p className="text-[13.5px] text-[#475569] leading-[1.6]">
                {pillar.content}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

export default LandingPage;
