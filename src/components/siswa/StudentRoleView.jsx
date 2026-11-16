import React, { useState, useMemo, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  useAuthSession,
  useRoomData,
  updateStudentRoleInSupabase,
  logoutStudentSession,
} from '../../utils/storageSync';
import { canSelectRole, isRoleLocked } from '../../utils/permissions';
import { StudentWaitingRoom } from './StudentWaitingRoom';

const ROLE_METADATA = {
  'Ketua Kelompok': {
    icon: 'lock',
    defaultDescription: 'Mengatur pembagian kerja dan memastikan kelengkapan tugas tim.',
  },
  Anggota: {
    icon: 'groups',
    defaultDescription: 'Berkolaborasi aktif dalam pengerjaan tugas dan mendukung kebutuhan kelompok.',
  },
  'Pembuat PPT': {
    icon: 'slideshow',
    defaultDescription: 'Menyusun desain visual dan slide presentasi kelompok.',
  },
  'Pencari Materi': {
    icon: 'menu_book',
    defaultDescription: 'Mengumpulkan referensi, literatur, dan data pendukung.',
  },
  'Penyusun Laporan': {
    icon: 'description',
    defaultDescription: 'Merangkum materi menjadi dokumen laporan tertulis yang rapi.',
  },
  Presenter: {
    icon: 'record_voice_over',
    defaultDescription: 'Menyiapkan narasi dan menyampaikan presentasi di depan kelas.',
  },
};

export function StudentRoleView() {
  const navigate = useNavigate();
  const { student: studentSession } = useAuthSession();
  const [roomData, updateData] = useRoomData(studentSession?.roomCode);

  const currentStudentId = studentSession?.id || '';

  const allStudents = useMemo(() => roomData?.students || [], [roomData?.students]);
  const allGroups = useMemo(() => roomData?.groups || [], [roomData?.groups]);

  // Temukan data siswa aktif dari database
  const activeStudent = useMemo(() => {
    return (
      allStudents.find((s) => s.id === currentStudentId) ||
      studentSession ||
      null
    );
  }, [allStudents, currentStudentId, studentSession]);

  const currentGroupId = activeStudent?.groupId || allGroups[0]?.id || '';
  const currentGroup = useMemo(() => {
    return allGroups.find((g) => g.id === currentGroupId) || null;
  }, [allGroups, currentGroupId]);

  // Anggota satu kelompok dengan siswa yang sedang login
  const groupStudents = useMemo(() => {
    if (!currentGroupId) return [];
    return allStudents
      .filter((s) => s.groupId === currentGroupId && (s.joinStatus || 'approved') === 'approved')
      .sort((a, b) => a.absen - b.absen);
  }, [allStudents, currentGroupId]);

  const availableRoles = useMemo(() => {
    const rawRoles = Array.isArray(roomData?.room?.availableRoles)
      ? roomData.room.availableRoles
      : [];
    const customRoles = rawRoles.filter(
      (r) =>
        r &&
        r.trim().toLowerCase() !== 'ketua kelompok' &&
        r.trim().toLowerCase() !== 'anggota'
    );
    return ['Ketua Kelompok', 'Anggota', ...customRoles];
  }, [roomData?.room?.availableRoles]);

  const [selectedRole, setSelectedRole] = useState(
    () => activeStudent?.role || ''
  );

  useEffect(() => {
    if (activeStudent?.role && !selectedRole) {
      setSelectedRole(activeStudent.role);
    } else if (!selectedRole && availableRoles.length > 0) {
      const firstUnlocked = availableRoles.find(
        (r) => !isRoleLocked(r, currentStudentId, groupStudents)
      );
      if (firstUnlocked) setSelectedRole(firstUnlocked);
    }
  }, [activeStudent?.role, availableRoles, currentStudentId, groupStudents, selectedRole]);

  if (!studentSession) {
    return <Navigate to="/siswa" replace />;
  }

  const currentJoinStatus = activeStudent?.joinStatus || studentSession?.joinStatus || 'approved';

  // Tampilkan Ruang Tunggu Kelas jika:
  // 1) Guru belum mengonfirmasi pembagian kelompok, ATAU
  // 2) Siswa telat masuk dan masih menunggu persetujuan / ditolak Guru
  if (
    !roomData?.room?.isGroupFinalized ||
    currentJoinStatus === 'pending_late' ||
    currentJoinStatus === 'rejected'
  ) {
    return <StudentWaitingRoom roomData={roomData} studentSession={studentSession} />;
  }

  const getOtherStudentForRole = (roleName) => {
    return groupStudents.find(
      (s) =>
        s.id !== currentStudentId &&
        s.role &&
        s.role.trim().toLowerCase() === roleName.trim().toLowerCase()
    );
  };

  const handleSelectRole = (role) => {
    const permission = canSelectRole(role, currentStudentId, groupStudents);
    if (!permission.allowed) {
      return;
    }
    setSelectedRole(role);
  };

  const handleSaveAndOpenWorkspace = async () => {
    if (!selectedRole) return;

    updateData((prev) => {
      const updatedStudents = (prev.students || []).map((st) => {
        if (st.id === currentStudentId) {
          return {
            ...st,
            role: selectedRole,
          };
        }
        return st;
      });

      return {
        ...prev,
        students: updatedStudents,
      };
    });

    await updateStudentRoleInSupabase(currentStudentId, selectedRole);
    navigate('/siswa/workspace');
  };

  const groupNameLabel = currentGroup?.name || studentSession.groupName || 'Kelompok';

  return (
    <main className="bg-[#F4F9FF] min-h-[calc(100vh-72px)] py-8 px-4 sm:px-8">
      <div className="max-w-[1240px] mx-auto">
        {/* Banner Atas: Judul & Anggota Kelompok */}
        <section className="bg-white rounded-[24px] border border-[#DCE8F5] p-6 sm:p-7 mb-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Sisi Kiri: Judul & Deskripsi */}
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <button
                type="button"
                onClick={() => {
                  logoutStudentSession();
                  navigate('/siswa');
                }}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-[#1B3B6F] hover:text-[#2563EB] bg-[#EDF5FD] hover:bg-[#DCEBFA] border border-[#CBE0F7] px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                  arrow_back
                </span>
                <span>Ganti Room</span>
              </button>
              {activeStudent?.role && (
                <Link
                  to="/siswa/workspace"
                  className="inline-flex items-center gap-1 text-[12px] font-bold text-[#2563EB] hover:text-[#1B3B6F] bg-white border border-[#BAE6FD] px-3 py-1.5 rounded-full transition-colors no-underline"
                >
                  <span>Kembali ke Workspace</span>
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                    arrow_forward
                  </span>
                </Link>
              )}
              <span className="text-[13px] font-bold text-[#475569]">
                • {groupNameLabel} ({groupStudents.length}/{currentGroup?.capacity || groupStudents.length} Anggota)
              </span>
            </div>
            <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#1B3B6F] tracking-tight mb-2">
              Pilih Peranmu di {groupNameLabel}
            </h1>
            <p className="text-[13.5px] text-[#64748B] leading-relaxed">
              Pilih 1 peran dari daftar peran yang telah ditentukan guru. Posisi{' '}
              <strong className="text-[#1B3B6F] font-bold">Ketua Kelompok</strong> dikunci maksimal 1 siswa di setiap kelompok.
            </p>
          </div>

          {/* Sisi Kanan: Kartu Anggota Kelompok */}
          <div className="bg-white rounded-2xl border border-[#DCE8F5]/80 p-4 sm:p-5 lg:max-w-md w-full shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2.5 block">
              ANGGOTA {groupNameLabel.toUpperCase()}
            </span>
            <div className="flex flex-wrap gap-2">
              {groupStudents.map((member) => {
                const isSelf = member.id === currentStudentId;
                const displayRole = isSelf ? selectedRole || member.role : member.role;
                const formattedAbsen = String(member.absen).padStart(2, '0');

                if (isSelf) {
                  return (
                    <div
                      key={member.id}
                      className="bg-[#E0F2FE] border border-[#2563EB]/30 rounded-full pl-1.5 pr-3.5 py-1 text-[12px] font-bold text-[#1B3B6F] flex items-center gap-1.5 shadow-2xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10.5px] font-extrabold shrink-0">
                        {formattedAbsen}
                      </span>
                      <span>
                        {member.name} {displayRole ? `(${displayRole})` : ''}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={member.id}
                    className="border border-[#DCE8F5] bg-white rounded-full pl-1.5 pr-3.5 py-1 text-[12px] text-[#334155] font-semibold flex items-center gap-1.5 shadow-2xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#EDF5FD] text-[#475569] flex items-center justify-center text-[10.5px] font-bold shrink-0">
                      {formattedAbsen}
                    </span>
                    <span>
                      {member.name} {displayRole ? `(${displayRole})` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Grid Kartu Pilihan Peran */}
        <section
          aria-label="Daftar Pilihan Peran"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6"
        >
          {availableRoles.map((role) => {
            const isLocked = isRoleLocked(role, currentStudentId, groupStudents);
            const isSelected = selectedRole === role;
            const otherHolder = getOtherStudentForRole(role);
            const meta = ROLE_METADATA[role] || {
              icon: 'assignment_ind',
              defaultDescription: 'Berkontribusi pada pengerjaan tugas dan kolaborasi kelompok.',
            };

            if (isLocked) {
              return (
                <div
                  key={role}
                  className="bg-[#F4F9FF] border border-[#DCE8F5] rounded-2xl p-6 relative flex flex-col justify-between cursor-not-allowed opacity-90 transition-all select-none"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#DCE8F5] text-[#64748B] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                          lock
                        </span>
                      </div>
                      <span className="inline-flex items-center bg-[#FEE2E2] text-[#DC2626] text-[11px] font-bold px-2.5 py-1 rounded-full">
                        Terkunci (Maks 1 Ketua)
                      </span>
                    </div>

                    <h2 className="text-[17px] font-bold text-[#1B3B6F] mb-1.5">
                      {role}
                    </h2>
                    <p className="text-[13px] text-[#64748B] leading-relaxed mb-6">
                      {meta.defaultDescription}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#DCE8F5]/70 flex items-center gap-1.5 text-[12px] font-bold text-[#DC2626]">
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                      person
                    </span>
                    <span>
                      Sudah diambil oleh: {otherHolder?.name || 'Anggota Lain'}
                    </span>
                  </div>
                </div>
              );
            }

            if (isSelected) {
              return (
                <div
                  key={role}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectRole(role)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectRole(role);
                    }
                  }}
                  className="bg-white border-2 border-[#2563EB] rounded-2xl p-6 relative flex flex-col justify-between cursor-pointer shadow-[0_4px_20px_rgba(11,87,208,0.08)] transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-2xs">
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                          {meta.icon}
                        </span>
                      </div>
                      <span className="inline-flex items-center bg-[#2563EB] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs">
                        Peranmu Saat Ini
                      </span>
                    </div>

                    <h2 className="text-[17px] font-bold text-[#1B3B6F] mb-1.5">
                      {role}
                    </h2>
                    <p className="text-[13px] text-[#64748B] leading-relaxed mb-6">
                      {meta.defaultDescription}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#DCE8F5]/70 flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold text-[#475569]">
                      Diisi oleh: <strong className="text-[#1B3B6F]">{activeStudent?.name}</strong>
                    </span>
                    <span
                      className="material-symbols-outlined material-symbols-filled text-[#2563EB] text-[22px]"
                      aria-hidden="true"
                    >
                      check_circle
                    </span>
                  </div>
                </div>
              );
            }

            const holderShortName = otherHolder ? otherHolder.name.split(' ')[0] : null;

            return (
              <div
                key={role}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectRole(role)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectRole(role);
                  }
                }}
                className="bg-white border border-[#DCE8F5] hover:border-[#2563EB]/50 hover:shadow-xs rounded-2xl p-6 relative flex flex-col justify-between cursor-pointer transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#2563EB] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                        {meta.icon}
                      </span>
                    </div>
                    <span className="inline-flex items-center bg-[#EDF5FD] text-[#475569] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      Tersedia
                    </span>
                  </div>

                  <h2 className="text-[17px] font-bold text-[#1B3B6F] mb-1.5">
                    {role}
                  </h2>
                  <p className="text-[13px] text-[#64748B] leading-relaxed mb-6">
                    {meta.defaultDescription}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#DCE8F5]/70 flex items-center justify-between gap-2">
                  <span className="text-[12px] font-medium text-[#64748B]">
                    {holderShortName ? `Diisi oleh: ${holderShortName}` : 'Tersedia'}
                  </span>
                  <span
                    className="w-5 h-5 rounded-full border-2 border-[#CBD5E1] shrink-0"
                    aria-hidden="true"
                  />
                </div>
              </div>
            );
          })}
        </section>

        {/* Bar Aksi Bawah */}
        <section
          aria-label="Bar Konfirmasi Peran"
          className="bg-white rounded-[20px] border border-[#DCE8F5] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs"
        >
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <span
              className="material-symbols-outlined material-symbols-filled text-[#2563EB] text-[20px] shrink-0"
              aria-hidden="true"
            >
              check_circle
            </span>
            <p className="text-[13.5px] text-[#334155]">
              Peran terpilih untuk{' '}
              <strong className="text-[#1B3B6F] font-bold">
                {activeStudent?.name} (Absen {String(activeStudent?.absen || '').padStart(2, '0')})
              </strong>
              :{' '}
              <strong className="text-[#2563EB] font-extrabold">
                {selectedRole || '-'}
              </strong>
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveAndOpenWorkspace}
            disabled={!selectedRole}
            className="w-full sm:w-auto bg-[#2563EB] hover:bg-[#1B3B6F] disabled:opacity-50 text-white font-bold text-[13.5px] px-6 py-3 rounded-full flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <span>Simpan Peran &amp; Buka Workspace</span>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              arrow_forward
            </span>
          </button>
        </section>
      </div>
    </main>
  );
}

export default StudentRoleView;
