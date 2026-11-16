/**
 * Modul Validasi Hak Akses & Aturan Bisnis Andil (src/utils/permissions.js)
 *
 * Aturan Utama:
 * 1. Kunci 1 Ketua Kelompok: Peran 'Ketua Kelompok' maksimal 1 orang per kelompok.
 * 2. Kepemilikan Task: Siswa yang sedang login hanya boleh mengedit, menghapus, atau
 *    memindahkan status task yang task.ownerId === currentStudentId.
 * 3. Kunci Deadline: Apabila room.isDeadlineLocked === true, seluruh aksi tambah,
 *    edit, hapus, dan pindah status task oleh siswa ditolak (Hanya Baca / Read-Only).
 * 4. Wajib Bukti: Pemindahan status ke 'Completed' mewajibkan lampiran bukti (catatan & link/berkas).
 */

export const ROLE_LEADER_NAME = 'Ketua Kelompok';

/**
 * Memeriksa apakah seorang siswa diizinkan memilih peran tertentu di dalam kelompoknya.
 *
 * @param {string} roleName - Nama peran yang ingin dipilih
 * @param {string} studentId - ID siswa yang sedang login
 * @param {Array} groupStudents - Daftar siswa dalam kelompok yang sama
 * @returns {{ allowed: boolean, reason?: string, currentHolder?: object }}
 */
export function canSelectRole(roleName, studentId, groupStudents = []) {
  if (!roleName) {
    return { allowed: false, reason: 'Peran tidak valid' };
  }

  if (roleName.trim().toLowerCase() === ROLE_LEADER_NAME.toLowerCase()) {
    const leader = groupStudents.find(
      (s) =>
        s.id !== studentId &&
        s.role &&
        s.role.trim().toLowerCase() === ROLE_LEADER_NAME.toLowerCase()
    );

    if (leader) {
      return {
        allowed: false,
        reason: `Sudah diambil oleh: ${leader.name}`,
        currentHolder: leader,
      };
    }
  } else {
    // Jika seluruh anggota lain sudah memilih peran selain Ketua Kelompok,
    // maka anggota terakhir wajib mengambil peran Ketua Kelompok.
    const otherMembers = groupStudents.filter((s) => s.id !== studentId);
    const allOthersHaveRole =
      otherMembers.length > 0 && otherMembers.every((s) => Boolean(s.role));
    const otherHasLeader = otherMembers.some(
      (s) => s.role && s.role.trim().toLowerCase() === ROLE_LEADER_NAME.toLowerCase()
    );

    if (allOthersHaveRole && !otherHasLeader) {
      return {
        allowed: false,
        reason: 'Wajib pilih Ketua Kelompok (belum ada Ketua di kelompok ini)',
      };
    }
  }

  return { allowed: true };
}

/**
 * Mengetahui apakah kartu peran terkunci (disabled) untuk siswa tertentu.
 */
export function isRoleLocked(roleName, studentId, groupStudents = []) {
  return !canSelectRole(roleName, studentId, groupStudents).allowed;
}

/**
 * Mencari siswa dalam kelompok yang sedang memegang peran tertentu.
 */
export function getStudentByRole(roleName, groupStudents = []) {
  if (!roleName) return null;
  return (
    groupStudents.find(
      (s) => s.role && s.role.trim().toLowerCase() === roleName.trim().toLowerCase()
    ) || null
  );
}

/**
 * Memeriksa apakah batas waktu (deadline) Room telah dikunci oleh guru.
 *
 * @param {object} room
 * @returns {boolean}
 */
export function isDeadlineLocked(room) {
  if (!room) return false;
  return Boolean(room.isDeadlineLocked);
}

/**
 * Memeriksa apakah siswa memiliki hak untuk membuat task baru.
 *
 * @param {string} studentId
 * @param {object} room
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canCreateTask(studentId, room = null) {
  if (!studentId) {
    return { allowed: false, reason: 'Silakan masuk ke Room terlebih dahulu.' };
  }
  if (isDeadlineLocked(room)) {
    return {
      allowed: false,
      reason: 'Room telah dikunci oleh Guru. Mode Hanya Baca.',
    };
  }
  return { allowed: true };
}

/**
 * Memeriksa apakah siswa memiliki hak untuk mengedit, menghapus, atau mengubah status task.
 *
 * @param {object} task
 * @param {string} currentStudentId
 * @param {object} room
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canManageTask(task, currentStudentId, room = null) {
  if (!task) {
    return { allowed: false, reason: 'Task tidak ditemukan.' };
  }
  if (!currentStudentId) {
    return { allowed: false, reason: 'Silakan masuk ke Room terlebih dahulu.' };
  }

  if (isDeadlineLocked(room)) {
    return {
      allowed: false,
      reason: 'Room telah dikunci oleh Guru (Hanya Baca).',
    };
  }

  const ownerId = task.ownerId || task.assigneeId;
  if (ownerId !== currentStudentId) {
    return {
      allowed: false,
      reason: `Task ini milik ${task.ownerName || 'anggota lain'}. Anda hanya memiliki akses Lihat.`,
    };
  }

  return { allowed: true };
}

export function canEditTask(task, currentStudentId, room = null) {
  return canManageTask(task, currentStudentId, room).allowed;
}

export function canMoveTaskStatus(task, currentStudentId, room = null) {
  return canManageTask(task, currentStudentId, room).allowed;
}

/**
 * Memeriksa apakah bukti pekerjaan valid untuk menyelesaikan task (Completed).
 * Wajib memiliki deskripsi hasil kerja (notes) dan salah satu bukti (linkUrl / fileName).
 *
 * @param {object} evidence
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCompletedEvidence(evidence) {
  const errors = [];
  if (!evidence) {
    return { valid: false, errors: ['Bukti pekerjaan wajib diisi.'] };
  }

  const notes = (evidence.notes || '').trim();
  if (!notes || notes.length < 3) {
    errors.push('Deskripsi hasil pekerjaan wajib diisi.');
  }

  const hasLink = Boolean((evidence.linkUrl || '').trim());
  const hasFile = Boolean((evidence.fileName || '').trim());

  if (!hasLink && !hasFile) {
    errors.push('Wajib menyertakan minimal 1 bukti: Tautan URL atau Lampiran Berkas Lokal.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  ROLE_LEADER_NAME,
  canSelectRole,
  isRoleLocked,
  getStudentByRole,
  isDeadlineLocked,
  canCreateTask,
  canManageTask,
  canEditTask,
  canMoveTaskStatus,
  validateCompletedEvidence,
};
