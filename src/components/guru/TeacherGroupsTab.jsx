import React from 'react';

/**
 * TeacherGroupsTab
 * Mengelola dua fase tampilan di halaman /guru/room:
 * - mode="pembagian": Fase Pembagian Kelompok (Bagi Otomatis Acak Seimbang & Pindah Manual)
 * - mode="pantauan": Fase Pantauan Kelompok (Ringkasan Progres Kelas & Kartu Pantauan Kelompok)
 */
export function TeacherGroupsTab({
  mode = 'pembagian',
  roomData,
  updateRoomData,
  onFinalizeGroups,
  onInspectGroup,
}) {
  const students = roomData?.students || [];
  const groups = roomData?.groups || [];
  const tasks = roomData?.tasks || [];

  // Pertahankan 5 siswa Kelompok 1 (std-01 s.d. std-05) agar skenario demo tetap utuh,
  // lalu acak sisa 25 siswa ke Kelompok 2 s.d. 7 sesuai kapasitas masing-masing (5, 4, 4, 4, 4, 4).
  const handleAutoDistribute = () => {
    if (!students.length || !groups.length || !updateRoomData) return;

    const demoStudentIds = new Set(['std-01', 'std-02', 'std-03', 'std-04', 'std-05']);
    const demoStudents = students
      .filter((s) => demoStudentIds.has(s.id))
      .map((s) => ({ ...s, groupId: 'grp-1' }));

    const nonDemoStudents = students.filter((s) => !demoStudentIds.has(s.id));

    // Fisher-Yates Shuffle untuk 25 siswa non-demo
    const pool = [...nonDemoStudents];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const targetGroups = groups.filter((g) => g.id !== 'grp-1');
    const distributedNonDemo = [];
    let poolIdx = 0;

    for (const group of targetGroups) {
      const capacity = group.capacity || 4;
      for (let c = 0; c < capacity && poolIdx < pool.length; c++) {
        distributedNonDemo.push({
          ...pool[poolIdx],
          groupId: group.id,
        });
        poolIdx++;
      }
    }

    // Sisipkan sisa siswa (jika ada selisih kapasitas) ke kelompok terakhir
    while (poolIdx < pool.length) {
      const fallbackGroup = targetGroups[targetGroups.length - 1] || { id: 'grp-7' };
      distributedNonDemo.push({
        ...pool[poolIdx],
        groupId: fallbackGroup.id,
      });
      poolIdx++;
    }

    // Urutkan kembali berdasarkan nomor absen
    const mergedStudents = [...demoStudents, ...distributedNonDemo].sort(
      (a, b) => a.absen - b.absen
    );

    updateRoomData((prev) => ({
      ...prev,
      students: mergedStudents,
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

  // =========================================================================
  // FASE 1: PEMBAGIAN KELOMPOK (mode === 'pembagian')
  // =========================================================================
  if (mode === 'pembagian') {
    return (
      <section className="bg-white rounded-[28px] border border-[#E2E8F0] p-7 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
        {/* Top bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[19px] font-extrabold text-[#0F172A]">
              Pembagian Kelompok (Otomatis &amp; Manual oleh Guru)
            </h2>
            <p className="text-[13.5px] text-[#64748B] mt-1">
              Gunakan tombol{' '}
              <strong className="text-[#0F172A] font-bold">Bagi Otomatis</strong>{' '}
              untuk mengacak siswa sesuai kapasitas kelompok, atau pindahkan siswa secara{' '}
              <strong className="text-[#0F172A] font-bold">Manual</strong> melalui
              pilihan kelompok di samping nama siswa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleAutoDistribute}
              className="bg-[#F0F4F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#0F172A] font-bold text-[13px] h-11 px-5 rounded-full inline-flex items-center gap-2 transition-colors cursor-pointer"
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
                      <span className="text-[13.5px] font-bold text-[#0F172A] leading-none truncate">
                        {String(student.absen).padStart(2, '0')}. {student.name}
                      </span>

                      {group.id === 'grp-1' && student.role ? (
                        <span className="inline-flex items-center h-7 text-[12px] font-bold text-[#0B57D0] leading-none shrink-0">
                          {student.role}
                        </span>
                      ) : (
                        <div className="relative shrink-0 flex items-center">
                          <select
                            value={student.groupId || group.id}
                            onChange={(e) =>
                              handleMoveStudent(student.id, e.target.value)
                            }
                            className="appearance-none h-7 bg-[#F0F4F9] hover:bg-[#E2E8F0] text-[#0F172A] text-[12px] font-semibold leading-none pl-3 pr-7 rounded-full border border-[#E2E8F0] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/30 transition-colors"
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
                      )}
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
                      <span className="text-[13.5px] font-bold text-[#0F172A] leading-none truncate">
                        {String(student.absen).padStart(2, '0')}. {student.name}
                      </span>
                      <span className="inline-flex items-center justify-center h-6 px-3 rounded-full bg-[#F0F4F9] text-[#334155] font-semibold text-[11.5px] leading-none shrink-0">
                        {student.role || 'Anggota'}
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
