import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useRoomData } from '../../utils/storageSync';
import { TeacherGroupsTab } from './TeacherGroupsTab';
import { TeacherGradingTab } from './TeacherGradingTab';

/**
 * TeacherRoomDetail
 * Halaman detail room untuk Guru (/guru/room) dengan 3 sub-tab:
 * 1. Pembagian Kelompok (Sub-Tab 1)
 * 2. Pantauan Kelompok (Sub-Tab 2)
 * 3. Penilaian Urut Absen (Sub-Tab 3 - TeacherGradingTab)
 *
 * Sesuai referensi visual:
 * - 04_Guru_Tab1_Pembagian_Kelompok.png
 * - 05_Guru_Tab2_Pantauan_Kelompok.png
 * - 06_Guru_Tab3_Penilaian_Individu_Absen.png
 */
export function TeacherRoomDetail() {
  const [roomData, updateRoomData] = useRoomData();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get('tab') || 'pembagian';
  const [activeTab, setActiveTab] = useState(initialTab);
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
  };

  const students = roomData?.students || [];
  const groups = roomData?.groups || [];

  const capacitiesLabel =
    groups.length > 0
      ? groups.map((g) => g.capacity).join('-')
      : '5-5-4-4-4-4-4';

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', nextTab);
      return next;
    });
  };

  // Callback dari Pantauan Kelompok (Periksa & Nilai ->) menuju Sub-Tab 3
  const handleInspectGroup = (groupId) => {
    setSelectedGroupFilter(groupId);
    setActiveTab('penilaian');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'penilaian');
      next.set('group', groupId);
      return next;
    });
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

  // Toggle kunci deadline di LocalStorage
  const handleToggleDeadlineLock = () => {
    if (!updateRoomData) return;
    updateRoomData((prev) => ({
      ...prev,
      room: {
        ...prev.room,
        isDeadlineLocked: !prev.room?.isDeadlineLocked,
      },
    }));
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
      <div className="max-w-[1280px] mx-auto">
        {/* Top Room Header Card */}
        <header className="bg-white rounded-[28px] border border-[#E2E8F0] p-7 shadow-[0_2px_12px_rgba(15,23,42,0.03)] mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left side */}
            <div>
              {/* Top Meta Row */}
              <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                <Link
                  to="/guru"
                  className="text-[#0B57D0] hover:underline font-bold text-[13px] inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                    arrow_back
                  </span>
                  <span>Daftar Room</span>
                </Link>
                <span className="text-[#CBD5E1]" aria-hidden="true">
                  •
                </span>
                <span className="bg-[#D3E3FD] text-[#0B57D0] font-extrabold text-[12.5px] px-3.5 py-1 rounded-full">
                  Kode Room: {room.code}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="bg-[#F0F4F9] hover:bg-[#E2E8F0] text-[#0F172A] font-semibold text-[12px] px-3 py-1 rounded-full inline-flex items-center gap-1.5 cursor-pointer transition-colors"
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
                {room.title} — {room.taskTitle}
              </h1>

              {/* Subtitle Info */}
              <p className="text-[13.5px] text-[#64748B] mt-1.5">
                Deadline: {room.deadlineLabel || '12 Nov 2026, 23:59'} • Kapasitas:{' '}
                {students.length} Siswa dalam {groups.length} Kelompok ({capacitiesLabel})
              </p>
            </div>

            {/* Right side */}
            <div className="flex flex-col sm:items-end justify-between gap-3">
              {/* Deadline Lock Toggle Button */}
              <button
                type="button"
                onClick={handleToggleDeadlineLock}
                className={
                  room.isDeadlineLocked
                    ? 'bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA] font-bold text-[13px] px-4 py-2 rounded-full inline-flex items-center gap-2 cursor-pointer transition-colors shadow-2xs'
                    : 'bg-white hover:bg-[#F8FAFD] text-[#0F172A] border border-[#CBD5E1] font-bold text-[13px] px-4 py-2 rounded-full inline-flex items-center gap-2 cursor-pointer transition-colors shadow-2xs'
                }
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  {room.isDeadlineLocked ? 'lock' : 'lock_open'}
                </span>
                <span>
                  {room.isDeadlineLocked ? 'Kunci Deadline (ON)' : 'Kunci Deadline (OFF)'}
                </span>
              </button>

              {/* M3 Segmented Button (3 Sub-Tabs) */}
              <div className="bg-[#F0F4F9] p-1 rounded-full border border-[#E2E8F0] inline-flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleTabChange('pembagian')}
                  className={
                    activeTab === 'pembagian'
                      ? 'bg-[#D3E3FD] text-[#041E49] font-extrabold px-4 py-2 rounded-full text-[13px] inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs'
                      : 'text-[#475569] hover:text-[#0F172A] font-semibold px-4 py-2 rounded-full text-[13px] inline-flex items-center gap-1.5 transition-colors cursor-pointer'
                  }
                >
                  <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                    groups
                  </span>
                  <span>1. Pembagian Kelompok</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('pantauan')}
                  className={
                    activeTab === 'pantauan'
                      ? 'bg-[#D3E3FD] text-[#041E49] font-extrabold px-4 py-2 rounded-full text-[13px] inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs'
                      : 'text-[#475569] hover:text-[#0F172A] font-semibold px-4 py-2 rounded-full text-[13px] inline-flex items-center gap-1.5 transition-colors cursor-pointer'
                  }
                >
                  <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                    view_kanban
                  </span>
                  <span>2. Pantauan Kelompok</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('penilaian')}
                  className={
                    activeTab === 'penilaian'
                      ? 'bg-[#D3E3FD] text-[#041E49] font-extrabold px-4 py-2 rounded-full text-[13px] inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs'
                      : 'text-[#475569] hover:text-[#0F172A] font-semibold px-4 py-2 rounded-full text-[13px] inline-flex items-center gap-1.5 transition-colors cursor-pointer'
                  }
                >
                  <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                    fact_check
                  </span>
                  <span>3. Penilaian (Urut Absen)</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Body */}
        {activeTab === 'pembagian' || activeTab === 'pantauan' ? (
          <TeacherGroupsTab
            activeTab={activeTab}
            roomData={roomData}
            updateRoomData={updateRoomData}
            onInspectGroup={handleInspectGroup}
          />
        ) : (
          <TeacherGradingTab
            roomData={roomData}
            updateRoomData={updateRoomData}
            selectedGroupFilter={selectedGroupFilter}
            onChangeGroupFilter={handleGroupFilterChange}
          />
        )}
      </div>
    </main>
  );
}

export default TeacherRoomDetail;
