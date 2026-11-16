import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  useRoomData,
  fetchRoomDataFromSupabase,
} from '../../utils/storageSync';
import { TeacherGradingTab } from './TeacherGradingTab';

/**
 * TeacherRoomGradingPage
 * Halaman khusus evaluasi & penilaian individu (/guru/room/nilai)
 * yang terpisah dari halaman pantauan kelompok (/guru/room) agar tampilan rapi dan fokus.
 */
export function TeacherRoomGradingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const roomCodeParam = searchParams.get('code') || '';
  const [roomData, updateRoomData] = useRoomData(roomCodeParam);

  const [selectedGroupFilter, setSelectedGroupFilter] = useState(
    () => searchParams.get('group') || 'ALL'
  );

  const room = roomData?.room || null;
  const allStudents = roomData?.students || [];
  const groups = roomData?.groups || [];

  useEffect(() => {
    const grp = searchParams.get('group') || 'ALL';
    setSelectedGroupFilter(grp);
  }, [searchParams]);

  useEffect(() => {
    if (!room?.code) return undefined;
    const intervalId = setInterval(() => {
      fetchRoomDataFromSupabase(room.code);
    }, 2500);
    return () => clearInterval(intervalId);
  }, [room?.code]);

  if (!room) {
    return (
      <main className="bg-[#F4F9FF] min-h-[calc(100vh-72px)] py-12 px-4 sm:px-8">
        <div className="max-w-[680px] mx-auto bg-white rounded-[28px] border border-[#DCE8F5] p-10 text-center space-y-4 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
          <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] text-[#2563EB] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
              fact_check
            </span>
          </div>
          <h1 className="text-[22px] font-extrabold text-[#1B3B6F]">
            Belum Ada Room yang Dipilih untuk Dinilai
          </h1>
          <p className="text-[13.5px] text-[#64748B]">
            Silakan kembali ke halaman daftar Room dan pilih Room kelas terlebih dahulu.
          </p>
          <div className="pt-2">
            <Link
              to="/guru"
              className="bg-[#2563EB] hover:bg-[#1B3B6F] text-white font-bold text-[13.5px] px-6 py-3 rounded-full inline-flex items-center gap-2 transition-colors no-underline"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Kembali ke Daftar Room</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const approvedStudents = allStudents.filter(
    (s) => (s.joinStatus || 'approved') === 'approved'
  );
  const activeGroupObj = groups.find((g) => g.id === selectedGroupFilter);

  const handleGroupFilterChange = (nextGroupId) => {
    setSelectedGroupFilter(nextGroupId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (room.code) {
        next.set('code', room.code);
      }
      if (nextGroupId && nextGroupId !== 'ALL') {
        next.set('group', nextGroupId);
      } else {
        next.delete('group');
      }
      return next;
    });
  };

  return (
    <main className="bg-[#F4F9FF] min-h-[calc(100vh-72px)] py-8 px-4 sm:px-8">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* Header Halaman Penilaian */}
        <header className="bg-white rounded-[28px] border border-[#DCE8F5] p-7 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Link
                  to="/guru"
                  className="inline-flex items-center justify-center h-8 px-3.5 rounded-full bg-[#EDF5FD] hover:bg-[#DCEBFA] border border-[#CBE0F7] text-[#1B3B6F] font-bold text-[12.5px] leading-none gap-1.5 transition-colors no-underline"
                >
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                    dashboard
                  </span>
                  <span>Daftar Room</span>
                </Link>
                <Link
                  to={`/guru/room?code=${encodeURIComponent(room.code)}`}
                  className="inline-flex items-center justify-center h-8 px-3.5 rounded-full bg-[#EDF5FD] hover:bg-[#DCEBFA] border border-[#CBE0F7] text-[#1B3B6F] font-bold text-[12.5px] leading-none gap-1.5 transition-colors no-underline"
                >
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                    arrow_back
                  </span>
                  <span>Kembali ke Pantauan Kelompok</span>
                </Link>
                <span className="inline-flex items-center justify-center h-8 px-3.5 rounded-full bg-[#E0F2FE] border border-[#BFDBFE] text-[#2563EB] font-bold text-[12.5px] leading-none">
                  Kode Room: {room.code}
                </span>
                {activeGroupObj && (
                  <span className="inline-flex items-center justify-center h-8 px-3.5 rounded-full bg-[#D1FAE5] text-[#047857] font-bold text-[12.5px] leading-none">
                    Fokus: {activeGroupObj.name}
                  </span>
                )}
              </div>

              <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#1B3B6F] leading-tight">
                Penilaian Individu: {room.title}
              </h1>
              <p className="text-[13.5px] text-[#64748B] mt-1.5">
                Tugas: <strong className="font-bold text-[#334155]">{room.taskTitle}</strong> •{' '}
                {approvedStudents.length} Siswa Terdaftar
              </p>
            </div>

            <div className="flex flex-wrap items-center lg:justify-end gap-2.5 shrink-0">
              <Link
                to={`/guru/room?code=${encodeURIComponent(room.code)}`}
                className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-[#2563EB] hover:bg-[#1B3B6F] text-white font-bold text-[13px] leading-none gap-2 transition-colors no-underline shadow-2xs"
              >
                <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                  grid_view
                </span>
                <span>Lihat Kartu Pantauan Kelompok</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Komponen Utama Penilaian Individu Urut Absen */}
        <TeacherGradingTab
          roomData={roomData}
          updateRoomData={updateRoomData}
          selectedGroupFilter={selectedGroupFilter}
          onChangeGroupFilter={handleGroupFilterChange}
        />
      </div>
    </main>
  );
}

export default TeacherRoomGradingPage;
