import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRoomData } from '../../utils/storageSync';

/**
 * Halaman Dashboard Room Tugas Kelompok (POV Guru /guru)
 * Menampilkan ringkasan Room yang aktif dan opsi untuk membuat Room tugas baru.
 * Sesuai desain referensi docs/design-references/02_Guru_Daftar_Room.png
 */
export function TeacherRoomList({ roomData: propRoomData }) {
  const navigate = useNavigate();
  // ponytail: sinkronisasi state Room lokal & antar-tab via hook useRoomData, dengan opsi prop fallback
  const [dataFromHook] = useRoomData();
  const roomData = propRoomData || dataFromHook;

  const room = roomData?.room || {};
  const groups = roomData?.groups || [];
  const students = roomData?.students || [];
  const tasks = roomData?.tasks || [];

  const [copied, setCopied] = useState(false);

  // Hitung jumlah task yang telah selesai
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const totalTasks = tasks.length || 6;

  // ponytail: penanganan salin kode instan dengan navigator.clipboard dan fallback textarea
  const handleCopyCode = async () => {
    const codeToCopy = room.code || 'ANDIL-2026';
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(codeToCopy);
      } else {
        const tempInput = document.createElement('textarea');
        tempInput.value = codeToCopy;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Gagal menyalin kode:', err);
    }
  };

  return (
    <main className="bg-[#F8FAFD] min-h-[calc(100vh-72px)] py-7 px-4 sm:px-8">
      <div className="max-w-[1180px] mx-auto space-y-6">
        {/* Top Header Card */}
        <section className="bg-white rounded-[28px] border border-[#E2E8F0] px-7 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
          <div className="flex-1">
            <span className="bg-[#D3E3FD] text-[#041E49] px-3.5 py-1 rounded-full text-[12px] font-bold inline-flex items-center gap-1.5 mb-2.5">
              POV Guru • /guru
            </span>
            <h1 className="text-[26px] sm:text-[28px] font-extrabold text-[#0F172A] tracking-tight">
              Dashboard Room Tugas Kelompok
            </h1>
            <p className="text-[14px] text-[#64748B] mt-1">
              Pilih Room kelas yang sedang berjalan untuk mengelola kelompok &amp; menilai siswa, atau buat Room tugas baru.
            </p>
          </div>

          <Link
            to="/guru/buat-room"
            className="bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-[13.5px] px-5 py-3 rounded-full inline-flex items-center gap-2 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Buat Room Baru</span>
          </Link>
        </section>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left Card: Active Room Card */}
          <section className="bg-white rounded-[28px] border-[1.5px] border-[#0B57D0] p-7 flex flex-col justify-between shadow-[0_4px_20px_rgba(11,87,208,0.06)]">
            <div>
              {/* Top row: Badges and Copy Code Button */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-[#D3E3FD] text-[#0B57D0] font-extrabold text-[12.5px] px-3.5 py-1 rounded-full">
                    Kode: {room.code || 'ANDIL-2026'}
                  </span>
                  <span className="bg-[#D1FAE5] text-[#047857] font-bold text-[12px] px-3.5 py-1 rounded-full">
                    {room.isDeadlineLocked ? 'Terkunci' : 'Aktif'} • Deadline:{' '}
                    {room.deadlineLabel || '12 Nov 2026, 23:59'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#0B57D0] hover:text-[#0842A0] transition-colors cursor-pointer py-1 px-1.5 rounded-lg focus-visible:ring-2 focus-visible:ring-[#0B57D0]"
                  title="Salin Kode Room"
                  aria-label="Salin Kode Room"
                >
                  <span className="material-symbols-outlined text-[17px]">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>
              </div>

              {/* Middle Content */}
              <h2 className="text-[21px] font-extrabold text-[#0F172A] mt-4">
                {room.title || 'Tugas Kelompok Informatika'}
              </h2>
              <p className="text-[13.5px] font-bold text-[#0B57D0] mt-1">
                Tugas: {room.taskTitle || 'Presentasi Perkembangan Teknologi'}
              </p>
              <p className="text-[13.5px] text-[#475569] mt-2 leading-relaxed">
                {room.description ||
                  'Setiap kelompok membuat materi presentasi dan menyiapkan penyampaiannya.'}
              </p>

              {/* Stats Box */}
              <div className="bg-[#F0F4F9] rounded-2xl p-4 my-5 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[11.5px] text-[#64748B]">Peserta</p>
                  <p className="text-[14px] font-extrabold text-[#0F172A] mt-0.5">
                    {students.length}/{room.plannedStudentCount || 30} Siswa
                  </p>
                </div>
                <div>
                  <p className="text-[11.5px] text-[#64748B]">Kelompok</p>
                  <p className="text-[14px] font-extrabold text-[#0F172A] mt-0.5">
                    {groups.length} Kelompok
                  </p>
                </div>
                <div>
                  <p className="text-[11.5px] text-[#64748B]">Task Selesai</p>
                  <p className="text-[14px] font-extrabold text-[#047857] mt-0.5">
                    {completedTasks}/{totalTasks} Selesai
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom 2 Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Link
                to="/guru/room?tab=pembagian"
                className="bg-[#F0F4F9] hover:bg-[#E2E8F0] text-[#0F172A] font-bold text-[13.5px] py-3 px-4 rounded-full inline-flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[19px]">groups</span>
                <span>Kelola Pembagian Kelompok</span>
              </Link>
              <Link
                to="/guru/room?tab=penilaian"
                className="bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-[13.5px] py-3 px-4 rounded-full inline-flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[19px]">fact_check</span>
                <span>Buka &amp; Nilai Siswa</span>
              </Link>
            </div>
          </section>

          {/* Right Card: Prompt to Create New Room */}
          <section className="bg-[#F0F4F9]/70 rounded-[28px] border border-dashed border-[#CBD5E1] p-7 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0B57D0] mb-4 shadow-2xs">
              <span className="material-symbols-outlined material-symbols-filled text-[24px]">
                add_circle
              </span>
            </div>
            <h3 className="text-[17px] font-extrabold text-[#0F172A]">
              Ingin Mencoba Membuat Room Baru?
            </h3>
            <p className="text-[13.5px] text-[#64748B] max-w-md mt-2 leading-relaxed">
              Atur jumlah siswa &amp; kelompok untuk melihat kalkulasi kapasitas otomatis, sesuaikan daftar peran kelompok, dan pilih metode pembagian otomatis atau manual.
            </p>
            <Link
              to="/guru/buat-room"
              className="mt-5 bg-white hover:bg-[#F8FAFD] text-[#0B57D0] border border-[#CBD5E1] font-bold text-[13.5px] px-5 py-2.5 rounded-full transition-colors inline-flex items-center justify-center"
            >
              Buka Form Buat Room (/guru/buat-room)
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}

export default TeacherRoomList;
