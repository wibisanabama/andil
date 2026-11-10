import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useRoomData } from '../../utils/storageSync';
import { TeacherGroupsTab } from './TeacherGroupsTab';
import { TeacherGradingTab } from './TeacherGradingTab';

/**
 * TeacherRoomDetail
 * Halaman detail room untuk Guru (/guru/room) dengan alur 2 fase otomatis
 * berdasarkan properti boolean room.isGroupFinalized di LocalStorage:
 * 1. Fase Pembagian Kelompok (isGroupFinalized === false)
 * 2. Fase Pantauan & Penilaian Kelompok (isGroupFinalized === true)
 */
export function TeacherRoomDetail() {
  const [roomData, updateRoomData] = useRoomData();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedGroupFilter, setSelectedGroupFilter] = useState(
    () => searchParams.get('group') || 'ALL'
  );
  const [copied, setCopied] = useState(false);

  const room = roomData?.room || {
    code: 'ANDIL-2026',
    title: 'Tugas Kelompok Informatika',
    taskTitle: 'Presentasi Perkembangan Teknologi',
    deadlineLabel: '12 Nov 2026, 23:59',
    isDeadlineLocked: false,
    isGroupFinalized: false,
  };

  const isGroupFinalized = Boolean(room.isGroupFinalized);
  const students = roomData?.students || [];
  const groups = roomData?.groups || [];

  const capacitiesLabel =
    groups.length > 0
      ? groups.map((g) => g.capacity).join('-')
      : '5-5-4-4-4-4-4';

  // Selesaikan pembagian kelompok dan beralih otomatis ke Fase Pantauan & Penilaian
  const handleFinalizeGroups = () => {
    if (!updateRoomData) return;
    updateRoomData((prev) => ({
      ...prev,
      room: {
        ...prev.room,
        isGroupFinalized: true,
      },
    }));
  };

  // Kembali ke Fase Pembagian Kelompok jika guru perlu memindahkan siswa
  const handleReopenGroupDivision = () => {
    if (!updateRoomData) return;
    updateRoomData((prev) => ({
      ...prev,
      room: {
        ...prev.room,
        isGroupFinalized: false,
      },
    }));
  };

  // Callback dari kartu kelompok ("Periksa & Nilai") untuk memfilter tabel dan scroll ke bagian penilaian
  const handleInspectGroup = (groupId) => {
    setSelectedGroupFilter(groupId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('group', groupId);
      return next;
    });
    const gradingEl = document.getElementById('grading-section');
    if (gradingEl) {
      gradingEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleGroupFilterChange = (nextGroupId) => {
    setSelectedGroupFilter(nextGroupId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (nextGroupId && nextGroupId !== 'ALL') {
        next.set('group', nextGroupId);
      } else {
        next.delete('group');
      }
      return next;
    });
  };

  // Salin kode room ke clipboard
  const handleCopyCode = async () => {
    if (!room.code) return;
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="bg-[#F8FAFD] min-h-[calc(100vh-72px)] py-8 px-4 sm:px-8">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* Top Room Header Card */}
        <header className="bg-white rounded-[28px] border border-[#E2E8F0] p-7 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left side */}
            <div>
              {/* Top Meta Row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Link
                  to="/guru"
                  className="inline-flex items-center justify-center h-8 px-3.5 rounded-full bg-[#F0F4F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#0F172A] font-bold text-[12.5px] leading-none gap-1.5 transition-colors no-underline"
                >
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                    arrow_back
                  </span>
                  <span>Daftar Room</span>
                </Link>
                <span className="inline-flex items-center justify-center h-8 px-3.5 rounded-full bg-[#D3E3FD] border border-[#BFDBFE] text-[#0B57D0] font-bold text-[12.5px] leading-none">
                  Kode Room: {room.code}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center justify-center h-8 px-3.5 rounded-full bg-[#F0F4F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#0F172A] font-bold text-[12.5px] leading-none gap-1.5 cursor-pointer transition-colors"
                  title="Salin Kode Room"
                >
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>
              </div>

              {/* Main Heading */}
              <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A] leading-tight">
                {room.title}: {room.taskTitle}
              </h1>

              {/* Subtitle Info */}
              <p className="text-[13.5px] text-[#64748B] mt-1.5">
                Deadline: {room.deadlineLabel || '12 Nov 2026, 23:59'} • Kapasitas:{' '}
                {students.length} Siswa dalam {groups.length} Kelompok ({capacitiesLabel})
              </p>
            </div>

            {/* Right side: Status Fase & Tombol Aksi Kontekstual */}
            <div className="flex flex-wrap items-center lg:justify-end gap-2.5 shrink-0">
              {isGroupFinalized ? (
                <>
                  <span className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-[#D1FAE5] text-[#047857] font-bold text-[12.5px] leading-none gap-1.5">
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                      verified
                    </span>
                    <span>Fase Pantauan &amp; Penilaian</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleReopenGroupDivision}
                    className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-[#F0F4F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#0F172A] font-bold text-[12.5px] leading-none gap-1.5 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                      groups
                    </span>
                    <span>Ubah Pembagian Kelompok</span>
                  </button>
                </>
              ) : (
                <span className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-[#FEF3C7] text-[#B45309] font-bold text-[12.5px] leading-none gap-1.5">
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                    tune
                  </span>
                  <span>Fase Pembagian Kelompok</span>
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Fase Body berdasarkan isGroupFinalized */}
        {!isGroupFinalized ? (
          <TeacherGroupsTab
            mode="pembagian"
            roomData={roomData}
            updateRoomData={updateRoomData}
            onFinalizeGroups={handleFinalizeGroups}
          />
        ) : (
          <div className="space-y-6">
            <TeacherGroupsTab
              mode="pantauan"
              roomData={roomData}
              updateRoomData={updateRoomData}
              onInspectGroup={handleInspectGroup}
            />

            <div id="grading-section" className="scroll-mt-6">
              <TeacherGradingTab
                roomData={roomData}
                updateRoomData={updateRoomData}
                selectedGroupFilter={selectedGroupFilter}
                onChangeGroupFilter={handleGroupFilterChange}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default TeacherRoomDetail;
