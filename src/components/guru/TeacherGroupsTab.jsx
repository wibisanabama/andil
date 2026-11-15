import React, { useState, useEffect } from 'react';
import { allocateStudentsAuto } from '../../utils/groupAllocator';
import {
  addStudentToRoomInSupabase,
  deleteStudentFromSupabase,
  fetchRoomDataFromSupabase,
} from '../../utils/storageSync';

/**
 * TeacherGroupsTab
 * Mengelola dua fase tampilan di halaman /guru/room:
 * - mode="pembagian": Fase Pembagian Kelompok (Tambah Siswa, Bagi Otomatis Acak Seimbang & Pindah Manual)
 * - mode="pantauan": Fase Pantauan Kelompok (Ringkasan Progres Kelas & Kartu Pantauan Kelompok)
 */
export function TeacherGroupsTab({
  mode = 'pembagian',
  roomData,
  updateRoomData,
  onFinalizeGroups,
  onInspectGroup,
}) {
  const room = roomData?.room || {};
  const students = roomData?.students || [];
  const groups = roomData?.groups || [];
  const tasks = roomData?.tasks || [];

  const [newAbsen, setNewAbsen] = useState('');
  const [newName, setNewName] = useState('');
  const [newGroupId, setNewGroupId] = useState('');
  const [addError, setAddError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Sinkronisasi daftar siswa yang baru join room secara berkala saat fase pembagian kelompok
  useEffect(() => {
    if (mode !== 'pembagian' || !room.code) return undefined;
    const intervalId = setInterval(() => {
      fetchRoomDataFromSupabase(room.code);
    }, 2500);
    return () => clearInterval(intervalId);
  }, [mode, room.code]);

  // Acak seimbang seluruh siswa di dalam room sesuai kapasitas masing-masing kelompok
  const handleAutoDistribute = () => {
    if (!students.length || !groups.length || !updateRoomData) return;

    const allocated = allocateStudentsAuto(students, groups);
    updateRoomData((prev) => ({
      ...prev,
      students: allocated,
    }));
  };

  // Pindahkan siswa tunggal antar-kelompok secara manual via select dropdown
  const handleMoveStudent = (studentId, nextGroupId) => {
    if (!updateRoomData) return;
    updateRoomData((prev) => ({
      ...prev,
      students: (prev?.students || []).map((s) =>
        s.id === studentId ? { ...s, groupId: nextGroupId } : s
      ),
    }));
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (isAdding) return;
    setAddError('');
    setIsAdding(true);

    try {
      const res = await addStudentToRoomInSupabase({
        roomCode: room.code,
        absen: newAbsen,
        name: newName,
        groupId: newGroupId || groups[0]?.id || '',
      });
      if (!res.ok) {
        setAddError(res.error);
        return;
      }
      setNewAbsen('');
      setNewName('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    await deleteStudentFromSupabase(studentId);
  };

  // =========================================================================
  // FASE 1: PEMBAGIAN KELOMPOK (mode === 'pembagian')
  // =========================================================================
  if (mode === 'pembagian') {
    return (
      <section className="bg-white rounded-[28px] border border-[#E2E8F0] p-7 shadow-[0_2px_12px_rgba(15,23,42,0.03)] space-y-6">
        {/* Top bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-[19px] font-extrabold text-[#0F172A]">
              Pembagian Kelompok (Otomatis &amp; Manual oleh Guru)
            </h2>
            <p className="text-[13.5px] text-[#64748B] mt-1">
              Siswa dapat bergabung mandiri melalui halaman Siswa menggunakan Kode Room{' '}
              <strong className="text-[#0B57D0] font-bold">{room.code}</strong>, atau ditambahkan langsung oleh Guru di bawah ini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleAutoDistribute}
              disabled={students.length === 0}
              className="bg-[#F0F4F9] hover:bg-[#E2E8F0] disabled:opacity-50 border border-[#E2E8F0] text-[#0F172A] font-bold text-[13px] h-11 px-5 rounded-full inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                shuffle
              </span>
              <span>Bagi Otomatis (Acak Seimbang)</span>
            </button>

            <button
              type="button"
              onClick={onFinalizeGroups}
              className="bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-[13.5px] h-11 px-6 rounded-full inline-flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                check_circle
              </span>
              <span>Selesaikan Pembagian &amp; Pantau Kelompok</span>
            </button>
          </div>
        </div>

        {/* Form Tambah Siswa Langsung oleh Guru */}
        <form
          onSubmit={handleAddStudent}
          className="bg-[#F8FAFD] rounded-2xl border border-[#E2E8F0] p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3"
        >
          <input
            type="number"
            min={1}
            max={Number(room.plannedStudentCount) || 30}
            value={newAbsen}
            onChange={(e) => {
              const raw = e.target.value;
              const maxLimit = Number(room.plannedStudentCount) || 30;
              if (raw === '') {
                setNewAbsen('');
              } else {
                const num = parseInt(raw, 10);
                if (!Number.isNaN(num)) {
                  setNewAbsen(String(Math.min(Math.max(num, 1), maxLimit)));
                }
              }
              if (addError) setAddError('');
            }}
            placeholder={`No. Absen (1-${Number(room.plannedStudentCount) || 30})`}
            aria-label="Nomor Absen Siswa"
            required
            className="md:w-44 bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[13px] font-bold text-[#0F172A] placeholder:font-normal placeholder:text-[#94A3B8] focus:border-[#0B57D0] outline-none"
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (addError) setAddError('');
            }}
            placeholder="Nama Lengkap Siswa..."
            aria-label="Nama Lengkap Siswa"
            required
            className="flex-1 bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0B57D0] outline-none"
          />
          <div className="relative md:w-48">
            <select
              value={newGroupId || groups[0]?.id || ''}
              onChange={(e) => setNewGroupId(e.target.value)}
              aria-label="Pilih Kelompok"
              className="w-full appearance-none bg-white border border-[#CBD5E1] rounded-xl pl-3.5 pr-8 py-2.5 text-[13px] font-semibold text-[#0F172A] cursor-pointer focus:border-[#0B57D0] outline-none"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[16px] text-[#64748B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              expand_more
            </span>
          </div>
          <button
            type="submit"
            disabled={isAdding}
            className="bg-[#D3E3FD] hover:bg-[#C2E7FF] disabled:opacity-50 text-[#041E49] font-bold text-[13px] px-5 py-2.5 rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
              person_add
            </span>
            <span>{isAdding ? 'Menambah...' : 'Tambah Siswa'}</span>
          </button>
        </form>

        {addError && (
          <div className="bg-[#FEE2E2] text-[#DC2626] text-[13px] font-semibold p-3 rounded-xl">
            {addError}
          </div>
        )}

        {/* 3-Column Grid of Group Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => {
            const groupMembers = students
              .filter((s) => s.groupId === group.id)
              .sort((a, b) => a.absen - b.absen);

            return (
              <div
                key={group.id}
                className="bg-[#F8FAFD] rounded-2xl border border-[#E2E8F0] p-5"
              >
                {/* Header row */}
                <div className="flex items-center justify-between h-7 mb-3.5">
                  <h3 className="text-[15.5px] font-extrabold text-[#0F172A] leading-none">
                    {group.name}
                  </h3>
                  <span className="inline-flex items-center justify-center h-6 px-3 rounded-full bg-[#D1FAE5] text-[#047857] font-bold text-[12px] leading-none">
                    {groupMembers.length}/{group.capacity} Anggota
                  </span>
                </div>

                {/* Member list */}
                <div className="space-y-2">
                  {groupMembers.map((student) => (
                    <div
                      key={student.id}
                      className="bg-white rounded-xl border border-[#E2E8F0] px-3.5 h-11 flex items-center justify-between gap-2"
                    >
                      <span className="text-[13.5px] font-bold text-[#0F172A] leading-normal truncate">
                        {String(student.absen).padStart(2, '0')}. {student.name}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="relative flex items-center">
                          <select
                            value={student.groupId || group.id}
                            onChange={(e) =>
                              handleMoveStudent(student.id, e.target.value)
                            }
                            className="appearance-none h-7 bg-[#F0F4F9] hover:bg-[#E2E8F0] text-[#0F172A] text-[12px] font-semibold leading-normal pl-3 pr-7 rounded-full border border-[#E2E8F0] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/30 transition-colors"
                            aria-label={`Pindahkan ${student.name} ke kelompok lain`}
                          >
                            {groups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </select>
                          <span className="material-symbols-outlined text-[15px] text-[#64748B] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            expand_more
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveStudent(student.id)}
                          className="h-7 w-7 rounded-full text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] inline-flex items-center justify-center transition-colors cursor-pointer"
                          title={`Hapus ${student.name}`}
                          aria-label={`Hapus ${student.name}`}
                        >
                          <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                            close
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {groupMembers.length === 0 && (
                    <p className="text-[12.5px] text-[#94A3B8] italic py-2 text-center">
                      Belum ada anggota di kelompok ini
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // =========================================================================
  // FASE 2: PANTAUAN KELOMPOK (mode === 'pantauan')
  // =========================================================================
  const totalTasks = tasks.length;
  const notStartedCount = tasks.filter((t) => t.status === 'Not Started').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const onHoldCount = tasks.filter(
    (t) => t.status === 'On Hold' || t.status?.includes('Terkendala')
  ).length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;

  return (
    <div>
      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] px-5 py-4 shadow-[0_2px_10px_rgba(15,23,42,0.02)]">
          <span className="text-[13px] font-semibold text-[#64748B] block">
            Not Started
          </span>
          <p className="text-[24px] font-extrabold text-[#0F172A] mt-1">
            {notStartedCount} Task
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] px-5 py-4 shadow-[0_2px_10px_rgba(15,23,42,0.02)]">
          <span className="text-[13px] font-semibold text-[#64748B] block">
            In Progress
          </span>
          <p className="text-[24px] font-extrabold text-[#0B57D0] mt-1">
            {inProgressCount} Task
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] px-5 py-4 shadow-[0_2px_10px_rgba(15,23,42,0.02)]">
          <span className="text-[13px] font-semibold text-[#64748B] block">
            On Hold / Terkendala
          </span>
          <p className="text-[24px] font-extrabold text-[#B45309] mt-1">
            {onHoldCount} Task
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] px-5 py-4 shadow-[0_2px_10px_rgba(15,23,42,0.02)]">
          <span className="text-[13px] font-semibold text-[#64748B] block">
            Completed + Bukti
          </span>
          <p className="text-[24px] font-extrabold text-[#047857] mt-1">
            {completedCount}/{totalTasks} Selesai
          </p>
        </div>
      </div>

      {/* 3-Column Grid of Group Monitoring Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {groups.map((group) => {
          const groupMembers = students
            .filter((s) => s.groupId === group.id)
            .sort((a, b) => a.absen - b.absen);

          const groupTasks = tasks.filter((t) => t.groupId === group.id);
          const groupCompletedTasks = groupTasks.filter(
            (t) => t.status === 'Completed'
          ).length;
          const groupTotalTasks = groupTasks.length;

          return (
            <div
              key={group.id}
              className="bg-white rounded-[24px] border border-[#E2E8F0] p-6 flex flex-col justify-between shadow-[0_2px_12px_rgba(15,23,42,0.03)]"
            >
              <div>
                {/* Top Header */}
                <div className="flex items-center justify-between h-7 mb-4">
                  <h3 className="text-[17px] font-extrabold text-[#0F172A] leading-none">
                    {group.name}
                  </h3>
                  <span className="inline-flex items-center justify-center h-6 px-3 rounded-full bg-[#D3E3FD] text-[#041E49] font-bold text-[12px] leading-none">
                    {groupMembers.length}/{group.capacity} Anggota
                  </span>
                </div>

                {/* Member list with roles */}
                <div className="divide-y divide-[#F1F5F9] mb-4">
                  {groupMembers.map((student) => (
                    <div
                      key={student.id}
                      className="h-10 flex items-center justify-between gap-2"
                    >
                      <span className="text-[13.5px] font-bold text-[#0F172A] leading-normal truncate">
                        {String(student.absen).padStart(2, '0')}. {student.name}
                      </span>
                      <span className="inline-flex items-center justify-center h-6 px-3 rounded-full bg-[#F0F4F9] text-[#334155] font-semibold text-[11.5px] leading-none shrink-0">
                        {student.role || 'Belum Pilih Peran'}
                      </span>
                    </div>
                  ))}

                  {groupMembers.length === 0 && (
                    <p className="text-[12.5px] text-[#94A3B8] italic py-4 text-center">
                      Belum ada anggota
                    </p>
                  )}
                </div>
              </div>

              {/* Footer progress & CTA */}
              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[12.5px]">
                <span className="text-[#64748B]">
                  Progres Task:{' '}
                  <strong className="text-[#0F172A] font-bold">
                    {groupCompletedTasks}/{groupTotalTasks} Completed
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => onInspectGroup?.(group.id)}
                  className="text-[#0B57D0] hover:text-[#0842A0] font-extrabold inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Periksa &amp; Nilai</span>
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TeacherGroupsTab;
