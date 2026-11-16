import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  useRoomData,
  fetchRoomDataFromSupabase,
  approveLateStudentInSupabase,
  rejectLateStudentInSupabase,
  updateStudentRoleInSupabase,
} from '../../utils/storageSync';
import { TeacherGroupsTab } from './TeacherGroupsTab';

/**
 * TeacherRoomDetail
 * Halaman detail room untuk Guru (/guru/room) dengan alur otomatis
 * berdasarkan properti boolean room.isGroupFinalized di database Supabase:
 * 1. Fase Pembagian Kelompok (isGroupFinalized === false)
 * 2. Fase Pantauan Kelompok + Halaman Persetujuan Siswa Terlambat (isGroupFinalized === true)
 * Penilaian Individu berada di halaman terpisah (/guru/room/nilai).
 */
export function TeacherRoomDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomCodeParam = searchParams.get('code') || '';
  const [roomData, updateRoomData] = useRoomData(roomCodeParam);

  const [activeView, setActiveView] = useState('main'); // 'main' | 'late'
  const [processingStudentId, setProcessingStudentId] = useState('');
  const [approvingStudent, setApprovingStudent] = useState(null);
  const [approveMode, setApproveMode] = useState('auto'); // 'auto' | 'manual'
  const [manualGroupId, setManualGroupId] = useState('');
  const [isRoleManagerOpen, setIsRoleManagerOpen] = useState(false);
  const [newRoomRoleInput, setNewRoomRoleInput] = useState('');
  const [copied, setCopied] = useState(false);

  const room = roomData?.room || null;
  const allStudents = roomData?.students || [];
  const groups = roomData?.groups || [];

  // Sinkronisasi berkala agar siswa yang baru join atau telat masuk langsung terlihat oleh Guru
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
              meeting_room
            </span>
          </div>
          <h1 className="text-[22px] font-extrabold text-[#1B3B6F]">
            Belum Ada Room yang Dipilih
          </h1>
          <p className="text-[13.5px] text-[#64748B]">
            Silakan pilih Room dari daftar Room Anda atau buat Room tugas kelompok baru terlebih dahulu.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/guru"
              className="bg-[#EDF5FD] hover:bg-[#DCE8F5] text-[#1B3B6F] border border-[#DCE8F5] font-bold text-[13.5px] px-5 py-3 rounded-full inline-flex items-center gap-2 transition-colors no-underline"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Daftar Room</span>
            </Link>
            <Link
              to="/guru/buat-room"
              className="bg-[#2563EB] hover:bg-[#1B3B6F] text-white font-bold text-[13.5px] px-5 py-3 rounded-full inline-flex items-center gap-2 transition-colors shadow-xs no-underline"
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

  // Daftar peran yang tersedia di Room ini (minimal Ketua Kelompok & Anggota)
  const rawRoomRoles = Array.isArray(room.availableRoles) ? room.availableRoles : [];
  const customRoomRoles = rawRoomRoles.filter(
    (r) =>
      r &&
      r.trim().toLowerCase() !== 'ketua kelompok' &&
      r.trim().toLowerCase() !== 'anggota'
  );
  const normalizedRoomRoles = ['Ketua Kelompok', 'Anggota', ...customRoomRoles];

  const handleAddRoomRole = (e) => {
    if (e) e.preventDefault();
    const trimmed = newRoomRoleInput.trim();
    if (
      !trimmed ||
      trimmed.toLowerCase() === 'ketua kelompok' ||
      trimmed.toLowerCase() === 'anggota' ||
      customRoomRoles.some((r) => r.toLowerCase() === trimmed.toLowerCase())
    ) {
      return;
    }

    const updatedRoles = ['Ketua Kelompok', 'Anggota', ...customRoomRoles, trimmed];
    updateRoomData((prev) => ({
      ...prev,
      room: {
        ...prev.room,
        availableRoles: updatedRoles,
      },
    }));
    setNewRoomRoleInput('');
  };

  const handleRemoveRoomRole = async (roleToRemove) => {
    const nextCustom = customRoomRoles.filter((r) => r !== roleToRemove);
    const updatedRoles = ['Ketua Kelompok', 'Anggota', ...nextCustom];

    // Siswa yang sebelumnya memilih peran yang dihapus dialihkan ke peran wajib 'Anggota'
    const affectedStudents = allStudents.filter((s) => s.role === roleToRemove);

    updateRoomData((prev) => ({
      ...prev,
      room: {
        ...prev.room,
        availableRoles: updatedRoles,
      },
      students: (prev.students || []).map((s) =>
        s.role === roleToRemove ? { ...s, role: 'Anggota' } : s
      ),
    }));

    for (const st of affectedStudents) {
      await updateStudentRoleInSupabase(st.id, 'Anggota');
    }
  };

  // Siswa yang sudah disetujui masuk kelompok
  const approvedStudents = allStudents.filter(
    (s) => (s.joinStatus || 'approved') === 'approved'
  );

  // Daftar seluruh siswa yang masuk terlambat (setelah guru menyelesaikan pembagian kelompok)
  const lateStudents = allStudents.filter(
    (s) =>
      Boolean(s.isLate) ||
      s.joinStatus === 'pending_late' ||
      s.joinStatus === 'rejected'
  );
  const pendingLateStudents = lateStudents.filter(
    (s) => s.joinStatus === 'pending_late'
  );

  // Kelompok yang kapasitas anggotanya masih belum terpenuhi
  const underfilledGroups = groups.filter((g) => {
    const count = approvedStudents.filter((s) => s.groupId === g.id).length;
    return count < (Number(g.capacity) || 4);
  });

  const nextTargetGroup =
    underfilledGroups[0] ||
    [...groups].sort((a, b) => {
      const countA = approvedStudents.filter((s) => s.groupId === a.id).length;
      const countB = approvedStudents.filter((s) => s.groupId === b.id).length;
      return countA - countB;
    })[0] ||
    null;

  const handleFinalizeGroups = () => {
    if (!updateRoomData) return;
    setActiveView('main');
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
    setActiveView('main');
    updateRoomData((prev) => ({
      ...prev,
      room: {
        ...prev.room,
        isGroupFinalized: false,
      },
    }));
  };

  const openApproveModal = (student) => {
    setApprovingStudent(student);
    setApproveMode('auto');
    const defaultManualId = underfilledGroups[0]?.id || groups[0]?.id || '';
    setManualGroupId(defaultManualId);
  };

  const handleConfirmApproveLate = async (e) => {
    if (e) e.preventDefault();
    if (!approvingStudent || processingStudentId) return;

    const studentId = approvingStudent.id;
    const chosenGroupId = approveMode === 'manual' ? manualGroupId : null;

    setProcessingStudentId(studentId);
    try {
      await approveLateStudentInSupabase(studentId, room.code, chosenGroupId);
      setApprovingStudent(null);
    } finally {
      setProcessingStudentId('');
    }
  };

  const handleRejectLate = async (studentId) => {
    if (processingStudentId) return;
    setProcessingStudentId(studentId);
    try {
      await rejectLateStudentInSupabase(studentId, room.code);
    } finally {
      setProcessingStudentId('');
    }
  };

  const handleInspectGroup = (groupId) => {
    const codeQuery = room.code ? `code=${encodeURIComponent(room.code)}` : '';
    const groupQuery = groupId ? `&group=${encodeURIComponent(groupId)}` : '';
    navigate(`/guru/room/nilai?${codeQuery}${groupQuery}`);
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
    <main className="bg-[#F4F9FF] min-h-[calc(100vh-72px)] py-8 px-4 sm:px-8">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* Top Room Header Card */}
        <header className="bg-white rounded-[28px] border border-[#DCE8F5] p-7 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left side */}
            <div>
              {/* Top Meta Row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Link
                  to="/guru"
                  className="inline-flex items-center justify-center h-8 px-3.5 rounded-full bg-[#EDF5FD] hover:bg-[#DCE8F5] border border-[#DCE8F5] text-[#1B3B6F] font-bold text-[12.5px] leading-none gap-1.5 transition-colors no-underline"
                >
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                    arrow_back
                  </span>
                  <span>Daftar Room</span>
                </Link>
                <span className="inline-flex items-center justify-center h-8 px-3.5 rounded-full bg-[#E0F2FE] border border-[#BFDBFE] text-[#2563EB] font-bold text-[12.5px] leading-none">
                  Kode Room: {room.code}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center justify-center h-8 px-3.5 rounded-full bg-[#EDF5FD] hover:bg-[#DCE8F5] border border-[#DCE8F5] text-[#1B3B6F] font-bold text-[12.5px] leading-none gap-1.5 cursor-pointer transition-colors"
                  title="Salin Kode Room"
                >
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>
              </div>

              {/* Main Heading */}
              <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#1B3B6F] leading-tight">
                {room.title}: {room.taskTitle}
              </h1>

              {/* Subtitle Info */}
              <p className="text-[13.5px] text-[#64748B] mt-1.5">
                {room.deadlineLabel && room.deadlineLabel !== '-'
                  ? `Deadline: ${room.deadlineLabel} • `
                  : ''}
                Peserta di Kelompok: {approvedStudents.length}/{room.plannedStudentCount} Siswa dalam{' '}
                {groups.length} Kelompok ({capacitiesLabel})
              </p>
            </div>

            {/* Right side: Status Fase & Tombol Aksi Kontekstual */}
            <div className="flex flex-wrap items-center lg:justify-end gap-2.5 shrink-0">
              {/* Tombol Kelola Peran Kelompok (Selalu Tersedia Walau Room Sudah Dibuat) */}
              <button
                type="button"
                onClick={() => setIsRoleManagerOpen((prev) => !prev)}
                className={`inline-flex items-center justify-center h-9 px-4 rounded-full font-bold text-[12.5px] leading-none gap-1.5 cursor-pointer transition-colors border ${
                  isRoleManagerOpen
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-[#EDF5FD] hover:bg-[#DCE8F5] text-[#1B3B6F] border-[#DCE8F5]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  badge
                </span>
                <span>Kelola Peran ({normalizedRoomRoles.length})</span>
              </button>

              {isGroupFinalized ? (
                <>
                  {/* Tombol Halaman Pantauan & Penilaian vs Halaman Siswa Terlambat */}
                  <button
                    type="button"
                    onClick={() => setActiveView(activeView === 'late' ? 'main' : 'late')}
                    className={`inline-flex items-center justify-center h-9 px-4 rounded-full font-bold text-[12.5px] leading-none gap-2 cursor-pointer transition-colors border ${
                      activeView === 'late'
                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                        : pendingLateStudents.length > 0
                        ? 'bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] border-[#FCD34D]'
                        : 'bg-[#EDF5FD] hover:bg-[#DCE8F5] text-[#1B3B6F] border-[#DCE8F5]'
                    }`}
                  >
                    {pendingLateStudents.length > 0 && activeView !== 'late' && (
                      <span className="w-2 h-2 rounded-full bg-[#D97706] animate-ping" />
                    )}
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                      schedule
                    </span>
                    <span>
                      Siswa Terlambat ({pendingLateStudents.length})
                    </span>
                  </button>

                  {activeView === 'late' && (
                    <button
                      type="button"
                      onClick={() => setActiveView('main')}
                      className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-[#D1FAE5] hover:bg-[#A7F3D0] text-[#047857] font-bold text-[12.5px] leading-none gap-1.5 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                        verified
                      </span>
                      <span>Kembali ke Pantauan &amp; Penilaian</span>
                    </button>
                  )}

                  <Link
                    to={`/guru/room/nilai?code=${encodeURIComponent(room.code)}`}
                    className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-[#2563EB] hover:bg-[#1B3B6F] text-white font-bold text-[12.5px] leading-none gap-1.5 transition-colors no-underline shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                      fact_check
                    </span>
                    <span>Halaman Penilaian Individu</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleReopenGroupDivision}
                    className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-[#EDF5FD] hover:bg-[#DCE8F5] border border-[#DCE8F5] text-[#1B3B6F] font-bold text-[12.5px] leading-none gap-1.5 cursor-pointer transition-colors"
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

        {/* Panel Kelola Peran di Dalam Kelompok (Dapat Diubah Kapan Saja Walau Room Sudah Dibuat) */}
        {isRoleManagerOpen && (
          <section className="bg-white rounded-[28px] border border-[#DCE8F5] p-6 sm:p-7 shadow-[0_2px_12px_rgba(15,23,42,0.03)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-[17.5px] font-extrabold text-[#1B3B6F]">
                  Kelola Peran di Dalam Kelompok
                </h2>
                <p className="text-[13px] text-[#64748B] mt-0.5">
                  Minimal terdapat 2 peran wajib (<strong className="text-[#1B3B6F] font-bold">Ketua Kelompok</strong> dan <strong className="text-[#1B3B6F] font-bold">Anggota</strong>). Anda tetap dapat menambah atau menghapus peran tambahan meskipun Room sudah dibuat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRoleManagerOpen(false)}
                className="self-start sm:self-auto bg-[#EDF5FD] hover:bg-[#DCE8F5] text-[#334155] font-bold text-[12.5px] px-4 py-2 rounded-full inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  close
                </span>
                <span>Tutup</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <div className="bg-[#E0F2FE] text-[#1B3B6F] border border-[#93C5FD] font-bold text-[13px] px-4 py-2 rounded-full inline-flex items-center gap-2 select-none">
                <span className="material-symbols-outlined text-[16px] material-symbols-filled">
                  lock
                </span>
                <span>Ketua Kelompok (Wajib &amp; Maks 1)</span>
              </div>

              <div className="bg-[#E0F2FE] text-[#1B3B6F] border border-[#93C5FD] font-bold text-[13px] px-4 py-2 rounded-full inline-flex items-center gap-2 select-none">
                <span className="material-symbols-outlined text-[16px] material-symbols-filled">
                  lock
                </span>
                <span>Anggota (Wajib)</span>
              </div>

              {customRoomRoles.map((role) => (
                <div
                  key={role}
                  className="bg-[#EDF5FD] text-[#1B3B6F] border border-[#DCE8F5] font-semibold text-[13px] px-4 py-2 rounded-full inline-flex items-center gap-1.5"
                >
                  <span>{role}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRoomRole(role)}
                    className="text-[#64748B] hover:text-red-600 transition-colors inline-flex items-center justify-center cursor-pointer"
                    aria-label={`Hapus peran ${role}`}
                    title={`Hapus peran ${role}`}
                  >
                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                      close
                    </span>
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddRoomRole} className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <input
                type="text"
                value={newRoomRoleInput}
                onChange={(e) => setNewRoomRoleInput(e.target.value)}
                placeholder="Tambah peran baru (misal: Pembuat PPT, Pencari Materi, Presenter)..."
                className="flex-1 rounded-full border border-[#CBD5E1] bg-white px-5 py-2.5 text-[13.5px] text-[#1B3B6F] placeholder-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-hidden transition-all"
              />
              <button
                type="submit"
                className="bg-[#2563EB] hover:bg-[#1B3B6F] text-white font-bold text-[13px] px-5 py-2.5 rounded-full shrink-0 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                  add
                </span>
                <span>Tambah Peran</span>
              </button>
            </form>
          </section>
        )}

        {/* Banner Notifikasi Cepat bila ada Siswa Terlambat yang Menunggu Persetujuan saat di tampilan utama */}
        {isGroupFinalized && activeView === 'main' && pendingLateStudents.length > 0 && (
          <section className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[24px] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                  person_alert
                </span>
              </div>
              <div>
                <h2 className="text-[15.5px] font-extrabold text-[#92400E]">
                  Ada {pendingLateStudents.length} Siswa Terlambat Masuk Room yang Menunggu Persetujuan Anda
                </h2>
                <p className="text-[13px] text-[#B45309] mt-0.5">
                  Jika disetujui, siswa akan otomatis dimasukkan ke kelompok yang anggotanya belum terpenuhi
                  {nextTargetGroup ? ` (saat ini: ${nextTargetGroup.name})` : ''}.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('late')}
              className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-[13px] px-5 py-2.5 rounded-full inline-flex items-center justify-center gap-2 shrink-0 transition-colors cursor-pointer"
            >
              <span>Kelola Siswa Terlambat ({pendingLateStudents.length})</span>
              <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                arrow_forward
              </span>
            </button>
          </section>
        )}

        {/* Fase Body berdasarkan isGroupFinalized & activeView */}
        {!isGroupFinalized ? (
          <TeacherGroupsTab
            mode="pembagian"
            roomData={roomData}
            updateRoomData={updateRoomData}
            onFinalizeGroups={handleFinalizeGroups}
          />
        ) : activeView === 'late' ? (
          /* HALAMAN KHUSUS GURU: DAFTAR SISWA YANG TERLAMBAT MASUK ROOM */
          <section className="bg-white rounded-[28px] border border-[#DCE8F5] p-7 shadow-[0_2px_12px_rgba(15,23,42,0.03)] space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#F1F5F9]">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#FEF3C7] text-[#92400E] px-3 py-1 rounded-full text-[11.5px] font-extrabold mb-2">
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                    schedule
                  </span>
                  <span>Manajemen Siswa Terlambat Masuk Room</span>
                </div>
                <h2 className="text-[20px] font-extrabold text-[#1B3B6F]">
                  Daftar Siswa yang Terlambat Masuk Setelah Pembagian Kelompok
                </h2>
                <p className="text-[13.5px] text-[#64748B] mt-1">
                  Tentukan apakah siswa yang terlambat bergabung diizinkan masuk. Jika Anda klik{' '}
                  <strong className="text-[#1B3B6F] font-bold">Setujui (Approve)</strong>, sistem otomatis menempatkan siswa ke kelompok yang kuota anggotanya belum terpenuhi.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveView('main')}
                className="bg-[#EDF5FD] hover:bg-[#DCE8F5] border border-[#DCE8F5] text-[#1B3B6F] font-bold text-[13px] h-10 px-5 rounded-full inline-flex items-center gap-2 self-start lg:self-auto shrink-0 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  arrow_back
                </span>
                <span>Kembali ke Pantauan Kelompok</span>
              </button>
            </div>

            {/* Info Ringkasan Kelompok yang Belum Terpenuhi */}
            <div className="bg-[#F4F9FF] border border-[#DCE8F5] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-[13px] font-semibold text-[#334155]">
                <span className="material-symbols-outlined text-[19px] text-[#2563EB]" aria-hidden="true">
                  info
                </span>
                <span>
                  Kelompok yang kuotanya belum terpenuhi saat ini:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {underfilledGroups.length === 0 ? (
                  <span className="bg-[#DCE8F5] text-[#475569] text-[12px] font-bold px-3 py-1 rounded-full">
                    Semua kelompok sudah terisi penuh
                  </span>
                ) : (
                  underfilledGroups.map((g) => {
                    const count = approvedStudents.filter((s) => s.groupId === g.id).length;
                    return (
                      <span
                        key={g.id}
                        className="bg-[#E0F2FE] text-[#1B3B6F] text-[12px] font-bold px-3 py-1 rounded-full"
                      >
                        {g.name} ({count}/{g.capacity} siswa)
                      </span>
                    );
                  })
                )}
              </div>
            </div>

            {/* Daftar Siswa Terlambat */}
            {lateStudents.length === 0 ? (
              <div className="py-12 text-center bg-[#F4F9FF] rounded-2xl border border-dashed border-[#CBD5E1] space-y-2">
                <span
                  className="material-symbols-outlined text-[32px] text-[#94A3B8]"
                  aria-hidden="true"
                >
                  check_circle
                </span>
                <p className="text-[15px] font-extrabold text-[#1B3B6F]">
                  Tidak Ada Siswa yang Terlambat Masuk
                </p>
                <p className="text-[13px] text-[#64748B]">
                  Seluruh siswa yang bergabung setelah pembagian kelompok selesai akan muncul di daftar ini.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {lateStudents.map((student) => {
                  const absenStr = String(student.absen).padStart(2, '0');
                  const status = student.joinStatus || 'approved';
                  const assignedGrp = groups.find((g) => g.id === student.groupId);
                  const isBusy = processingStudentId === student.id;

                  return (
                    <div
                      key={student.id}
                      className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                        status === 'pending_late'
                          ? 'bg-[#FFFBEB] border-[#FDE68A]'
                          : status === 'approved'
                          ? 'bg-white border-[#DCE8F5]'
                          : 'bg-[#FEF2F2] border-[#FECACA]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-[#2563EB] text-white font-extrabold text-[15px] flex items-center justify-center shrink-0">
                          {absenStr}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[15.5px] font-extrabold text-[#1B3B6F]">
                              {student.name}
                            </h3>
                            <span className="text-[12px] font-bold text-[#64748B]">
                              (No. Absen {absenStr})
                            </span>
                            {status === 'pending_late' && (
                              <span className="bg-[#FEF3C7] border border-[#FCD34D] text-[#92400E] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                                Terlambat • Menunggu Persetujuan
                              </span>
                            )}
                            {status === 'approved' && (
                              <span className="bg-[#DCFCE7] border border-[#86EFAC] text-[#166534] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                                Disetujui • Masuk ke {assignedGrp?.name || 'Kelompok'}
                              </span>
                            )}
                            {status === 'rejected' && (
                              <span className="bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                                Ditolak oleh Guru
                              </span>
                            )}
                          </div>

                          <p className="text-[12.5px] text-[#64748B] mt-1">
                            {status === 'pending_late'
                              ? 'Klik Setujui (Approve) untuk memilih penempatan kelompok secara otomatis atau manual.'
                              : status === 'approved'
                              ? `Telah bergabung di ${assignedGrp?.name || 'Kelompok'}.`
                              : 'Siswa tidak diizinkan masuk ke kelompok.'}
                          </p>
                        </div>
                      </div>

                      {/* Tombol Aksi Guru: Setujui (Approve) / Tolak */}
                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        {status !== 'approved' && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => openApproveModal(student)}
                            className="bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-60 text-white font-bold text-[12.5px] px-4 py-2.5 rounded-full inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                              check_circle
                            </span>
                            <span>
                              {isBusy ? 'Memproses...' : 'Setujui (Approve)'}
                            </span>
                          </button>
                        )}

                        {status === 'pending_late' && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleRejectLate(student.id)}
                            className="bg-white hover:bg-[#FEE2E2] disabled:opacity-60 border border-[#FCA5A5] text-[#DC2626] font-bold text-[12.5px] px-4 py-2.5 rounded-full inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                              cancel
                            </span>
                            <span>Tolak</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <TeacherGroupsTab
            mode="pantauan"
            roomData={roomData}
            updateRoomData={updateRoomData}
            onInspectGroup={handleInspectGroup}
          />
        )}
      </div>

      {/* Modal Pilih Penempatan Kelompok Siswa Terlambat (Otomatis atau Manual) */}
      {approvingStudent && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="approve-late-modal-title"
          className="fixed inset-0 bg-[#1B3B6F]/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50"
        >
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-7 border border-[#DCE8F5] shadow-xl">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
                    how_to_reg
                  </span>
                </div>
                <div>
                  <h2 id="approve-late-modal-title" className="text-[18px] font-extrabold text-[#1B3B6F]">
                    Setujui Siswa Terlambat Masuk
                  </h2>
                  <p className="text-[12.5px] font-semibold text-[#64748B]">
                    Absen {String(approvingStudent.absen).padStart(2, '0')} • {approvingStudent.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovingStudent(null)}
                className="w-8 h-8 rounded-full bg-[#EDF5FD] hover:bg-[#DCE8F5] text-[#475569] flex items-center justify-center cursor-pointer"
                aria-label="Tutup modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmApproveLate} className="space-y-4">
              <p className="text-[13px] text-[#475569] leading-relaxed">
                Pilih cara penempatan kelompok untuk siswa yang terlambat bergabung ini:
              </p>

              {/* Opsi 1: Otomatis */}
              <div
                role="radio"
                aria-checked={approveMode === 'auto'}
                tabIndex={0}
                onClick={() => setApproveMode('auto')}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setApproveMode('auto');
                  }
                }}
                className={`rounded-2xl p-4 border-[1.5px] cursor-pointer transition-all flex items-start gap-3 select-none ${
                  approveMode === 'auto'
                    ? 'border-[#2563EB] bg-[#F4F9FF]'
                    : 'border-[#DCE8F5] bg-white hover:border-[#CBD5E1]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                    approveMode === 'auto' ? 'border-[#2563EB]' : 'border-[#CBD5E1]'
                  }`}
                >
                  {approveMode === 'auto' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                  )}
                </span>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-[#1B3B6F]">
                    Otomatis oleh Sistem
                  </p>
                  <p className="text-[12.5px] text-[#64748B] mt-0.5 leading-relaxed">
                    Sistem otomatis menempatkan siswa ke kelompok yang kuota anggotanya belum terpenuhi
                    {nextTargetGroup ? ` (saat ini: ${nextTargetGroup.name})` : ''}.
                  </p>
                </div>
              </div>

              {/* Opsi 2: Manual oleh Guru ke Kelompok yang Belum Terpenuhi */}
              <div
                role="radio"
                aria-checked={approveMode === 'manual'}
                tabIndex={0}
                onClick={() => setApproveMode('manual')}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setApproveMode('manual');
                  }
                }}
                className={`rounded-2xl p-4 border-[1.5px] cursor-pointer transition-all flex items-start gap-3 select-none ${
                  approveMode === 'manual'
                    ? 'border-[#2563EB] bg-[#F4F9FF]'
                    : 'border-[#DCE8F5] bg-white hover:border-[#CBD5E1]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                    approveMode === 'manual' ? 'border-[#2563EB]' : 'border-[#CBD5E1]'
                  }`}
                >
                  {approveMode === 'manual' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                  )}
                </span>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-[#1B3B6F]">
                    Manual oleh Guru (Pilih Kelompok yang Belum Terpenuhi)
                  </p>
                  <p className="text-[12.5px] text-[#64748B] mt-0.5 leading-relaxed">
                    Guru memilih langsung ke kelompok mana yang kuota anggotanya belum terpenuhi.
                  </p>

                  {approveMode === 'manual' && (
                    <div
                      className="mt-3 space-y-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label htmlFor="manual-late-group-select" className="block text-[12px] font-bold text-[#1B3B6F]">
                        Pilih Kelompok Tujuan (Belum Terpenuhi):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(underfilledGroups.length > 0 ? underfilledGroups : groups).map((g) => {
                          const count = approvedStudents.filter((s) => s.groupId === g.id).length;
                          const isSelectedGrp = manualGroupId === g.id;
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => setManualGroupId(g.id)}
                              className={`text-left px-3.5 py-2.5 rounded-xl border text-[12.5px] font-bold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                isSelectedGrp
                                  ? 'bg-[#E0F2FE] border-[#2563EB] text-[#1B3B6F]'
                                  : 'bg-white border-[#CBD5E1] text-[#334155] hover:border-[#2563EB]/50'
                              }`}
                            >
                              <span>{g.name}</span>
                              <span className="text-[11px] font-extrabold bg-white/80 px-2 py-0.5 rounded-full text-[#2563EB]">
                                {count}/{g.capacity} siswa
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setApprovingStudent(null)}
                  className="bg-[#EDF5FD] hover:bg-[#DCE8F5] text-[#334155] font-bold text-[13px] px-5 py-2.5 rounded-full cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={Boolean(processingStudentId) || (approveMode === 'manual' && !manualGroupId)}
                  className="bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-60 text-white font-bold text-[13px] px-6 py-2.5 rounded-full inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                    check_circle
                  </span>
                  <span>
                    {processingStudentId
                      ? 'Menyimpan...'
                      : 'Konfirmasi & Masukkan ke Kelompok'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default TeacherRoomDetail;
