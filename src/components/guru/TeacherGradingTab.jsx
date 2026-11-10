import React, { useState, useEffect, useMemo } from 'react';
import { useRoomData } from '../../utils/storageSync';
import { exportGradesToCSV, printGradesToPDF } from '../../utils/exportHelper';

/**
 * TeacherGradingTab
 * Komponen Sub-Tab 3 ("3. Penilaian (Urut Absen)") pada halaman /guru/room.
 * Mengacu penuh pada spesifikasi Issue #4, MVP.md, dan referensi desain:
 * docs/design-references/06_Guru_Tab3_Penilaian_Individu_Absen.png
 */
export function TeacherGradingTab({
  roomData: propRoomData,
  updateRoomData: propUpdateRoomData,
  selectedGroupFilter = 'ALL',
  onChangeGroupFilter,
}) {
  const [hookRoomData, hookUpdateRoomData] = useRoomData();
  const roomData = propRoomData || hookRoomData;
  const updateRoomData = propUpdateRoomData || hookUpdateRoomData;

  const students = useMemo(
    () => [...(roomData?.students || [])].sort((a, b) => a.absen - b.absen),
    [roomData?.students]
  );
  const groups = useMemo(() => roomData?.groups || [], [roomData?.groups]);
  const tasks = useMemo(() => roomData?.tasks || [], [roomData?.tasks]);

  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState(selectedGroupFilter || 'ALL');
  const [selectedStudentId, setSelectedStudentId] = useState('std-02');
  const [gradeInput, setGradeInput] = useState('92');
  const [noteInput, setNoteInput] = useState(
    'Seluruh slide selesai tepat waktu dengan bukti lengkap.'
  );
  const [saveFeedback, setSaveFeedback] = useState('');

  // Sinkronisasi filter kelompok bila dikirim dari Sub-Tab 2 ("Periksa & Nilai ->")
  useEffect(() => {
    if (selectedGroupFilter) {
      setGroupFilter(selectedGroupFilter);
    }
  }, [selectedGroupFilter]);

  const groupMap = useMemo(
    () => new Map(groups.map((g) => [g.id, g.name])),
    [groups]
  );

  // Filter daftar siswa berdasarkan pencarian nama/absen & filter kelompok
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((student) => {
      const matchesGroup =
        groupFilter === 'ALL' || !groupFilter || student.groupId === groupFilter;
      if (!matchesGroup) return false;

      if (!q) return true;
      const absenStr = String(student.absen).padStart(2, '0');
      const rawAbsenStr = String(student.absen);
      const nameLower = (student.name || '').toLowerCase();
      return (
        nameLower.includes(q) || absenStr.includes(q) || rawAbsenStr === q
      );
    });
  }, [students, groupFilter, searchQuery]);

  // Siswa yang sedang dipilih di panel kanan (default: 02 - Budi Santoso)
  const selectedStudent = useMemo(() => {
    const found = students.find((s) => s.id === selectedStudentId);
    if (found) return found;
    return students.find((s) => s.id === 'std-02') || students[0] || null;
  }, [students, selectedStudentId]);

  // Sinkronisasi nilai form saat berganti siswa yang dipilih
  useEffect(() => {
    if (!selectedStudent) return;
    setGradeInput(
      selectedStudent.grade !== null && selectedStudent.grade !== undefined
        ? String(selectedStudent.grade)
        : ''
    );
    setNoteInput(selectedStudent.teacherNote || '');
    setSaveFeedback('');
  }, [selectedStudent?.id]);

  const handleGroupSelectChange = (nextGroup) => {
    setGroupFilter(nextGroup);
    onChangeGroupFilter?.(nextGroup);

    if (nextGroup !== 'ALL') {
      const currentInGroup = students.some(
        (s) => s.id === selectedStudentId && s.groupId === nextGroup
      );
      if (!currentInGroup) {
        const firstInGroup = students.find((s) => s.groupId === nextGroup);
        if (firstInGroup) {
          setSelectedStudentId(firstInGroup.id);
        }
      }
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudentId(student.id);
    setGradeInput(
      student.grade !== null && student.grade !== undefined
        ? String(student.grade)
        : ''
    );
    setNoteInput(student.teacherNote || '');
    setSaveFeedback('');
  };

  const handleSaveGrade = (e) => {
    e.preventDefault();
    if (!selectedStudent || !updateRoomData) return;

    const trimmedGrade = String(gradeInput).trim();
    let parsedGrade = null;
    if (trimmedGrade !== '') {
      const numeric = Number(trimmedGrade);
      if (!Number.isNaN(numeric)) {
        parsedGrade = Math.min(100, Math.max(0, Math.round(numeric)));
      }
    }

    updateRoomData((prev) => ({
      ...prev,
      students: (prev?.students || []).map((s) =>
        s.id === selectedStudent.id
          ? {
              ...s,
              grade: parsedGrade,
              teacherNote: noteInput.trim(),
            }
          : s
      ),
    }));

    setGradeInput(parsedGrade !== null ? String(parsedGrade) : '');
    setSaveFeedback(`Nilai ${selectedStudent.name} berhasil disimpan.`);
    setTimeout(() => {
      setSaveFeedback('');
    }, 2500);
  };

  // Daftar task milik siswa terpilih
  const selectedStudentTasks = useMemo(() => {
    if (!selectedStudent) return [];
    return tasks.filter((t) => t.ownerId === selectedStudent.id);
  }, [tasks, selectedStudent]);

  const selectedCompletedCount = useMemo(
    () => selectedStudentTasks.filter((t) => t.status === 'Completed').length,
    [selectedStudentTasks]
  );

  // Helper badge status pada kartu task di panel kanan
  const getTaskStatusBadge = (status) => {
    if (status === 'Completed') {
      return {
        label: 'Completed',
        className: 'bg-[#D1FAE5] text-[#047857] font-bold text-[11px] px-2.5 py-0.5 rounded-full shrink-0',
      };
    }
    if (status === 'In Progress') {
      return {
        label: 'In Progress',
        className: 'bg-[#F0F4F9] text-[#0F172A] border border-[#E2E8F0] font-bold text-[11px] px-2.5 py-0.5 rounded-full shrink-0',
      };
    }
    if (status === 'On Hold' || status?.includes('Terkendala')) {
      return {
        label: 'On Hold',
        className: 'bg-[#FEF3C7] text-[#B45309] font-bold text-[11px] px-2.5 py-0.5 rounded-full shrink-0',
      };
    }
    return {
      label: status || 'Not Started',
      className: 'bg-[#E2E8F0] text-[#475569] font-bold text-[11px] px-2.5 py-0.5 rounded-full shrink-0',
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ===================================================================
          KOLOM KIRI (7 DARI 12 KOLOM GRID): TABEL DAFTAR SISWA URUT ABSEN
      =================================================================== */}
      <section
        aria-labelledby="attendance-table-heading"
        className="lg:col-span-7 bg-white rounded-[28px] border border-[#E2E8F0] p-6 sm:p-7 shadow-[0_2px_12px_rgba(15,23,42,0.03)]"
      >
        {/* Header Kolom Kiri + Tombol Ekspor CSV & Cetak PDF */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
          <div>
            <h2
              id="attendance-table-heading"
              className="text-[18px] font-extrabold text-[#0F172A]"
            >
              Daftar Seluruh Siswa Urut Nomor Absen
            </h2>
            <p className="text-[13px] text-[#64748B] mt-1 leading-relaxed">
              Klik baris siswa untuk memeriksa task, bukti pekerjaan, riwayat waktu, dan memberi nilai individu.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => exportGradesToCSV(roomData)}
              className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-white hover:bg-[#F0F4F9] text-[#0F172A] border border-[#CBD5E1] font-bold text-[12.5px] leading-none gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                download
              </span>
              <span>Unduh CSV</span>
            </button>

            <button
              type="button"
              onClick={() => printGradesToPDF()}
              className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-[12.5px] leading-none gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                print
              </span>
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>

        {/* Baris Filter: Pencarian Nama/Nomor Absen & Dropdown Kelompok */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-5">
          <div className="sm:col-span-7 relative">
            <span
              className="material-symbols-outlined text-[18px] text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            >
              search
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau nomor absen..."
              aria-label="Cari nama atau nomor absen"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full bg-[#F8FAFD] border border-[#CBD5E1] rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#0B57D0] transition-colors"
            />
          </div>

          <div className="sm:col-span-5 relative">
            <select
              value={groupFilter}
              onChange={(e) => handleGroupSelectChange(e.target.value)}
              aria-label="Filter berdasarkan kelompok"
              className="w-full appearance-none bg-white border border-[#CBD5E1] rounded-xl pl-3.5 pr-9 py-2.5 text-[13px] font-semibold text-[#0F172A] cursor-pointer focus:border-[#0B57D0] transition-colors"
            >
              <option value="ALL">
                Semua Kelompok (Kelompok 1 - {groups.length || 7})
              </option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <span
              className="material-symbols-outlined text-[18px] text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            >
              expand_more
            </span>
          </div>
        </div>

        {/* Tabel 30 Siswa Urut Nomor Absen */}
        <div
          tabIndex={0}
          role="region"
          aria-labelledby="attendance-table-heading"
          className="overflow-x-auto rounded-2xl border border-[#E2E8F0]"
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F0F4F9] border-b border-[#E2E8F0] text-[#475569] text-[11px] font-extrabold uppercase tracking-wider">
                <th scope="col" className="py-3 pl-4 pr-2 w-[60px]">
                  ABSEN
                </th>
                <th scope="col" className="py-3 px-2.5">
                  NAMA SISWA
                </th>
                <th scope="col" className="py-3 px-2.5">
                  KELOMPOK &amp; PERAN
                </th>
                <th scope="col" className="py-3 px-2.5">
                  TASK &amp; BUKTI
                </th>
                <th scope="col" className="py-3 pl-2.5 pr-4 text-right">
                  NILAI INDIVIDU
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredStudents.map((student) => {
                const isSelected = selectedStudent?.id === student.id;
                const absenFormatted = String(student.absen).padStart(2, '0');
                const groupName =
                  groupMap.get(student.groupId) || student.groupId || '-';
                const studentTasks = tasks.filter(
                  (t) => t.ownerId === student.id
                );
                const completedCount = studentTasks.filter(
                  (t) => t.status === 'Completed'
                ).length;
                const hasEvidence = studentTasks.some(
                  (t) =>
                    t.evidence &&
                    (t.evidence.notes ||
                      t.evidence.linkUrl ||
                      t.evidence.fileName)
                );
                const allCompletedWithEvidence =
                  studentTasks.length > 0 &&
                  completedCount === studentTasks.length &&
                  hasEvidence;
                const hasGrade =
                  student.grade !== null &&
                  student.grade !== undefined &&
                  student.grade !== '';

                return (
                  <tr
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectStudent(student);
                      }
                    }}
                    tabIndex={0}
                    aria-selected={isSelected}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#D3E3FD]'
                        : 'bg-white hover:bg-[#F8FAFD]'
                    }`}
                  >
                    {/* ABSEN */}
                    <td className="py-3 pl-4 pr-2 text-[13px] font-extrabold text-[#0F172A] whitespace-nowrap">
                      {absenFormatted}
                    </td>

                    {/* NAMA SISWA */}
                    <td
                      className={`py-3 px-2.5 text-[13px] whitespace-nowrap ${
                        isSelected
                          ? 'font-extrabold text-[#041E49]'
                          : 'font-semibold text-[#0F172A]'
                      }`}
                    >
                      {student.name}
                    </td>

                    {/* KELOMPOK & PERAN */}
                    <td className="py-3 px-2.5 whitespace-nowrap">
                      <span className="block text-[12.5px] font-bold text-[#0F172A] leading-tight">
                        {groupName}
                      </span>
                      <span className="block text-[11.5px] text-[#64748B] mt-0.5">
                        {student.role || 'Anggota'}
                      </span>
                    </td>

                    {/* TASK & BUKTI */}
                    <td className="py-3 px-2.5 whitespace-nowrap">
                      {studentTasks.length > 0 ? (
                        <span
                          className={`inline-block font-bold text-[11px] px-3 py-1 rounded-full ${
                            allCompletedWithEvidence
                              ? 'bg-[#D1FAE5] text-[#047857]'
                              : 'bg-[#FEF3C7] text-[#B45309]'
                          }`}
                        >
                          {completedCount}/{studentTasks.length} Selesai •{' '}
                          {hasEvidence ? 'Bukti Ada' : 'Tanpa Bukti'}
                        </span>
                      ) : (
                        <span className="text-[12px] text-[#94A3B8]">
                          Anggota Kelompok
                        </span>
                      )}
                    </td>

                    {/* NILAI INDIVIDU */}
                    <td className="py-3 pl-2.5 pr-4 text-right whitespace-nowrap">
                      {hasGrade ? (
                        <span className="inline-block bg-[#0B57D0] text-white font-extrabold text-[12px] px-3.5 py-1 rounded-full min-w-[44px] text-center">
                          {student.grade}
                        </span>
                      ) : (
                        <span className="inline-block bg-[#FEE2E2] text-[#B91C1C] font-bold text-[11px] px-3 py-1 rounded-full">
                          Belum Dinilai
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-[13.5px] text-[#64748B]"
                  >
                    Tidak ada siswa yang cocok dengan pencarian atau filter kelompok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===================================================================
          KOLOM KANAN (5 DARI 12 KOLOM GRID): PANEL DETAIL KONTRIBUSI INDIVIDU
      =================================================================== */}
      <aside
        aria-label="Panel Detail Kontribusi Individu"
        className="lg:col-span-5 bg-[#F0F4F9] rounded-[28px] border border-[#E2E8F0] p-6 sm:p-7 shadow-[0_2px_12px_rgba(15,23,42,0.03)]"
      >
        {selectedStudent ? (
          <>
            {/* Identitas Lengkap Siswa */}
            <div className="flex items-center gap-3.5 mb-5">
              <div
                className="w-12 h-12 rounded-2xl bg-[#0B57D0] text-white font-extrabold text-[17px] flex items-center justify-center shrink-0 shadow-xs"
                aria-hidden="true"
              >
                {String(selectedStudent.absen).padStart(2, '0')}
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0B57D0] block">
                  DETAIL KONTRIBUSI INDIVIDU
                </span>
                <h3 className="text-[20px] font-extrabold text-[#0F172A] leading-tight">
                  {selectedStudent.name}
                </h3>
                <p className="text-[13px] text-[#475569] mt-0.5">
                  {groupMap.get(selectedStudent.groupId) || 'Kelompok 1'} • Peran:{' '}
                  <strong className="font-bold text-[#0F172A]">
                    {selectedStudent.role || 'Anggota'}
                  </strong>
                </p>
              </div>
            </div>

            {/* 3 Kotak Metrik Ringkas */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-2xl border border-[#E2E8F0] px-3.5 py-3 text-center">
                <span className="text-[11.5px] text-[#64748B] block">
                  Task Dibuat
                </span>
                <strong className="text-[16px] font-extrabold text-[#0F172A] mt-0.5 block">
                  {selectedStudentTasks.length} Task
                </strong>
              </div>

              <div className="bg-white rounded-2xl border border-[#E2E8F0] px-3.5 py-3 text-center">
                <span className="text-[11.5px] text-[#64748B] block">
                  Completed
                </span>
                <strong className="text-[16px] font-extrabold text-[#047857] mt-0.5 block">
                  {selectedCompletedCount} Selesai
                </strong>
              </div>

              <div className="bg-white rounded-2xl border border-[#E2E8F0] px-3.5 py-3 text-center">
                <span className="text-[11.5px] text-[#64748B] block">
                  Nilai Individu
                </span>
                {selectedStudent.grade !== null &&
                selectedStudent.grade !== undefined &&
                selectedStudent.grade !== '' ? (
                  <strong className="text-[16px] font-extrabold text-[#0B57D0] mt-0.5 block">
                    {selectedStudent.grade}/100
                  </strong>
                ) : (
                  <strong className="text-[14px] font-extrabold text-[#B91C1C] mt-0.5 block">
                    Belum Dinilai
                  </strong>
                )}
              </div>
            </div>

            {/* Judul Bagian Daftar Task */}
            <h4 className="text-[11.5px] font-extrabold uppercase tracking-wider text-[#475569] mb-3">
              DAFTAR TASK, BUKTI, &amp; RIWAYAT PENGERJAAN
            </h4>

            {/* Daftar Task Milik Siswa */}
            <div className="space-y-4 mb-6">
              {selectedStudentTasks.map((task) => {
                const statusBadge = getTaskStatusBadge(task.status);
                const hasEvidence =
                  task.evidence &&
                  (task.evidence.notes ||
                    task.evidence.linkUrl ||
                    task.evidence.fileName);

                return (
                  <article
                    key={task.id}
                    className="bg-white rounded-[20px] border border-[#E2E8F0] p-4.5 shadow-2xs"
                  >
                    {/* Header Task */}
                    <div className="flex items-start justify-between gap-2.5 mb-1.5">
                      <h5 className="text-[14px] font-extrabold text-[#0F172A] leading-snug">
                        {task.title}
                      </h5>
                      <span className={statusBadge.className}>
                        {statusBadge.label}
                      </span>
                    </div>

                    {/* Deskripsi Task */}
                    <p className="text-[12.5px] text-[#475569] leading-relaxed mb-3">
                      {task.description}
                    </p>

                    {/* Kotak Bukti Pekerjaan */}
                    {hasEvidence ? (
                      <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3 mb-3">
                        <strong className="text-[12px] font-extrabold text-[#065F46] block">
                          Bukti: {task.evidence.fileName || 'Lampiran Bukti'}
                          {task.evidence.fileSize
                            ? ` (${task.evidence.fileSize})`
                            : ''}
                        </strong>
                        {task.evidence.notes && (
                          <p className="text-[12px] text-[#047857] mt-0.5 leading-relaxed">
                            &ldquo;{task.evidence.notes}&rdquo;
                          </p>
                        )}
                        {task.evidence.linkUrl && (
                          <a
                            href={task.evidence.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11.5px] font-semibold text-[#0B57D0] hover:underline mt-0.5 block break-all"
                          >
                            Tautan: {task.evidence.linkUrl}
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-3 py-2 mb-3">
                        <p className="text-[12px] font-semibold text-[#B91C1C]">
                          Belum ada bukti pekerjaan yang dikumpulkan pada task ini.
                        </p>
                      </div>
                    )}

                    {/* Riwayat Aktivitas Tercatat */}
                    <div className="pt-2.5 border-t border-[#F1F5F9]">
                      <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#64748B] block mb-1.5">
                        RIWAYAT AKTIVITAS TERCATAT:
                      </span>
                      <ul className="space-y-1">
                        {(task.logs || []).map((log, idx) => (
                          <li
                            key={`${task.id}-log-${idx}`}
                            className="flex items-baseline justify-between gap-2 text-[11.5px]"
                          >
                            <span className="text-[#334155]">
                              • {log.action}
                            </span>
                            <span className="text-[#94A3B8] font-medium shrink-0">
                              {log.time}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                );
              })}

              {selectedStudentTasks.length === 0 && (
                <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 text-center">
                  <p className="text-[13px] font-bold text-[#0F172A]">
                    Belum Ada Task Individual di Kanban
                  </p>
                  <p className="text-[12px] text-[#64748B] mt-1">
                    {selectedStudent.name} terdaftar sebagai{' '}
                    <strong>{selectedStudent.role || 'Anggota'}</strong> pada{' '}
                    {groupMap.get(selectedStudent.groupId) || 'kelompoknya'}.
                  </p>
                </div>
              )}
            </div>

            {/* Formulir Penilaian Individu */}
            <form
              onSubmit={handleSaveGrade}
              className="bg-white rounded-[20px] border border-[#E2E8F0] p-4.5 shadow-2xs"
            >
              <h4 className="text-[12px] font-extrabold uppercase tracking-wider text-[#0B57D0] mb-3">
                FORMULIR PENILAIAN INDIVIDU
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3.5">
                <div className="sm:col-span-4">
                  <label
                    htmlFor="student-grade-input"
                    className="block text-[12px] font-bold text-[#0F172A] mb-1.5"
                  >
                    Nilai (0-100)
                  </label>
                  <input
                    id="student-grade-input"
                    name="grade"
                    type="number"
                    min="0"
                    max="100"
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    placeholder="0-100"
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[15px] font-extrabold text-[#0F172A] focus:border-[#0B57D0] transition-colors"
                  />
                </div>

                <div className="sm:col-span-8">
                  <label
                    htmlFor="student-note-input"
                    className="block text-[12px] font-bold text-[#0F172A] mb-1.5"
                  >
                    Catatan Guru
                  </label>
                  <input
                    id="student-note-input"
                    name="teacherNote"
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Tulis catatan evaluasi untuk siswa..."
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0B57D0] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-[13.5px] py-3 px-5 rounded-full transition-colors cursor-pointer shadow-xs"
              >
                Simpan Nilai {selectedStudent.name}
              </button>

              <div aria-live="polite" className="min-h-[18px] mt-1.5 text-center">
                {saveFeedback && (
                  <span className="text-[12px] font-bold text-[#047857]">
                    {saveFeedback}
                  </span>
                )}
              </div>
            </form>
          </>
        ) : null}
      </aside>
    </div>
  );
}

export default TeacherGradingTab;
