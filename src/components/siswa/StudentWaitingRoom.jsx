import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchRoomDataFromSupabase,
  requestRejoinLateStudentInSupabase,
  logoutStudentSession,
} from '../../utils/storageSync';

export function StudentWaitingRoom({ roomData, studentSession }) {
  const navigate = useNavigate();
  const room = roomData?.room || {};
  const students = [...(roomData?.students || [])].sort((a, b) => a.absen - b.absen);
  const currentStudentId = studentSession?.id || '';
  const [isRejoining, setIsRejoining] = useState(false);

  const activeStudent =
    students.find((s) => s.id === currentStudentId) || studentSession || {};
  const formattedSelfAbsen = String(activeStudent.absen || '').padStart(2, '0');
  const plannedCount = Number(room.plannedStudentCount) || 30;

  const joinStatus = activeStudent.joinStatus || 'approved';
  const isLatePending = joinStatus === 'pending_late';
  const isRejected = joinStatus === 'rejected';
  const isOnTimeWaiting = !isLatePending && !isRejected;

  // Siswa yang ditampilkan di daftar teman sekelas (yang sudah disetujui / masuk tepat waktu)
  const approvedClassmates = students.filter(
    (s) => (s.joinStatus || 'approved') === 'approved'
  );

  // Sinkronisasi berkala sebagai cadangan Realtime agar transisi otomatis 100% responsif
  useEffect(() => {
    const code = room.code || studentSession?.roomCode;
    if (!code) return undefined;

    const intervalId = setInterval(() => {
      fetchRoomDataFromSupabase(code);
    }, 2500);

    return () => clearInterval(intervalId);
  }, [room.code, studentSession?.roomCode]);

  const handleRequestAgain = async () => {
    if (!currentStudentId || isRejoining) return;
    setIsRejoining(true);
    try {
      await requestRejoinLateStudentInSupabase(
        currentStudentId,
        room.code || studentSession?.roomCode
      );
    } finally {
      setIsRejoining(false);
    }
  };

  return (
    <main className="bg-[#F4F9FF] min-h-[calc(100vh-72px)] py-6 sm:py-10 px-3.5 sm:px-8">
      <div className="max-w-[920px] mx-auto space-y-5 sm:space-y-6">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              logoutStudentSession();
              navigate('/siswa');
            }}
            className="inline-flex items-center gap-1.5 text-[12.5px] sm:text-[13px] font-bold text-[#1B3B6F] hover:text-[#2563EB] bg-white border border-[#DCE8F5] px-3.5 sm:px-4 py-2 rounded-full shadow-2xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              arrow_back
            </span>
            <span>Kembali / Ganti Room</span>
          </button>
        </div>

        {/* Hero Kartu Ruang Tunggu */}
        <section className="bg-white rounded-[22px] sm:rounded-[28px] border border-[#DCE8F5] p-5 sm:p-10 shadow-[0_4px_20px_rgba(15,23,42,0.04)] text-center">
          {/* Status Pill sesuai Kondisi Masuk (Tepat Waktu vs Telat vs Ditolak) */}
          {isOnTimeWaiting && (
            <div className="inline-flex items-center justify-center gap-2 bg-[#DCFCE7] border border-[#86EFAC] text-[#166534] px-3.5 sm:px-4 py-1.5 rounded-full text-[11.5px] sm:text-[12.5px] font-extrabold mb-4 sm:mb-5 max-w-full">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-ping shrink-0" />
              <span className="leading-snug">Tepat Waktu • Menunggu Guru Menyelesaikan Pembagian Kelompok</span>
            </div>
          )}

          {isLatePending && (
            <div className="inline-flex items-center justify-center gap-2 bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] px-3.5 sm:px-4 py-1.5 rounded-full text-[11.5px] sm:text-[12.5px] font-extrabold mb-4 sm:mb-5 max-w-full">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] animate-ping shrink-0" />
              <span className="leading-snug">Terlambat Masuk • Menunggu Persetujuan Guru</span>
            </div>
          )}

          {isRejected && (
            <div className="inline-flex items-center justify-center gap-2 bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] px-3.5 sm:px-4 py-1.5 rounded-full text-[11.5px] sm:text-[12.5px] font-extrabold mb-4 sm:mb-5 max-w-full">
              <span className="material-symbols-outlined text-[16px] shrink-0" aria-hidden="true">
                block
              </span>
              <span className="leading-snug">Permintaan Masuk Terlambat Belum Disetujui Guru</span>
            </div>
          )}

          <h1 className="text-[22px] sm:text-[32px] font-extrabold text-[#1B3B6F] tracking-tight mb-2">
            Ruang Tunggu Kelas ({room.code || studentSession?.roomCode})
          </h1>

          {isOnTimeWaiting && (
            <p className="text-[14px] sm:text-[15px] text-[#475569] max-w-xl mx-auto leading-relaxed mb-7">
              Kamu bergabung <strong className="font-bold text-[#166534]">tepat waktu</strong> sebelum pembagian kelompok ditutup. Halaman ini akan{' '}
              <strong className="font-bold text-[#1B3B6F]">otomatis berpindah ke pemilihan peran kelompok</strong>{' '}
              begitu Guru selesai mengonfirmasi pembagian anggota kelompok.
            </p>
          )}

          {isLatePending && (
            <p className="text-[14px] sm:text-[15px] text-[#475569] max-w-xl mx-auto leading-relaxed mb-7">
              Kamu masuk ke Room <strong className="font-bold text-[#B45309]">setelah Guru menyelesaikan pembagian kelompok</strong>. Begitu Guru menyetujui (Approve) permintaanmu, kamu akan otomatis ditempatkan ke kelompok yang anggotanya belum penuh dan diarahkan ke pemilihan peran.
            </p>
          )}

          {isRejected && (
            <div className="max-w-xl mx-auto mb-7 space-y-4">
              <p className="text-[14px] sm:text-[15px] text-[#64748B] leading-relaxed">
                Guru menolak permintaan masuk terlambatmu. Silakan konfirmasi kepada Guru di kelas lalu ajukan ulang permintaan masuk di bawah ini.
              </p>
              <button
                type="button"
                onClick={handleRequestAgain}
                disabled={isRejoining}
                className="bg-[#2563EB] hover:bg-[#1B3B6F] disabled:opacity-60 text-white font-bold text-[13.5px] px-6 py-2.5 rounded-full inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  refresh
                </span>
                <span>{isRejoining ? 'Mengirim Permintaan...' : 'Ajukan Permintaan Masuk Ulang'}</span>
              </button>
            </div>
          )}

          {/* Kartu Identitas Siswa & Info Tugas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <div className="bg-[#EDF5FD] border border-[#E0F2FE] rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center font-extrabold text-[16px] shrink-0">
                {formattedSelfAbsen}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
                    Identitasmu di Room
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isOnTimeWaiting
                        ? 'bg-[#DCFCE7] text-[#166534]'
                        : isLatePending
                        ? 'bg-[#FEF3C7] text-[#92400E]'
                        : 'bg-[#FEE2E2] text-[#DC2626]'
                    }`}
                  >
                    {isOnTimeWaiting ? 'Tidak Telat' : isLatePending ? 'Telat Masuk' : 'Ditolak'}
                  </span>
                </div>
                <p className="text-[15px] font-extrabold text-[#1B3B6F] truncate mt-0.5">
                  {activeStudent.name || 'Siswa'}
                </p>
                <p className="text-[12px] font-semibold text-[#475569]">
                  No. Absen {formattedSelfAbsen}
                </p>
              </div>
            </div>

            <div className="bg-[#F4F9FF] border border-[#DCE8F5] rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] text-[#2563EB] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
                  assignment
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                  {room.title || 'Room Tugas Kelompok'}
                </span>
                <p className="text-[14.5px] font-extrabold text-[#1B3B6F] truncate">
                  {room.taskTitle || 'Tugas Kelompok'}
                </p>
                <p className="text-[12px] font-semibold text-[#64748B]">
                  Batas Waktu: {room.deadlineLabel || '-'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Daftar Siswa yang Sudah Masuk ke Room (Live Lobby) */}
        <section className="bg-white rounded-[28px] border border-[#DCE8F5] p-6 sm:p-8 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2.5">
              <span
                className="material-symbols-outlined text-[22px] text-[#2563EB]"
                aria-hidden="true"
              >
                groups
              </span>
              <h2 className="text-[17px] font-extrabold text-[#1B3B6F]">
                Teman Sekelas yang Sudah Bergabung
              </h2>
            </div>

            <span className="inline-flex items-center gap-1.5 bg-[#E0F2FE] text-[#1B3B6F] text-[12.5px] font-extrabold px-3.5 py-1.5 rounded-full self-start sm:self-auto">
              <span>
                {approvedClassmates.length} / {plannedCount} Siswa Terdaftar
              </span>
            </span>
          </div>

          {approvedClassmates.length === 0 ? (
            <div className="py-10 text-center text-[13.5px] text-[#64748B]">
              Belum ada siswa yang masuk ke kelompok.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {approvedClassmates.map((st) => {
                const isMe = st.id === currentStudentId;
                const absenStr = String(st.absen).padStart(2, '0');
                return (
                  <div
                    key={st.id}
                    className={`rounded-2xl px-4 py-3 border flex items-center justify-between gap-2 transition-all ${
                      isMe
                        ? 'bg-[#E0F2FE]/60 border-[#2563EB] shadow-2xs'
                        : 'bg-[#F4F9FF] border-[#DCE8F5]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-full text-[11.5px] font-extrabold flex items-center justify-center shrink-0 ${
                          isMe
                            ? 'bg-[#2563EB] text-white'
                            : 'bg-[#DCE8F5] text-[#334155]'
                        }`}
                      >
                        {absenStr}
                      </span>
                      <span className="text-[13.5px] font-bold text-[#1B3B6F] truncate">
                        {st.name}
                      </span>
                    </div>

                    {isMe && (
                      <span className="bg-[#2563EB] text-white text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0">
                        Kamu
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default StudentWaitingRoom;
