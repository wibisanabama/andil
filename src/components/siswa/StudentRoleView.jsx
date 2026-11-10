import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomData } from '../../utils/storageSync';
import { ACTIVE_STUDENT_POV } from '../../data/sampleRoomData';
import { canSelectRole, isRoleLocked, ROLE_LEADER_NAME } from '../../utils/permissions';

const ROLE_METADATA = {
  'Ketua Kelompok': {
    icon: 'lock',
    defaultDescription: 'Mengatur pembagian kerja dan memastikan kelengkapan tugas tim.',
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
  'Presenter': {
    icon: 'record_voice_over',
    defaultDescription: 'Menyiapkan narasi dan menyampaikan presentasi di depan kelas.',
  },
};

export function StudentRoleView() {
  const navigate = useNavigate();
  const [roomData, updateData] = useRoomData();

  // Siswa aktif POV Siswa (Budi Santoso - std-02 - Absen 02)
  const currentStudentId = ACTIVE_STUDENT_POV.id;

  // Temukan data siswa aktif dan rekan satu kelompok (Kelompok 1)
  const groupStudents = useMemo(() => {
    const allStudents = roomData?.students || [];
    return allStudents.filter((s) => s.groupId === ACTIVE_STUDENT_POV.groupId);
  }, [roomData?.students]);

  const activeStudent = useMemo(() => {
    return (
      groupStudents.find((s) => s.id === currentStudentId) || {
        ...ACTIVE_STUDENT_POV,
      }
    );
  }, [groupStudents, currentStudentId]);

  // State peran terpilih oleh Budi (default: 'Pembuat PPT' sesuai spesifikasi MVP)
  const [selectedRole, setSelectedRole] = useState(
    () => activeStudent.role || 'Pembuat PPT'
  );

  const availableRoles = useMemo(() => {
    return (
      roomData?.room?.availableRoles || [
        'Ketua Kelompok',
        'Pembuat PPT',
        'Pencari Materi',
        'Penyusun Laporan',
        'Presenter',
      ]
    );
  }, [roomData?.room?.availableRoles]);

  // Temukan pemegang peran di antara rekan sekelompok (selain Budi)
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
      // Role terkunci (contoh: Ketua Kelompok yang sudah diambil Andi)
      return;
    }
    setSelectedRole(role);
  };

  const handleSaveAndOpenWorkspace = () => {
    // Simpan pilihan peran Budi ke LocalStorage
    updateData((prev) => {
      const updatedStudents = (prev.students || []).map((student) => {
        if (student.id === currentStudentId) {
          return {
            ...student,
            role: selectedRole,
          };
        }
        return student;
      });

      return {
        ...prev,
        students: updatedStudents,
      };
    });

    // Arahkan ke /siswa/workspace
    navigate('/siswa/workspace');
  };

  return (
    <main className="bg-[#F8FAFD] min-h-[calc(100vh-72px)] py-8 px-4 sm:px-8">
      <div className="max-w-[1240px] mx-auto">
        {/* Banner Atas: Judul & Anggota Kelompok 1 */}
        <section className="bg-white rounded-[24px] border border-[#E2E8F0] p-6 sm:p-7 mb-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Sisi Kiri: Badge, Judul, & Deskripsi */}
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[13.5px] font-bold text-[#475569]">
                Kelompok 1 (5 Anggota)
              </span>
            </div>
            <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A] tracking-tight mb-2">
              Pilih Peranmu di Kelompok 1
            </h1>
            <p className="text-[13.5px] text-[#64748B] leading-relaxed">
              Pilih 1 peran dari daftar peran yang telah ditentukan guru. Posisi{' '}
              <strong className="text-[#0F172A] font-bold">Ketua Kelompok</strong> dikunci maksimal 1 siswa di setiap kelompok.
            </p>
          </div>

          {/* Sisi Kanan: Kartu Anggota Kelompok 1 */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0]/80 p-4 sm:p-5 lg:max-w-md w-full shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2.5 block">
              ANGGOTA KELOMPOK 1
            </span>
            <div className="flex flex-wrap gap-2">
              {groupStudents.map((member) => {
                const isBudi = member.id === currentStudentId;
                const displayRole = isBudi ? selectedRole : member.role;

                if (isBudi) {
                  return (
                    <div
                      key={member.id}
                      className="bg-[#D3E3FD] border border-[#0B57D0]/30 rounded-full pl-1.5 pr-3.5 py-1 text-[12px] font-bold text-[#041E49] flex items-center gap-1.5 shadow-2xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#0B57D0] text-white flex items-center justify-center text-[10px] font-extrabold shrink-0">
                        02
                      </span>
                      <span>
                        Budi Santoso ({displayRole})
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={member.id}
                    className="border border-[#E2E8F0] bg-white rounded-full px-3 py-1 text-[12px] text-[#334155] font-medium flex items-center gap-1.5 shadow-2xs"
                  >
                    <span className="text-[#64748B] font-mono text-[11px]">
                      {String(member.absen).padStart(2, '0')}
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

            // KONDISI 1: Peran Terkunci (Ketua Kelompok yang sudah diambil Andi)
            if (isLocked) {
              return (
                <div
                  key={role}
                  className="bg-[#F8FAFD] border border-[#E2E8F0] rounded-2xl p-6 relative flex flex-col justify-between cursor-not-allowed opacity-90 transition-all select-none"
                >
                  <div>
                    {/* Top Row: Lock Icon & Terkunci Badge */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#E2E8F0] text-[#64748B] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                          lock
                        </span>
                      </div>
                      <span className="inline-flex items-center bg-[#FEE2E2] text-[#DC2626] text-[11px] font-bold px-2.5 py-1 rounded-full">
                        Terkunci (Maks 1 Ketua)
                      </span>
                    </div>

                    {/* Role Title & Description */}
                    <h2 className="text-[17px] font-bold text-[#0F172A] mb-1.5">
                      {role}
                    </h2>
                    <p className="text-[13px] text-[#64748B] leading-relaxed mb-6">
                      {meta.defaultDescription}
                    </p>
                  </div>

                  {/* Bottom Footer: Sudah diambil oleh */}
                  <div className="pt-4 border-t border-[#E2E8F0]/70 flex items-center gap-1.5 text-[12px] font-bold text-[#DC2626]">
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                      person
                    </span>
                    <span>
                      Sudah diambil oleh: {otherHolder?.name || 'Andi Pratama'}
                    </span>
                  </div>
                </div>
              );
            }

            // KONDISI 2: Peran Terpilih oleh Budi (Peranmu Saat Ini)
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
                  className="bg-white border-2 border-[#0B57D0] rounded-2xl p-6 relative flex flex-col justify-between cursor-pointer shadow-[0_4px_20px_rgba(11,87,208,0.08)] transition-all"
                >
                  <div>
                    {/* Top Row: Active Icon & Peranmu Saat Ini Badge */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#0B57D0] text-white flex items-center justify-center shadow-2xs">
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                          {meta.icon}
                        </span>
                      </div>
                      <span className="inline-flex items-center bg-[#0B57D0] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs">
                        Peranmu Saat Ini
                      </span>
                    </div>

                    {/* Role Title & Description */}
                    <h2 className="text-[17px] font-bold text-[#0F172A] mb-1.5">
                      {role}
                    </h2>
                    <p className="text-[13px] text-[#64748B] leading-relaxed mb-6">
                      {meta.defaultDescription}
                    </p>
                  </div>

                  {/* Bottom Footer: Diisi oleh Budi & Check Icon */}
                  <div className="pt-4 border-t border-[#E2E8F0]/70 flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold text-[#475569]">
                      Diisi oleh: <strong className="text-[#0F172A]">Budi</strong>
                    </span>
                    <span
                      className="material-symbols-outlined material-symbols-filled text-[#0B57D0] text-[22px]"
                      aria-hidden="true"
                    >
                      check_circle
                    </span>
                  </div>
                </div>
              );
            }

            // KONDISI 3: Peran Lainnya (Tersedia untuk dipilih)
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
                className="bg-white border border-[#E2E8F0] hover:border-[#0B57D0]/50 hover:shadow-xs rounded-2xl p-6 relative flex flex-col justify-between cursor-pointer transition-all"
              >
                <div>
                  {/* Top Row: Default Icon & Tersedia Badge */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#D3E3FD] text-[#0B57D0] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                        {meta.icon}
                      </span>
                    </div>
                    <span className="inline-flex items-center bg-[#F0F4F9] text-[#475569] text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      Tersedia
                    </span>
                  </div>

                  {/* Role Title & Description */}
                  <h2 className="text-[17px] font-bold text-[#0F172A] mb-1.5">
                    {role}
                  </h2>
                  <p className="text-[13px] text-[#64748B] leading-relaxed mb-6">
                    {meta.defaultDescription}
                  </p>
                </div>

                {/* Bottom Footer: Diisi oleh & Radio Circle */}
                <div className="pt-4 border-t border-[#E2E8F0]/70 flex items-center justify-between gap-2">
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
          className="bg-white rounded-[20px] border border-[#E2E8F0] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs"
        >
          {/* Keterangan Peran Terpilih */}
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <span
              className="material-symbols-outlined material-symbols-filled text-[#0B57D0] text-[20px] shrink-0"
              aria-hidden="true"
            >
              check_circle
            </span>
            <p className="text-[13.5px] text-[#334155]">
              Peran terpilih untuk{' '}
              <strong className="text-[#0F172A] font-bold">
                Budi Santoso (Absen 02)
              </strong>
              :{' '}
              <strong className="text-[#0B57D0] font-extrabold">
                {selectedRole}
              </strong>
            </p>
          </div>

          {/* Tombol Simpan Peran & Buka Workspace */}
          <button
            type="button"
            onClick={handleSaveAndOpenWorkspace}
            className="w-full sm:w-auto bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-[13.5px] px-6 py-3 rounded-full flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
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

