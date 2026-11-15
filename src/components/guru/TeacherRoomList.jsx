import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useRoomData,
  deleteRoomFromSupabase,
  restoreDefaultRoomToSupabase,
} from '../../utils/storageSync';

/**
 * Halaman Dashboard Room Tugas Kelompok (POV Guru /guru)
 * Menampilkan ringkasan Room yang aktif di Supabase serta aksi Buka, Buat Baru, atau Hapus Room.
 */
export function TeacherRoomList({ roomData: propRoomData }) {
  const [dataFromHook] = useRoomData();
  const roomData = propRoomData || dataFromHook;

  const room = roomData?.room || null;
  const groups = roomData?.groups || [];
  const students = roomData?.students || [];
  const tasks = roomData?.tasks || [];

  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const totalTasks = tasks.length;

  const handleCopyCode = async () => {
    const codeToCopy = room?.code || 'ANDIL-2026';
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(codeToCopy);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Gagal menyalin kode:', err);
    }
  };

  const handleDeleteRoom = async () => {
    if (!room?.code) return;
    setIsDeleting(true);
    try {
      await deleteRoomFromSupabase(room.code);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestoreDemoRoom = async () => {
    setIsRestoring(true);
    try {
      await restoreDefaultRoomToSupabase();
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <main className="bg-[#F8FAFD] min-h-[calc(100vh-72px)] py-7 px-4 sm:px-8">
      <div className="max-w-[1180px] mx-auto space-y-6">
        {/* Top Header Card */}
        <section className="bg-white rounded-[28px] border border-[#E2E8F0] px-7 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
          <div className="flex-1">
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

        {/* Active Room Card or Empty State */}
        {room ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <section className="bg-white rounded-[28px] border-[1.5px] border-[#0B57D0] p-7 flex flex-col justify-between shadow-[0_4px_20px_rgba(11,87,208,0.06)]">
              <div>
                {/* Top row: Badges and Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center justify-center h-7 px-3.5 rounded-full bg-[#D3E3FD] text-[#0B57D0] font-bold text-[12.5px] leading-none">
                      Kode: {room.code || 'ANDIL-2026'}
                    </span>
                    <span className="inline-flex items-center justify-center h-7 px-3.5 rounded-full bg-[#D1FAE5] text-[#047857] font-bold text-[12.5px] leading-none">
                      {room.isDeadlineLocked ? 'Terkunci' : 'Aktif'} • Deadline:{' '}
                      {room.deadlineLabel || '12 Nov 2026, 23:59'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#0B57D0] hover:text-[#0842A0] transition-colors cursor-pointer py-1 px-1.5 rounded-lg"
                      title="Salin Kode Room"
                      aria-label="Salin Kode Room"
                    >
                      <span className="material-symbols-outlined text-[17px]">
                        {copied ? 'check' : 'content_copy'}
                      </span>
                      <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteRoom}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer py-1 px-2.5 rounded-full disabled:opacity-50"
                      title="Hapus Room dari Supabase"
                      aria-label="Hapus Room"
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                        delete
                      </span>
                      <span>{isDeleting ? 'Menghapus...' : 'Hapus'}</span>
                    </button>
                  </div>
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

              {/* Bottom Action Button */}
              <div className="pt-2">
                <Link
                  to="/guru/room"
                  className="w-full bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-[14px] py-3.5 px-6 rounded-full inline-flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <span>Buka &amp; Kelola Room</span>
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </section>
          </div>
        ) : (
          <section className="bg-white rounded-[28px] border border-[#E2E8F0] p-10 text-center space-y-4">
            <h2 className="text-[20px] font-extrabold text-[#0F172A]">
              Belum Ada Room Aktif
            </h2>
            <p className="text-[13.5px] text-[#64748B] max-w-md mx-auto">
              Buat Room tugas baru atau pulihkan data simulasi Room ANDIL-2026 ke database Supabase.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/guru/buat-room"
                className="bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-[13.5px] px-5 py-3 rounded-full inline-flex items-center gap-2 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Buat Room Baru</span>
              </Link>
              <button
                type="button"
                onClick={handleRestoreDemoRoom}
                disabled={isRestoring}
                className="bg-[#F0F4F9] hover:bg-[#E2E8F0] text-[#0F172A] border border-[#E2E8F0] font-bold text-[13.5px] px-5 py-3 rounded-full inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">restore</span>
                <span>{isRestoring ? 'Memulihkan...' : 'Pulihkan Room Demo (ANDIL-2026)'}</span>
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default TeacherRoomList;
