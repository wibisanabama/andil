import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useRoomData } from '../../utils/storageSync';
import { TeacherGroupsTab } from './TeacherGroupsTab';
import { TeacherGradingTab } from './TeacherGradingTab';

/**
 * TeacherRoomDetail
 * Halaman detail room untuk Guru (/guru/room) dengan alur 2 fase otomatis
 * berdasarkan properti boolean room.isGroupFinalized di database Supabase:
 * 1. Fase Pembagian Kelompok (isGroupFinalized === false)
 * 2. Fase Pantauan & Penilaian Kelompok (isGroupFinalized === true)
 */
export function TeacherRoomDetail() {
  const [searchParams, setSearchParams] = useSearchParams();
  const roomCodeParam = searchParams.get('code') || '';
  const [roomData, updateRoomData] = useRoomData(roomCodeParam);

  const [selectedGroupFilter, setSelectedGroupFilter] = useState(
    () => searchParams.get('group') || 'ALL'
  );
  const [copied, setCopied] = useState(false);

  const room = roomData?.room || null;
  const students = roomData?.students || [];
  const groups = roomData?.groups || [];

  if (!room) {
    return (
      <main className="bg-[#F8FAFD] min-h-[calc(100vh-72px)] py-12 px-4 sm:px-8">
        <div className="max-w-[680px] mx-auto bg-white rounded-[28px] border border-[#E2E8F0] p-10 text-center space-y-4 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
          <div className="w-12 h-12 rounded-2xl bg-[#D3E3FD] text-[#0B57D0] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
              meeting_room
            </span>
          </div>
          <h1 className="text-[22px] font-extrabold text-[#0F172A]">
            Belum Ada Room yang Dipilih
          </h1>
          <p className="text-[13.5px] text-[#64748B]">
            Silakan pilih Room dari daftar Room Anda atau buat Room tugas kelompok baru terlebih dahulu.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/guru"
              className="bg-[#F0F4F9] hover:bg-[#E2E8F0] text-[#0F172A] border border-[#E2E8F0] font-bold text-[13.5px] px-5 py-3 rounded-full inline-flex items-center gap-2 transition-colors no-underline"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Daftar Room</span>
            </Link>
            <Link
              to="/guru/buat-room"
              className="bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-[13.5px] px-5 py-3 rounded-full inline-flex items-center gap-2 transition-colors shadow-xs no-underline"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Buat Room Baru</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isGroupFinalized = Boolean(room.isGroupFinalized);
  const capacitiesLabel =
    groups.length > 0 ? groups.map((g) => g.capacity).join('-') : '-';

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
                {room.deadlineLabel && room.deadlineLabel !== '-'
                  ? `Deadline: ${room.deadlineLabel} • `
                  : ''}
                Peserta Terdaftar: {students.length}/{room.plannedStudentCount} Siswa dalam{' '}
                {groups.length} Kelompok ({capacitiesLabel})
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
