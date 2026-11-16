import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createOrUpdateRoomInSupabase } from '../../utils/storageSync';
import { calculateGroupCapacities, DEFAULT_GROUP_ROLES } from '../../utils/groupAllocator';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ANDIL-${suffix}`;
}

export function TeacherCreateRoom() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [roomCode, setRoomCode] = useState(() => generateRoomCode());
  const [roomTitle, setRoomTitle] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [deadlineLabel, setDeadlineLabel] = useState('');
  const [studentCount, setStudentCount] = useState(30);
  const [groupCount, setGroupCount] = useState(6);
  const [divisionMethod, setDivisionMethod] = useState('auto');

  const [otherRoles, setOtherRoles] = useState(() =>
    DEFAULT_GROUP_ROLES.filter(
      (role) => role !== 'Ketua Kelompok' && role !== 'Anggota'
    )
  );
  const [newRoleInput, setNewRoleInput] = useState('');

  const parsedStudentCount = parseInt(studentCount, 10) || 0;
  const parsedGroupCount = parseInt(groupCount, 10) || 0;
  const minRequiredStudents = Math.max(2, parsedGroupCount * 2);
  const isCapacityValid =
    parsedGroupCount >= 1 &&
    parsedGroupCount <= 20 &&
    parsedStudentCount >= minRequiredStudents &&
    parsedStudentCount <= 100;

  const safeStudentCount = Math.max(2, parsedStudentCount || 2);
  const safeGroupCount = Math.max(1, Math.min(20, parsedGroupCount || 1));

  const calculatedGroups = useMemo(
    () =>
      isCapacityValid
        ? calculateGroupCapacities(parsedStudentCount, parsedGroupCount, roomCode.trim())
        : [],
    [isCapacityValid, parsedStudentCount, parsedGroupCount, roomCode]
  );

  const handleAddRole = () => {
    const trimmed = newRoleInput.trim();
    if (
      trimmed &&
      trimmed.toLowerCase() !== 'ketua kelompok' &&
      trimmed.toLowerCase() !== 'anggota' &&
      !otherRoles.some((r) => r.toLowerCase() === trimmed.toLowerCase())
    ) {
      setOtherRoles((prev) => [...prev, trimmed]);
      setNewRoleInput('');
    }
  };

  const handleKeyDownRole = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRole();
    }
  };

  const handleRemoveRole = (roleToRemove) => {
    setOtherRoles((prev) => prev.filter((r) => r !== roleToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Kode Room wajib diisi.');
      return;
    }
    if (!roomTitle.trim() || !taskTitle.trim()) {
      setErrorMessage('Judul Room Kelas dan Judul Tugas Kelompok wajib diisi.');
      return;
    }
    if (!isCapacityValid) {
      setErrorMessage(
        `Setiap kelompok wajib minimal terdiri dari 2 siswa. Untuk ${Math.max(1, parsedGroupCount)} kelompok, target jumlah siswa minimal ${minRequiredStudents} orang.`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await createOrUpdateRoomInSupabase({
        code: cleanCode,
        title: roomTitle.trim(),
        taskTitle: taskTitle.trim(),
        description: taskDesc.trim(),
        deadlineLabel: deadlineLabel.trim(),
        plannedStudentCount: parsedStudentCount,
        groupCount: parsedGroupCount,
        divisionMethod: divisionMethod,
        availableRoles: ['Ketua Kelompok', 'Anggota', ...otherRoles],
        calculatedGroups,
      });

      navigate(`/guru/room?code=${encodeURIComponent(cleanCode)}`);
    } catch (err) {
      console.error('Gagal membuat Room:', err);
      setErrorMessage('Gagal menyimpan Room ke database Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-[#F4F9FF] min-h-[calc(100vh-72px)] py-7 px-4 sm:px-8">
      <div className="max-w-[1180px] mx-auto space-y-6">
        {/* Top Header Card */}
        <section className="bg-white rounded-[28px] border border-[#DCE8F5] px-7 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
          <div>
            <h1 className="text-[26px] sm:text-[28px] font-extrabold text-[#1B3B6F] tracking-tight">
              Buat Room Tugas Kelompok Baru
            </h1>
            <p className="text-[14px] text-[#64748B] mt-1">
              Isi informasi tugas, periksa pratinjau pembagian anggota otomatis, dan tentukan daftar peran kelompok.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              to="/guru"
              className="bg-[#EDF5FD] hover:bg-[#DCE8F5] text-[#1B3B6F] font-bold text-[13px] px-4 py-2.5 rounded-full inline-flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                arrow_back
              </span>
              <span>Kembali</span>
            </Link>
          </div>
        </section>

        {/* Main 12-Column Grid */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (col-span-7) */}
          <div className="lg:col-span-7 bg-white rounded-[28px] border border-[#DCE8F5] p-7 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
            {/* Section A: Informasi Room & Tugas */}
            <div>
              <h2 className="text-[17.5px] font-extrabold text-[#1B3B6F] mb-5">
                A. Informasi Room &amp; Tugas
              </h2>

              {/* Kode Room */}
              <div className="mb-4">
                <label htmlFor="input-room-code" className="block text-[13px] font-bold text-[#1B3B6F] mb-1.5">
                  Kode Room (Dibagikan ke Siswa)
                </label>
                <div className="flex gap-2">
                  <input
                    id="input-room-code"
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: ANDIL-X1A"
                    required
                    className="flex-1 rounded-2xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] font-extrabold text-[#2563EB] tracking-wide placeholder-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setRoomCode(generateRoomCode())}
                    className="bg-[#EDF5FD] hover:bg-[#DCE8F5] border border-[#DCE8F5] text-[#1B3B6F] font-bold text-[12.5px] px-4 rounded-2xl inline-flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                      refresh
                    </span>
                    <span>Kode Baru</span>
                  </button>
                </div>
              </div>

              {/* 2-col Row: Judul Room & Judul Tugas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="input-room-title" className="block text-[13px] font-bold text-[#1B3B6F] mb-1.5">
                    Judul Room Kelas
                  </label>
                  <input
                    id="input-room-title"
                    type="text"
                    value={roomTitle}
                    onChange={(e) => setRoomTitle(e.target.value)}
                    placeholder="Contoh: Informatika Kelas XI-1"
                    required
                    className="w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] text-[#1B3B6F] placeholder-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor="input-task-title" className="block text-[13px] font-bold text-[#1B3B6F] mb-1.5">
                    Judul Tugas Kelompok
                  </label>
                  <input
                    id="input-task-title"
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Contoh: Presentasi Perkembangan Teknologi"
                    required
                    className="w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] text-[#1B3B6F] placeholder-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all outline-hidden"
                  />
                </div>
              </div>

              {/* Full-width Row: Deskripsi Tugas */}
              <div className="mb-4">
                <label htmlFor="input-task-desc" className="block text-[13px] font-bold text-[#1B3B6F] mb-1.5">
                  Deskripsi Tugas
                </label>
                <textarea
                  id="input-task-desc"
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Tuliskan instruksi pengerjaan tugas kelompok..."
                  className="w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] text-[#1B3B6F] placeholder-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all outline-hidden resize-y min-h-[96px]"
                />
              </div>

              {/* 3-col Row: Deadline, Jumlah Siswa, Jumlah Kelompok */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="input-deadline" className="block text-[13px] font-bold text-[#1B3B6F] mb-1.5">
                    Deadline Pengumpulan
                  </label>
                  <input
                    id="input-deadline"
                    type="date"
                    value={deadlineLabel}
                    onChange={(e) => setDeadlineLabel(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-[#CBD5E1] bg-white px-4 py-3 text-[14px] font-semibold text-[#1B3B6F] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor="input-students" className="block text-[13px] font-bold text-[#1B3B6F] mb-1.5">
                    Target Jumlah Siswa (Min. {minRequiredStudents})
                  </label>
                  <input
                    id="input-students"
                    type="number"
                    min={minRequiredStudents}
                    max={100}
                    value={studentCount}
                    onChange={(e) => {
                      setStudentCount(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    required
                    className={`w-full rounded-2xl border bg-white px-4 py-3 text-[14px] font-bold text-[#1B3B6F] placeholder-[#94A3B8] focus:ring-2 transition-all outline-hidden ${
                      !isCapacityValid
                        ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                        : 'border-[#CBD5E1] focus:border-[#2563EB] focus:ring-[#2563EB]/20'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="input-groups" className="block text-[13px] font-bold text-[#1B3B6F] mb-1.5">
                    Jumlah Kelompok (Min. 1)
                  </label>
                  <input
                    id="input-groups"
                    type="number"
                    min={1}
                    max={Math.max(1, Math.min(20, Math.floor(safeStudentCount / 2)))}
                    value={groupCount}
                    onChange={(e) => {
                      setGroupCount(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    required
                    className={`w-full rounded-2xl border bg-white px-4 py-3 text-[14px] font-bold text-[#1B3B6F] placeholder-[#94A3B8] focus:ring-2 transition-all outline-hidden ${
                      !isCapacityValid
                        ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                        : 'border-[#CBD5E1] focus:border-[#2563EB] focus:ring-[#2563EB]/20'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="my-7 border-t border-[#DCE8F5]" />

            {/* Section B: Daftar Peran di Dalam Kelompok */}
            <div>
              <h2 className="text-[17.5px] font-extrabold text-[#1B3B6F] mb-2">
                B. Daftar Peran di Dalam Kelompok (Minimal 2 Peran: Ketua &amp; Anggota)
              </h2>
              <p className="text-[13px] text-[#64748B] leading-relaxed">
                Minimal terdapat 2 peran wajib yaitu <strong className="text-[#1B3B6F] font-bold">Ketua Kelompok</strong> (maksimal 1 orang per kelompok) dan <strong className="text-[#1B3B6F] font-bold">Anggota</strong>. Anda dapat menambahkan atau menghapus peran tambahan baik sekarang maupun setelah Room dibuat.
              </p>

              {/* Roles Badges / Chips */}
              <div className="flex flex-wrap gap-2.5 mt-4">
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

                {otherRoles.map((role) => (
                  <div
                    key={role}
                    className="bg-[#EDF5FD] text-[#1B3B6F] border border-[#DCE8F5] font-semibold text-[13px] px-4 py-2 rounded-full inline-flex items-center gap-1.5"
                  >
                    <span>{role}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(role)}
                      className="text-[#64748B] hover:text-red-600 transition-colors inline-flex items-center justify-center cursor-pointer"
                      aria-label={`Hapus peran ${role}`}
                    >
                      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                        close
                      </span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom Role Input */}
              <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={newRoleInput}
                  onChange={(e) => setNewRoleInput(e.target.value)}
                  onKeyDown={handleKeyDownRole}
                  placeholder="Tambah peran lain (misal: Editor Video, Programmer)..."
                  className="flex-1 rounded-full border border-[#CBD5E1] bg-white px-5 py-2.5 text-[13.5px] text-[#1B3B6F] placeholder-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-hidden transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddRole}
                  className="bg-[#E0F2FE] hover:bg-[#C2E7FF] text-[#1B3B6F] font-bold text-[13px] px-5 py-2.5 rounded-full shrink-0 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                    add
                  </span>
                  <span>Tambah Peran</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Card C: Pratinjau Pembagian Anggota */}
            <div className="bg-[#EDF5FD] rounded-[28px] border border-[#DCE8F5] p-6">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h2 className="text-[16.5px] font-extrabold text-[#1B3B6F]">
                  C. Pratinjau Pembagian Anggota
                </h2>
                <span
                  className={`font-extrabold text-[12px] px-3 py-1 rounded-full whitespace-nowrap inline-flex items-center gap-1 ${
                    isCapacityValid
                      ? 'bg-[#E0F2FE] text-[#2563EB]'
                      : 'bg-[#FEE2E2] text-[#DC2626]'
                  }`}
                >
                  <span>{parsedStudentCount} Siswa</span>
                  <span className="material-symbols-outlined text-[13px]" aria-hidden="true">
                    arrow_forward
                  </span>
                  <span>{parsedGroupCount} Kelompok</span>
                </span>
              </div>
              <p className="text-[12.5px] text-[#64748B] mb-4">
                Sistem otomatis menghitung kapasitas setiap kelompok secara seimbang (minimal 2 siswa per kelompok):
              </p>

              {/* Capacities Table or Validation Notice */}
              {!isCapacityValid ? (
                <div className="bg-[#FEF2F2] rounded-2xl border border-[#FECACA] p-4 text-[13px] text-[#DC2626] font-semibold leading-relaxed">
                  Setiap kelompok wajib terdiri dari minimal <strong>2 orang</strong> agar dapat bekerja secara berkelompok. Untuk{' '}
                  <strong>{Math.max(1, parsedGroupCount)} kelompok</strong>, silakan isi Target Jumlah Siswa minimal{' '}
                  <strong>{minRequiredStudents} siswa</strong>.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#DCE8F5] overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[#DCE8F5] bg-[#F4F9FF] flex justify-between text-[12px] font-bold text-[#475569]">
                    <span>Kelompok</span>
                    <span>Kapasitas Anggota</span>
                  </div>
                  <div className="divide-y divide-[#F1F5F9]">
                    {calculatedGroups.map((grp) => (
                      <div
                        key={grp.id}
                        className="px-4 py-2.5 flex justify-between text-[13px] items-center hover:bg-[#F4F9FF] transition-colors"
                      >
                        <span className="font-semibold text-[#1B3B6F]">{grp.name}</span>
                        <span className="font-extrabold text-[#2563EB]">{grp.capacity} orang</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 bg-[#EDF5FD]/60 border-t border-[#DCE8F5] flex justify-between text-[13px] font-extrabold text-[#1B3B6F]">
                    <span>Total Kapasitas</span>
                    <span>{parsedStudentCount} orang</span>
                  </div>
                </div>
              )}
            </div>

            {/* Card D: Metode Pembagian Kelompok */}
            <div className="bg-white rounded-[28px] border border-[#DCE8F5] p-6 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
              <h2 className="text-[16.5px] font-extrabold text-[#1B3B6F] mb-4">
                D. Metode Pembagian Kelompok
              </h2>

              <div
                role="radio"
                aria-checked={divisionMethod === 'auto'}
                tabIndex={0}
                onClick={() => setDivisionMethod('auto')}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setDivisionMethod('auto');
                  }
                }}
                className={`rounded-2xl p-4 border-[1.5px] cursor-pointer transition-all flex items-start gap-3 select-none ${
                  divisionMethod === 'auto'
                    ? 'border-[#2563EB] bg-[#F4F9FF]'
                    : 'border-[#DCE8F5] bg-white hover:border-[#CBD5E1]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                    divisionMethod === 'auto' ? 'border-[#2563EB]' : 'border-[#CBD5E1]'
                  }`}
                >
                  {divisionMethod === 'auto' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                  )}
                </span>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-[#1B3B6F]">
                    Otomatis oleh Sistem (Acak Seimbang)
                  </p>
                  <p className="text-[12.5px] text-[#64748B] mt-0.5 leading-relaxed">
                    Sistem langsung membagi siswa secara acak dan proporsional mengikuti kapasitas masing-masing kelompok.
                  </p>
                </div>
              </div>

              <div
                role="radio"
                aria-checked={divisionMethod === 'manual'}
                tabIndex={0}
                onClick={() => setDivisionMethod('manual')}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setDivisionMethod('manual');
                  }
                }}
                className={`mt-3 rounded-2xl p-4 border-[1.5px] cursor-pointer transition-all flex items-start gap-3 select-none ${
                  divisionMethod === 'manual'
                    ? 'border-[#2563EB] bg-[#F4F9FF]'
                    : 'border-[#DCE8F5] bg-white hover:border-[#CBD5E1]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                    divisionMethod === 'manual' ? 'border-[#2563EB]' : 'border-[#CBD5E1]'
                  }`}
                >
                  {divisionMethod === 'manual' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                  )}
                </span>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-[#1B3B6F]">
                    Manual oleh Guru
                  </p>
                  <p className="text-[12.5px] text-[#64748B] mt-0.5 leading-relaxed">
                    Guru mengatur dan memindahkan anggota ke kelompok yang diinginkan secara langsung.
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="mt-4 bg-[#FEE2E2] text-[#DC2626] text-[13px] font-semibold p-3 rounded-xl">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-5 w-full bg-[#2563EB] hover:bg-[#1B3B6F] disabled:opacity-60 text-white font-bold text-[14px] py-3.5 px-6 rounded-full inline-flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px] material-symbols-filled">
                  check_circle
                </span>
                <span>
                  {isSubmitting ? 'Menyimpan ke Supabase...' : 'Simpan & Buka Halaman Kelola Room'}
                </span>
              </button>

              <Link
                to="/guru"
                className="mt-2.5 w-full bg-[#EDF5FD] hover:bg-[#DCEBFA] border border-[#CBE0F7] text-[#1B3B6F] font-bold text-[13.5px] py-3 px-6 rounded-full inline-flex items-center justify-center gap-1.5 transition-colors no-underline"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  arrow_back
                </span>
                <span>Batal &amp; Kembali ke Daftar Room</span>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

export default TeacherCreateRoom;
