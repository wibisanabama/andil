import React, { useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthSession, useRoomData } from '../../utils/storageSync';
import {
  isDeadlineLocked,
  canManageTask,
  validateCompletedEvidence,
} from '../../utils/permissions';
import { StudentWaitingRoom } from './StudentWaitingRoom';

function formatTimestamp(date = new Date()) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month}, ${hours}:${minutes}`;
}

function getAvatarInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  return parts[0].slice(0, 2).toUpperCase();
}

const KANBAN_COLUMNS = [
  {
    id: 'Not Started',
    title: '1. NOT STARTED',
    dotColor: 'bg-[#64748B]',
    badgeStyle: 'bg-white text-[#475569] border-[#CBD5E1]/50',
  },
  {
    id: 'In Progress',
    title: '2. IN PROGRESS',
    dotColor: 'bg-[#0B57D0]',
    badgeStyle: 'bg-white text-[#0B57D0] border-[#0B57D0]/30',
  },
  {
    id: 'On Hold',
    title: '3. ON HOLD / TERKENDALA',
    dotColor: 'bg-[#F59E0B]',
    badgeStyle: 'bg-white text-[#B45309] border-[#F59E0B]/30',
  },
  {
    id: 'Completed',
    title: '4. COMPLETED (WAJIB BUKTI)',
    dotColor: 'bg-[#10B981]',
    badgeStyle: 'bg-[#D1FAE5] text-[#047857] border-transparent',
  },
];

export function StudentWorkspace() {
  const { student: studentSession } = useAuthSession();
  const [roomData, updateData] = useRoomData(studentSession?.roomCode);

  const currentStudentId = studentSession?.id || '';
  const isRoomLocked = isDeadlineLocked(roomData?.room);

  const allStudents = useMemo(() => roomData?.students || [], [roomData?.students]);
  const allGroups = useMemo(() => roomData?.groups || [], [roomData?.groups]);

  // Data siswa aktif dari database
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

  const groupNameLabel = currentGroup?.name || studentSession?.groupName || 'Kelompok';

  // Anggota kelompok yang sama dengan siswa aktif
  const groupStudents = useMemo(() => {
    if (!currentGroupId) return [];
    return allStudents
      .filter((s) => s.groupId === currentGroupId)
      .sort((a, b) => a.absen - b.absen);
  }, [allStudents, currentGroupId]);

  // Daftar task milik kelompok siswa aktif
  const groupTasks = useMemo(() => {
    if (!currentGroupId) return [];
    const allTasks = roomData?.tasks || [];
    return allTasks.filter((t) => t.groupId === currentGroupId);
  }, [roomData?.tasks, currentGroupId]);

  const completedCount = useMemo(() => {
    return groupTasks.filter((t) => t.status === 'Completed').length;
  }, [groupTasks]);

  const totalTasksCount = groupTasks.length;
  const progressPercent =
    totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;

  // State Modal Kumpulkan Bukti
  const [evidenceModalTask, setEvidenceModalTask] = useState(null);
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [evidenceLink, setEvidenceLink] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceError, setEvidenceError] = useState('');

  // State Modal Riwayat Log
  const [logModalTask, setLogModalTask] = useState(null);

  // State Modal Tambah Task Baru
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStatus, setNewStatus] = useState('Not Started');
  const [createError, setCreateError] = useState('');

  // State Modal Edit Task
  const [editModalTask, setEditModalTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editError, setEditError] = useState('');

  if (!studentSession) {
    return <Navigate to="/siswa" replace />;
  }

  // Selama Guru belum menyelesaikan pembagian kelompok, tahan siswa di Ruang Tunggu
  if (!roomData?.room?.isGroupFinalized) {
    return <StudentWaitingRoom roomData={roomData} studentSession={studentSession} />;
  }

  // Setelah Guru menyelesaikan pembagian kelompok, pastikan siswa sudah memilih peran terlebih dahulu
  if (activeStudent && !activeStudent.role) {
    return <Navigate to="/siswa/peran" replace />;
  }

  const openEvidenceModal = (task) => {
    setEvidenceModalTask(task);
    setEvidenceNotes(task.evidence?.notes || '');
    setEvidenceLink(task.evidence?.linkUrl || '');
    setEvidenceFile(null);
    setEvidenceError('');
  };

  const handleSubmitEvidence = (e) => {
    e.preventDefault();
    if (!evidenceModalTask) return;

    const evidenceData = {
      notes: evidenceNotes.trim(),
      linkUrl: evidenceLink.trim(),
      fileName: evidenceFile
        ? evidenceFile.name
        : evidenceModalTask.evidence?.fileName || '',
      fileSize: evidenceFile
        ? `${(evidenceFile.size / (1024 * 1024)).toFixed(1)} MB`
        : evidenceModalTask.evidence?.fileSize || '',
      submittedAt: formatTimestamp(new Date()),
    };

    const validation = validateCompletedEvidence(evidenceData);
    if (!validation.valid) {
      setEvidenceError(validation.errors[0]);
      return;
    }

    const timestamp = formatTimestamp(new Date());
    const newLog = {
      time: timestamp,
      actor: activeStudent.name,
      action: 'Mengirim bukti & menyelesaikan task (Completed)',
    };

    updateData((prev) => {
      const updatedTasks = (prev.tasks || []).map((t) => {
        if (t.id === evidenceModalTask.id) {
          return {
            ...t,
            status: 'Completed',
            evidence: evidenceData,
            logs: [...(t.logs || []), newLog],
          };
        }
        return t;
      });

      return {
        ...prev,
        tasks: updatedTasks,
      };
    });

    setEvidenceModalTask(null);
  };

  const handleStatusChange = (task, targetStatus) => {
    if (isRoomLocked) {
      alert('Room telah dikunci oleh guru. Seluruh task dalam mode Hanya Baca.');
      return;
    }

    const permission = canManageTask(task, currentStudentId, roomData?.room);
    if (!permission.allowed) {
      alert(permission.reason);
      return;
    }

    if (targetStatus === 'Completed') {
      openEvidenceModal(task);
      return;
    }

    const timestamp = formatTimestamp(new Date());
    const statusLabel =
      targetStatus === 'On Hold' ? 'On Hold / Terkendala' : targetStatus;
    const newLog = {
      time: timestamp,
      actor: activeStudent.name,
      action: `Mengubah status ke ${statusLabel}`,
    };

    updateData((prev) => {
      const updatedTasks = (prev.tasks || []).map((t) => {
        if (t.id === task.id) {
          return {
            ...t,
            status: targetStatus,
            logs: [...(t.logs || []), newLog],
          };
        }
        return t;
      });

      return {
        ...prev,
        tasks: updatedTasks,
      };
    });
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setCreateError('Judul task wajib diisi.');
      return;
    }

    const timestamp = formatTimestamp(new Date());
    const newTask = {
      id: `tsk-${Date.now()}`,
      roomCode: roomData?.room?.code || studentSession.roomCode,
      groupId: currentGroupId,
      ownerId: currentStudentId,
      ownerName: activeStudent.name,
      ownerRole: activeStudent.role || 'Anggota',
      title: newTitle.trim(),
      description: newDesc.trim() || 'Deskripsi task pengerjaan kelompok.',
      status: newStatus,
      evidence: null,
      logs: [
        {
          time: timestamp,
          actor: activeStudent.name,
          action: `Membuat task (${newStatus === 'On Hold' ? 'On Hold / Terkendala' : newStatus})`,
        },
      ],
    };

    updateData((prev) => ({
      ...prev,
      tasks: [...(prev.tasks || []), newTask],
    }));

    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    setNewStatus('Not Started');
    setCreateError('');
  };

  const openEditModal = (task) => {
    if (isRoomLocked) {
      alert('Room telah dikunci oleh guru (Mode Hanya Baca).');
      return;
    }
    const permission = canManageTask(task, currentStudentId, roomData?.room);
    if (!permission.allowed) {
      alert(permission.reason);
      return;
    }
    setEditModalTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditError('');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      setEditError('Judul task wajib diisi.');
      return;
    }

    const timestamp = formatTimestamp(new Date());
    const newLog = {
      time: timestamp,
      actor: activeStudent.name,
      action: 'Memperbarui judul dan rincian task',
    };

    updateData((prev) => {
      const updatedTasks = (prev.tasks || []).map((t) => {
        if (t.id === editModalTask.id) {
          return {
            ...t,
            title: editTitle.trim(),
            description: editDesc.trim(),
            logs: [...(t.logs || []), newLog],
          };
        }
        return t;
      });

      return {
        ...prev,
        tasks: updatedTasks,
      };
    });

    setEditModalTask(null);
  };

  const handleDeleteTask = (task) => {
    if (isRoomLocked) {
      alert('Room telah dikunci oleh guru (Mode Hanya Baca).');
      return;
    }
    const permission = canManageTask(task, currentStudentId, roomData?.room);
    if (!permission.allowed) {
      alert(permission.reason);
      return;
    }

    updateData((prev) => ({
      ...prev,
      tasks: (prev.tasks || []).filter((t) => t.id !== task.id),
    }));
  };

  return (
    <main className="bg-[#F8FAFD] min-h-[calc(100vh-72px)] py-8 px-4 sm:px-8">
      <div className="max-w-[1360px] mx-auto">
        {isRoomLocked && (
          <div className="bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E] p-4 rounded-2xl mb-6 flex items-center gap-3 text-sm font-semibold">
            <span className="material-symbols-outlined text-[22px] text-[#B45309]">
              lock_clock
            </span>
            <p>
              Batas waktu pengumpulan (Deadline) telah dikunci oleh Guru. Papan Kanban berada dalam mode <strong>Hanya Baca (Read-Only)</strong>.
            </p>
          </div>
        )}

        {/* Kartu Header Workspace */}
        <section className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-7 mb-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
            {/* Sisi Kiri */}
            <div>
              <div className="flex items-center flex-wrap gap-2.5 mb-2">
                <span className="text-[13px] text-[#475569] font-medium">
                  {groupNameLabel} • Tugas: {roomData?.room?.taskTitle || '-'}
                  {roomData?.room?.deadlineLabel && roomData.room.deadlineLabel !== '-'
                    ? ` • Deadline: ${roomData.room.deadlineLabel}`
                    : ''}
                </span>
              </div>

              <h1 className="text-[26px] sm:text-[28px] font-extrabold text-[#0F172A] tracking-tight mb-2">
                Workspace Kanban {groupNameLabel}
              </h1>

              <div className="flex items-start sm:items-center gap-2 text-[13.5px] text-[#475569]">
                <span
                  className="material-symbols-outlined material-symbols-filled text-[#0B57D0] text-[18px] shrink-0 mt-0.5 sm:mt-0"
                  aria-hidden="true"
                >
                  verified
                </span>
                <p>
                  Kamu login sebagai{' '}
                  <strong className="text-[#0F172A] font-bold">
                    {activeStudent?.name} (Absen {String(activeStudent?.absen || '').padStart(2, '0')})
                  </strong>
                  . Kamu dapat mengelola task milikmu sendiri, sedangkan task teman sekelompokmu bersifat{' '}
                  <strong className="text-[#0F172A] font-bold">Hanya Lihat (Terkunci)</strong>.
                </p>
              </div>
            </div>

            {/* Sisi Kanan: Progres Kelompok & Tombol Buat Task */}
            <div className="lg:w-[320px] shrink-0 flex flex-col gap-3">
              <div className="bg-[#F0F4F9] rounded-2xl p-3.5 border border-[#E2E8F0]/70">
                <div className="flex items-center justify-between text-[13px] mb-1.5">
                  <span className="font-semibold text-[#475569]">Progres {groupNameLabel}</span>
                  <span className="font-bold text-[#0B57D0]">
                    {progressPercent}% ({completedCount}/{totalTasksCount} Task)
                  </span>
                </div>
                <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0B57D0] rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                disabled={isRoomLocked}
                className="w-full bg-[#D3E3FD] hover:bg-[#C2E7FF] disabled:opacity-50 disabled:cursor-not-allowed text-[#041E49] font-bold text-[14px] px-5 py-3 rounded-full flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  add
                </span>
                <span>Buat Task Milikku</span>
              </button>
            </div>
          </div>

          {/* Deretan Pill Anggota Kelompok & Tombol Ubah Peran */}
          <div className="pt-4 border-t border-[#E2E8F0]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {groupStudents.map((member) => {
                const isSelf = member.id === currentStudentId;
                const formattedAbsen = String(member.absen).padStart(2, '0');
                const firstName = member.name.split(' ')[0];

                if (isSelf) {
                  return (
                    <div
                      key={member.id}
                      className="inline-flex items-center justify-center h-8 px-3.5 rounded-full bg-[#D3E3FD] border border-[#0B57D0]/30 text-[12.5px] font-bold text-[#041E49] leading-none shadow-2xs"
                    >
                      {formattedAbsen}. {firstName} (Anda) • {member.role || 'Anggota'}
                    </div>
                  );
                }

                return (
                  <div
                    key={member.id}
                    className="inline-flex items-center justify-center h-8 px-3.5 rounded-full border border-[#E2E8F0] bg-white text-[12.5px] text-[#334155] font-medium leading-none shadow-2xs"
                  >
                    {formattedAbsen}. {firstName} • {member.role || 'Anggota'}
                  </div>
                );
              })}
            </div>

            <Link
              to="/siswa/peran"
              className="inline-flex items-center justify-center h-8 px-3.5 rounded-full bg-[#F0F4F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#0F172A] font-bold text-[12.5px] leading-none gap-1.5 transition-colors no-underline self-start sm:self-center shrink-0"
            >
              <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                badge
              </span>
              <span>Ubah Peran Saya</span>
            </Link>
          </div>
        </section>

        {/* Papan Kanban 4 Kolom Proporsional */}
        <section
          aria-label={`Papan Kanban ${groupNameLabel}`}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch"
        >
          {KANBAN_COLUMNS.map((col) => {
            const columnTasks = groupTasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="bg-[#F0F4F9] rounded-2xl p-4 border border-[#E2E8F0]/70 min-w-0 h-full min-h-[500px] flex flex-col gap-3.5"
              >
                {/* Header Kolom */}
                <div className="flex items-center justify-between gap-2 pb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dotColor}`} aria-hidden="true" />
                    <h2 className="text-[12.5px] font-extrabold tracking-wide text-[#334155] uppercase truncate">
                      {col.title}
                    </h2>
                  </div>
                  <span
                    className={`font-bold text-xs px-2.5 py-0.5 rounded-full border shrink-0 ${col.badgeStyle}`}
                  >
                    {columnTasks.length}
                  </span>
                </div>

                {/* List Kartu Task di Kolom Ini */}
                <div className="flex flex-col gap-3.5 min-w-0">
                  {columnTasks.map((task) => {
                    const isOwnTask = task.ownerId === currentStudentId;
                    const logCount = task.logs?.length || 0;
                    const avatar = getAvatarInitials(task.ownerName);

                    return (
                      <article
                        key={task.id}
                        className={`bg-white rounded-2xl p-4 sm:p-5 flex flex-col gap-3 relative transition-all min-w-0 ${
                          isOwnTask
                            ? 'border-2 border-[#0B57D0] shadow-[0_2px_12px_rgba(11,87,208,0.06)]'
                            : 'border border-[#E2E8F0] shadow-2xs'
                        }`}
                      >
                        {/* Baris Atas Kartu: Badge Kepemilikan & Tombol Log */}
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          {isOwnTask ? (
                            <span className="inline-flex items-center gap-1 h-7 bg-[#D3E3FD] text-[#041E49] text-[11px] font-bold px-2.5 rounded-full whitespace-nowrap shrink-0">
                              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                                person
                              </span>
                              <span>Task Milikmu</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 h-7 bg-[#F0F4F9] text-[#64748B] text-[11px] font-semibold px-2.5 rounded-full whitespace-nowrap truncate">
                              <span className="material-symbols-outlined text-[14px] shrink-0" aria-hidden="true">
                                lock
                              </span>
                              <span className="truncate">Milik {task.ownerName.split(' ')[0]} • Hanya Lihat</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setLogModalTask(task)}
                            className="inline-flex items-center gap-1 h-7 text-[#0B57D0] hover:bg-[#D3E3FD]/40 text-[11.5px] font-bold px-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                            title="Buka Riwayat Aktivitas Task"
                          >
                            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                              history
                            </span>
                            <span>{logCount} Log</span>
                          </button>
                        </div>

                        {/* Judul & Deskripsi Task */}
                        <div>
                          <h3 className="text-[15px] font-bold text-[#0F172A] leading-snug mb-1">
                            {task.title}
                          </h3>
                          <p className="text-[12.5px] text-[#64748B] leading-relaxed">
                            {task.description}
                          </p>
                        </div>

                        {/* Kotak Bukti Pekerjaan (Jika Completed) */}
                        {task.status === 'Completed' && task.evidence && (
                          <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-xl p-3 text-[12px] text-[#166534] flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#15803D]">
                              <span
                                className="material-symbols-outlined material-symbols-filled text-[16px]"
                                aria-hidden="true"
                              >
                                check_circle
                              </span>
                              <span>Bukti Pekerjaan Terlampir</span>
                            </div>
                            <p className="text-[11.5px] text-[#166534] leading-relaxed">
                              {task.evidence.notes}
                            </p>
                            {task.evidence.fileName && (
                              <div className="inline-flex items-center gap-1.5 bg-white border border-[#86EFAC] text-[#166534] px-2.5 py-1 rounded-lg text-[11px] font-semibold w-fit max-w-full truncate shadow-2xs">
                                <span className="material-symbols-outlined text-[14px]">
                                  attachment
                                </span>
                                <span className="truncate">{task.evidence.fileName}</span>
                              </div>
                            )}
                            {task.evidence.linkUrl && (
                              <a
                                href={task.evidence.linkUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 bg-white border border-[#86EFAC] text-[#0B57D0] px-2.5 py-1 rounded-lg text-[11px] font-semibold hover:underline w-fit max-w-full truncate shadow-2xs"
                              >
                                <span className="material-symbols-outlined text-[14px]">
                                  link
                                </span>
                                <span className="truncate">{task.evidence.linkUrl}</span>
                              </a>
                            )}
                          </div>
                        )}

                        {/* Baris Identitas Assignee */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]/70">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#E2E8F0] text-[#0F172A] font-bold text-[12px] flex items-center justify-center shrink-0">
                              {avatar}
                            </div>
                            <div>
                              <p className="text-[12.5px] font-bold text-[#0F172A] leading-tight">
                                {task.ownerName}
                              </p>
                              <p className="text-[11px] text-[#64748B]">
                                {task.ownerRole}
                              </p>
                            </div>
                          </div>

                          {isOwnTask && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => openEditModal(task)}
                                disabled={isRoomLocked}
                                className="border border-[#CBD5E1] hover:bg-[#F0F4F9] disabled:opacity-50 text-[#334155] text-[11.5px] font-bold px-3 py-1 rounded-full transition-colors cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task)}
                                disabled={isRoomLocked}
                                className="border border-[#FECACA] hover:bg-[#FEE2E2] disabled:opacity-50 text-[#DC2626] text-[11.5px] font-bold p-1 rounded-full inline-flex items-center justify-center transition-colors cursor-pointer"
                                title="Hapus Task"
                                aria-label={`Hapus task ${task.title}`}
                              >
                                <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                                  delete
                                </span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Dropdown Pengubah Status (Hanya untuk Task Milik Siswa Aktif) */}
                        {isOwnTask && (
                          <div className="pt-2 border-t border-[#E2E8F0]/70">
                            <label
                              htmlFor={`status-select-${task.id}`}
                              className="text-[10.5px] font-bold uppercase tracking-wider text-[#64748B] block mb-1"
                            >
                              UBAH STATUS TASK:
                            </label>
                            <select
                              id={`status-select-${task.id}`}
                              value={
                                task.status === 'Completed'
                                  ? 'Completed'
                                  : task.status === 'On Hold'
                                  ? 'On Hold'
                                  : task.status === 'In Progress'
                                  ? 'In Progress'
                                  : 'Not Started'
                              }
                              onChange={(e) => handleStatusChange(task, e.target.value)}
                              disabled={isRoomLocked}
                              className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] focus:border-[#0B57D0] focus:ring-2 focus:ring-[#0B57D0]/20 text-[12.5px] font-bold text-[#0F172A] bg-white outline-none cursor-pointer disabled:bg-[#F0F4F9] disabled:cursor-not-allowed"
                            >
                              <option value="Not Started">1. Not Started</option>
                              <option value="In Progress">2. In Progress</option>
                              <option value="On Hold">3. On Hold / Terkendala</option>
                              <option value="Completed">4. Completed (Kumpul Bukti)</option>
                            </select>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      </div>

      {/* MODAL 1: Kumpulkan Bukti Pekerjaan (Completed) */}
      {evidenceModalTask && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setEvidenceModalTask(null)}
              className="absolute top-5 right-5 text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-full hover:bg-[#F0F4F9] transition-colors"
              aria-label="Tutup Modal"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <span className="inline-block bg-[#D1FAE5] text-[#047857] text-[11px] font-bold px-3 py-1 rounded-full mb-3">
              Syarat Wajib Completed
            </span>

            <h2 className="text-[20px] sm:text-[22px] font-extrabold text-[#0F172A] mb-1">
              Kumpulkan Bukti Pekerjaan
            </h2>
            <p className="text-[12.5px] text-[#64748B] mb-5">
              Task: {evidenceModalTask.title} • Pemilik: {evidenceModalTask.ownerName}
            </p>

            <form onSubmit={handleSubmitEvidence} className="space-y-4">
              <div>
                <label
                  htmlFor="evidence-notes"
                  className="text-[13px] font-bold text-[#0F172A] mb-1.5 block"
                >
                  1. Deskripsi Hasil Pekerjaan (Wajib)
                </label>
                <textarea
                  id="evidence-notes"
                  rows={3}
                  value={evidenceNotes}
                  onChange={(e) => {
                    setEvidenceNotes(e.target.value);
                    if (evidenceError) setEvidenceError('');
                  }}
                  placeholder="Jelaskan hasil pekerjaan yang telah kamu selesaikan..."
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] focus:border-[#0B57D0] focus:ring-2 focus:ring-[#0B57D0]/20 text-[13.5px] outline-none text-[#0F172A] placeholder:text-[#94A3B8]"
                />
              </div>

              <div>
                <label
                  htmlFor="evidence-link"
                  className="text-[13px] font-bold text-[#0F172A] mb-1.5 block"
                >
                  2. Tautan Bukti (Link Google Slides / Drive / Canva / Docs)
                </label>
                <input
                  id="evidence-link"
                  type="url"
                  value={evidenceLink}
                  onChange={(e) => {
                    setEvidenceLink(e.target.value);
                    if (evidenceError) setEvidenceError('');
                  }}
                  placeholder="https://docs.google.com/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] focus:border-[#0B57D0] focus:ring-2 focus:ring-[#0B57D0]/20 text-[13px] outline-none text-[#0F172A] placeholder:text-[#94A3B8]"
                />
              </div>

              <div>
                <label
                  htmlFor="evidence-file"
                  className="text-[12.5px] font-semibold text-[#475569] mb-1.5 block"
                >
                  Atau Lampirkan Berkas / Foto Lokal
                </label>
                <input
                  id="evidence-file"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setEvidenceFile(e.target.files[0]);
                      if (evidenceError) setEvidenceError('');
                    }
                  }}
                  className="w-full text-[12.5px] text-[#475569] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[12px] file:font-semibold file:bg-[#F0F4F9] file:text-[#0F172A] hover:file:bg-[#E2E8F0] file:cursor-pointer"
                />
              </div>

              {evidenceError && (
                <div className="bg-[#FEE2E2] text-[#DC2626] text-[12.5px] font-semibold p-3 rounded-xl">
                  {evidenceError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]/80">
                <button
                  type="button"
                  onClick={() => setEvidenceModalTask(null)}
                  className="px-5 py-2.5 rounded-full text-[13.5px] font-bold text-[#475569] hover:bg-[#F0F4F9] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-[13.5px] px-6 py-2.5 rounded-full flex items-center gap-2 shadow-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    check_circle
                  </span>
                  <span>Kirim Bukti &amp; Selesaikan Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Riwayat Log Aktivitas Task */}
      {logModalTask && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setLogModalTask(null)}
              className="absolute top-5 right-5 text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-full hover:bg-[#F0F4F9] transition-colors"
              aria-label="Tutup Modal"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <span className="inline-block bg-[#D3E3FD] text-[#041E49] text-[11px] font-bold px-3 py-1 rounded-full mb-3">
              Riwayat Aktivitas Task
            </span>

            <h2 className="text-[20px] font-extrabold text-[#0F172A] mb-1">
              Log Aktivitas Task
            </h2>
            <p className="text-[12.5px] text-[#64748B] mb-5">
              {logModalTask.title} • Pemilik: {logModalTask.ownerName} ({logModalTask.ownerRole})
            </p>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {(logModalTask.logs || []).map((log, idx) => (
                <div
                  key={idx}
                  className="bg-[#F8FAFD] border border-[#E2E8F0] p-3.5 rounded-xl flex items-start gap-3 text-[12.5px]"
                >
                  <span className="material-symbols-outlined text-[#0B57D0] text-[18px] shrink-0 mt-0.5">
                    schedule
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <strong className="text-[#0F172A] font-bold">{log.actor}</strong>
                      <span className="text-[#64748B] text-[11px] font-medium">{log.time}</span>
                    </div>
                    <p className="text-[#475569]">{log.action}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-[#E2E8F0] flex justify-end">
              <button
                type="button"
                onClick={() => setLogModalTask(null)}
                className="bg-[#F0F4F9] hover:bg-[#E2E8F0] text-[#0F172A] font-bold text-[13px] px-5 py-2 rounded-full transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Tambah Task Milikku */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-full hover:bg-[#F0F4F9] transition-colors"
              aria-label="Tutup Modal"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <span className="inline-block bg-[#D3E3FD] text-[#041E49] text-[11px] font-bold px-3 py-1 rounded-full mb-3">
              Buat Task Milikku
            </span>

            <h2 className="text-[20px] font-extrabold text-[#0F172A] mb-1">
              Tambah Task Baru
            </h2>
            <p className="text-[12.5px] text-[#64748B] mb-5">
              Task ini otomatis menjadi milik <strong className="text-[#0F172A]">{activeStudent?.name} ({activeStudent?.role || 'Anggota'})</strong>.
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label htmlFor="new-task-title" className="text-[13px] font-bold text-[#0F172A] mb-1.5 block">
                  Judul Task (Wajib)
                </label>
                <input
                  id="new-task-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (createError) setCreateError('');
                  }}
                  placeholder="Contoh: Merancang Infografik Penutup"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] focus:border-[#0B57D0] focus:ring-2 focus:ring-[#0B57D0]/20 text-[13.5px] outline-none text-[#0F172A]"
                />
              </div>

              <div>
                <label htmlFor="new-task-desc" className="text-[13px] font-bold text-[#0F172A] mb-1.5 block">
                  Deskripsi Pekerjaan
                </label>
                <textarea
                  id="new-task-desc"
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Rincian sub-pekerjaan yang akan diselesaikan..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] focus:border-[#0B57D0] focus:ring-2 focus:ring-[#0B57D0]/20 text-[13px] outline-none text-[#0F172A]"
                />
              </div>

              <div>
                <label htmlFor="new-task-status" className="text-[13px] font-bold text-[#0F172A] mb-1.5 block">
                  Status Awal
                </label>
                <select
                  id="new-task-status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-[13px] font-semibold text-[#0F172A] bg-white outline-none"
                >
                  <option value="Not Started">1. Not Started</option>
                  <option value="In Progress">2. In Progress</option>
                  <option value="On Hold">3. On Hold / Terkendala</option>
                </select>
              </div>

              {createError && (
                <div className="bg-[#FEE2E2] text-[#DC2626] text-[12.5px] font-semibold p-3 rounded-xl">
                  {createError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-[13px] font-bold text-[#475569] hover:bg-[#F0F4F9] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-[13px] px-6 py-2.5 rounded-full shadow-xs transition-colors"
                >
                  Simpan Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Edit Task Milikku */}
      {editModalTask && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setEditModalTask(null)}
              className="absolute top-5 right-5 text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-full hover:bg-[#F0F4F9] transition-colors"
              aria-label="Tutup Modal"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <span className="inline-block bg-[#D3E3FD] text-[#041E49] text-[11px] font-bold px-3 py-1 rounded-full mb-3">
              Edit Task Milikmu
            </span>

            <h2 className="text-[20px] font-extrabold text-[#0F172A] mb-1">
              Edit Detail Task
            </h2>
            <p className="text-[12.5px] text-[#64748B] mb-5">
              Task ID: {editModalTask.id} • Status: {editModalTask.status}
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label htmlFor="edit-task-title" className="text-[13px] font-bold text-[#0F172A] mb-1.5 block">
                  Judul Task
                </label>
                <input
                  id="edit-task-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => {
                    setEditTitle(e.target.value);
                    if (editError) setEditError('');
                  }}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] focus:border-[#0B57D0] focus:ring-2 focus:ring-[#0B57D0]/20 text-[13.5px] outline-none text-[#0F172A]"
                />
              </div>

              <div>
                <label htmlFor="edit-task-desc" className="text-[13px] font-bold text-[#0F172A] mb-1.5 block">
                  Deskripsi Pekerjaan
                </label>
                <textarea
                  id="edit-task-desc"
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] focus:border-[#0B57D0] focus:ring-2 focus:ring-[#0B57D0]/20 text-[13px] outline-none text-[#0F172A]"
                />
              </div>

              {editError && (
                <div className="bg-[#FEE2E2] text-[#DC2626] text-[12.5px] font-semibold p-3 rounded-xl">
                  {editError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditModalTask(null)}
                  className="px-5 py-2.5 rounded-full text-[13px] font-bold text-[#475569] hover:bg-[#F0F4F9] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-[13px] px-6 py-2.5 rounded-full shadow-xs transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default StudentWorkspace;
