import React, { useEffect } from 'react';
import { fetchRoomDataFromSupabase } from '../../utils/storageSync';

export function StudentWaitingRoom({ roomData, studentSession }) {
  const room = roomData?.room || {};
  const students = [...(roomData?.students || [])].sort((a, b) => a.absen - b.absen);
  const currentStudentId = studentSession?.id || '';

  const activeStudent =
    students.find((s) => s.id === currentStudentId) || studentSession || {};
  const formattedSelfAbsen = String(activeStudent.absen || '').padStart(2, '0');
  const plannedCount = Number(room.plannedStudentCount) || 30;

  // Sinkronisasi berkala sebagai cadangan Realtime agar transisi otomatis 100% responsif
  useEffect(() => {
    const code = room.code || studentSession?.roomCode;
    if (!code) return undefined;

    const intervalId = setInterval(() => {
      fetchRoomDataFromSupabase(code);
    }, 2500);

    return () => clearInterval(intervalId);
  }, [room.code, studentSession?.roomCode]);

  return (
    <main className="bg-[#F8FAFD] min-h-[calc(100vh-72px)] py-10 px-4 sm:px-8">
      <div className="max-w-[920px] mx-auto space-y-6">
        {/* Hero Kartu Ruang Tunggu ala Quizizz */}
        <section className="bg-white rounded-[28px] border border-[#E2E8F0] p-7 sm:p-10 shadow-[0_4px_20px_rgba(15,23,42,0.04)] text-center">
          {/* Status Pill Berdenyut */}
          <div className="inline-flex items-center gap-2.5 bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] px-4 py-1.5 rounded-full text-[12.5px] font-extrabold mb-5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] animate-ping" />
            <span>Menunggu Guru Menyelesaikan Pembagian Kelompok...</span>
          </div>

          <h1 className="text-[26px] sm:text-[32px] font-extrabold text-[#0F172A] tracking-tight mb-2">
            Ruang Tunggu Kelas ({room.code || studentSession?.roomCode})
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#475569] max-w-xl mx-auto leading-relaxed mb-7">
            Kamu sudah terdaftar di dalam Room. Halaman ini akan{' '}
            <strong className="font-bold text-[#0F172A]">otomatis berpindah ke pemilihan peran kelompok</strong>{' '}
            begitu Guru selesai mengonfirmasi pembagian anggota kelompok.
          </p>

          {/* Kartu Identitas Siswa & Info Tugas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <div className="bg-[#F0F4F9] border border-[#D3E3FD] rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0B57D0] text-white flex items-center justify-center font-extrabold text-[16px] shrink-0">
                {formattedSelfAbsen}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B57D0] block">
                  Identitasmu di Room
                </span>
                <p className="text-[15px] font-extrabold text-[#0F172A] truncate">
                  {activeStudent.name || 'Siswa'}
                </p>
                <p className="text-[12px] font-semibold text-[#475569]">
                  No. Absen {formattedSelfAbsen}
                </p>
              </div>
            </div>

            <div className="bg-[#F8FAFD] border border-[#E2E8F0] rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#D3E3FD] text-[#0B57D0] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
                  assignment
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                  {room.title || 'Room Tugas Kelompok'}
                </span>
                <p className="text-[14.5px] font-extrabold text-[#0F172A] truncate">
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
        <section className="bg-white rounded-[28px] border border-[#E2E8F0] p-6 sm:p-8 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2.5">
              <span
                className="material-symbols-outlined text-[22px] text-[#0B57D0]"
                aria-hidden="true"
              >
                groups
              </span>
              <h2 className="text-[17px] font-extrabold text-[#0F172A]">
                Teman Sekelas yang Sudah Bergabung
              </h2>
            </div>

            <span className="inline-flex items-center gap-1.5 bg-[#D3E3FD] text-[#041E49] text-[12.5px] font-extrabold px-3.5 py-1.5 rounded-full self-start sm:self-auto">
              <span>
                {students.length} / {plannedCount} Siswa Bergabung
              </span>
            </span>
          </div>

          {students.length === 0 ? (
            <div className="py-10 text-center text-[13.5px] text-[#64748B]">
              Memuat daftar siswa di dalam Room...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {students.map((st) => {
                const isMe = st.id === currentStudentId;
                const absenStr = String(st.absen).padStart(2, '0');
                return (
                  <div
                    key={st.id}
                    className={`rounded-2xl px-4 py-3 border flex items-center justify-between gap-2 transition-all ${
                      isMe
                        ? 'bg-[#D3E3FD]/60 border-[#0B57D0] shadow-2xs'
                        : 'bg-[#F8FAFD] border-[#E2E8F0]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-full text-[11.5px] font-extrabold flex items-center justify-center shrink-0 ${
                          isMe
                            ? 'bg-[#0B57D0] text-white'
                            : 'bg-[#E2E8F0] text-[#334155]'
                        }`}
                      >
                        {absenStr}
                      </span>
                      <span className="text-[13.5px] font-bold text-[#0F172A] truncate">
                        {st.name}
                      </span>
                    </div>

                    {isMe && (
                      <span className="bg-[#0B57D0] text-white text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0">
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
