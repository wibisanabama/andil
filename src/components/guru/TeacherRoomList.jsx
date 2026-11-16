import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useAuthSession,
  useRoomData,
  fetchAllRoomsWithStatsFromSupabase,
  deleteRoomFromSupabase,
  setActiveRoomCode,
} from '../../utils/storageSync';

/**
 * Halaman Dashboard Room Tugas Kelompok (POV Guru /guru)
 * Menampilkan seluruh Room milik Guru yang tersimpan di database Supabase tanpa data dummy.
 */
export function TeacherRoomList() {
  const navigate = useNavigate();
  const { teacher } = useAuthSession();
  const [roomData] = useRoomData();

  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState('');
  const [deletingCode, setDeletingCode] = useState('');
  const [roomToDelete, setRoomToDelete] = useState(null);

  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await fetchAllRoomsWithStatsFromSupabase(teacher?.id || null);
      setRooms(list);
    } finally {
      setIsLoading(false);
    }
  }, [teacher?.id]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms, roomData]);

  const handleCopyCode = async (code) => {
    if (!code) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      }
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (err) {
      console.warn('Gagal menyalin kode:', err);
    }
  };

  const handleOpenRoom = (code) => {
    setActiveRoomCode(code);
    navigate(`/guru/room?code=${encodeURIComponent(code)}`);
  };

  const handleConfirmDeleteRoom = async () => {
    if (!roomToDelete?.code || deletingCode) return;
    const code = roomToDelete.code;
    setDeletingCode(code);
    try {
      await deleteRoomFromSupabase(code);
      setRoomToDelete(null);
      await loadRooms();
    } finally {
      setDeletingCode('');
    }
  };

  return (
    <main className="bg-[#F4F9FF] min-h-[calc(100vh-72px)] py-5 sm:py-7 px-3.5 sm:px-8">
      <div className="max-w-[1180px] mx-auto space-y-5 sm:space-y-6">
        {/* Top Header Card */}
        <section className="bg-white rounded-[22px] sm:rounded-[28px] border border-[#DCE8F5] p-5 sm:px-7 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
          <div className="flex-1">
            <h1 className="text-[22px] sm:text-[28px] font-extrabold text-[#1B3B6F] tracking-tight">
              Dashboard Room Tugas Kelompok
            </h1>
            <p className="text-[13px] sm:text-[14px] text-[#64748B] mt-1">
              Pilih Room kelas yang sedang berjalan untuk mengelola kelompok &amp; menilai siswa, atau buat Room tugas baru.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto">
            <Link
              to="/"
              className="flex-1 sm:flex-initial justify-center bg-[#EDF5FD] hover:bg-[#DCEBFA] border border-[#CBE0F7] text-[#1B3B6F] font-bold text-[13px] px-4 py-2.5 sm:py-3 rounded-full inline-flex items-center gap-1.5 transition-colors no-underline"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Beranda</span>
            </Link>
            <Link
              to="/guru/buat-room"
              className="flex-1 sm:flex-initial justify-center bg-[#2563EB] hover:bg-[#1B3B6F] text-white font-bold text-[13px] sm:text-[13.5px] px-4 sm:px-5 py-2.5 sm:py-3 rounded-full inline-flex items-center gap-2 transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Buat Room Baru</span>
            </Link>
          </div>
        </section>

        {/* Room Cards Grid or Empty State */}
        {isLoading ? (
          <section className="bg-white rounded-[22px] sm:rounded-[28px] border border-[#DCE8F5] p-8 sm:p-10 text-center">
            <p className="text-[14px] font-semibold text-[#64748B]">
              Memuat daftar Room dari database Supabase...
            </p>
          </section>
        ) : rooms.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
            {rooms.map((rm) => (
              <section
                key={rm.code}
                className="bg-white rounded-[22px] sm:rounded-[28px] border-[1.5px] border-[#2563EB] p-5 sm:p-7 flex flex-col justify-between shadow-[0_4px_20px_rgba(11,87,208,0.06)]"
              >
                <div>
                  {/* Top row: Badges and Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center justify-center h-7 px-3.5 rounded-full bg-[#E0F2FE] text-[#2563EB] font-bold text-[12.5px] leading-none">
                        Kode: {rm.code}
                      </span>
                      <span className="inline-flex items-center justify-center h-7 px-3.5 rounded-full bg-[#D1FAE5] text-[#047857] font-bold text-[12.5px] leading-none">
                        {rm.isDeadlineLocked ? 'Terkunci' : 'Aktif'}
                        {rm.deadlineLabel && rm.deadlineLabel !== '-'
                          ? ` • Deadline: ${rm.deadlineLabel}`
                          : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(rm.code)}
                        className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#2563EB] hover:text-[#1B3B6F] transition-colors cursor-pointer py-1 px-1.5 rounded-lg"
                        title="Salin Kode Room"
                        aria-label="Salin Kode Room"
                      >
                        <span className="material-symbols-outlined text-[17px]">
                          {copiedCode === rm.code ? 'check' : 'content_copy'}
                        </span>
                        <span>{copiedCode === rm.code ? 'Tersalin!' : 'Salin Kode'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRoomToDelete(rm)}
                        disabled={deletingCode === rm.code}
                        className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer py-1 px-2.5 rounded-full disabled:opacity-50"
                        title="Hapus Room"
                        aria-label="Hapus Room"
                      >
                        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                          delete
                        </span>
                        <span>{deletingCode === rm.code ? 'Menghapus...' : 'Hapus'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Middle Content */}
                  <h2 className="text-[21px] font-extrabold text-[#1B3B6F] mt-4">
                    {rm.title}
                  </h2>
                  <p className="text-[13.5px] font-bold text-[#2563EB] mt-1">
                    Tugas: {rm.taskTitle}
                  </p>
                  {rm.description && (
                    <p className="text-[13.5px] text-[#475569] mt-2 leading-relaxed">
                      {rm.description}
                    </p>
                  )}

                  {/* Stats Box */}
                  <div className="bg-[#EDF5FD] rounded-2xl p-3 sm:p-4 my-4 sm:my-5 grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                    <div>
                      <p className="text-[11px] sm:text-[11.5px] text-[#64748B]">Peserta</p>
                      <p className="text-[12.5px] sm:text-[14px] font-extrabold text-[#1B3B6F] mt-0.5">
                        {rm.studentCount}/{rm.plannedStudentCount} Siswa
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-[11.5px] text-[#64748B]">Kelompok</p>
                      <p className="text-[12.5px] sm:text-[14px] font-extrabold text-[#1B3B6F] mt-0.5">
                        {rm.groupCount} Kelompok
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-[11.5px] text-[#64748B]">Task Selesai</p>
                      <p className="text-[12.5px] sm:text-[14px] font-extrabold text-[#047857] mt-0.5">
                        {rm.completedTaskCount}/{rm.totalTaskCount} Selesai
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenRoom(rm.code)}
                    className="w-full bg-[#2563EB] hover:bg-[#1B3B6F] text-white font-bold text-[14px] py-3.5 px-6 rounded-full inline-flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Buka &amp; Kelola Room</span>
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section className="bg-white rounded-[28px] border border-[#DCE8F5] p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] text-[#2563EB] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
                meeting_room
              </span>
            </div>
            <h2 className="text-[20px] font-extrabold text-[#1B3B6F]">
              Belum Ada Room Tugas Kelompok
            </h2>
            <p className="text-[13.5px] text-[#64748B] max-w-md mx-auto">
              Anda belum memiliki Room tugas aktif. Klik tombol di bawah untuk membuat Room tugas kelompok baru dan membagikan Kode Room kepada siswa.
            </p>
            <div className="pt-2">
              <Link
                to="/guru/buat-room"
                className="bg-[#2563EB] hover:bg-[#1B3B6F] text-white font-bold text-[13.5px] px-6 py-3 rounded-full inline-flex items-center gap-2 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Buat Room Tugas Baru</span>
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* Modal Konfirmasi Hapus Room */}
      {roomToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-room-modal-title"
          className="fixed inset-0 bg-[#1B3B6F]/45 backdrop-blur-[2px] flex items-center justify-center p-4 z-50"
        >
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 sm:p-7 border border-[#DCE8F5] shadow-xl">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
                  warning
                </span>
              </div>
              <div>
                <h2 id="delete-room-modal-title" className="text-[18px] font-extrabold text-[#1B3B6F]">
                  Hapus Room Kelas Ini?
                </h2>
                <p className="text-[12.5px] font-bold text-[#DC2626] mt-0.5">
                  Kode Room: {roomToDelete.code}
                </p>
              </div>
            </div>

            <p className="text-[13.5px] text-[#475569] leading-relaxed mb-5">
              Apakah Anda yakin ingin menghapus Room{' '}
              <strong className="font-bold text-[#1B3B6F]">{roomToDelete.title}</strong> ({roomToDelete.taskTitle})? Seluruh data kelompok, daftar siswa, nilai, dan task Kanban di dalam Room ini akan dihapus permanen.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F1F5F9]">
              <button
                type="button"
                disabled={Boolean(deletingCode)}
                onClick={() => setRoomToDelete(null)}
                className="bg-[#EDF5FD] hover:bg-[#DCE8F5] disabled:opacity-50 text-[#334155] font-bold text-[13px] px-5 py-2.5 rounded-full cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={Boolean(deletingCode)}
                onClick={handleConfirmDeleteRoom}
                className="bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white font-bold text-[13px] px-5 py-2.5 rounded-full inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                  delete
                </span>
                <span>
                  {deletingCode === roomToDelete.code ? 'Menghapus...' : 'Ya, Hapus Room'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default TeacherRoomList;
