/**
 * Modul Validasi Hak Akses & Aturan Bisnis Andil (src/utils/permissions.js)
 * Sesuai Spesifikasi MVP.md (Bagian 2, 4, & 7.B) & Issue #5-#6
 *
 * Aturan Utama:
 * 1. Kunci 1 Ketua Kelompok: Peran 'Ketua Kelompok' maksimal 1 orang per kelompok.
 * 2. Kepemilikan Task: Siswa aktif (std-02 — Budi Santoso) hanya boleh mengedit atau
 *    memindahkan status task yang task.ownerId === 'std-02'.
 * 3. Kunci Deadline: Apabila room.isDeadlineLocked === true atau deadline terlewati,
 *    seluruh aksi tambah, edit, dan pindah status task oleh siswa ditolak (Hanya Baca / Read-Only).
 * 4. Wajib Bukti: Pemindahan status ke 'Completed' mewajibkan lampiran bukti (catatan & link/berkas).
 */

export const ROLE_LEADER_NAME = 'Ketua Kelompok';
export const ACTIVE_STUDENT_ID = 'std-02';

/**
 * Memeriksa apakah seorang siswa diizinkan memilih peran tertentu di dalam kelompoknya.
 *
 * @param {string} roleName - Nama peran yang ingin dipilih
 * @param {string} studentId - ID siswa yang sedang aktif (misal: 'std-02' Budi Santoso)
 * @param {Array} groupStudents - Daftar siswa dalam kelompok yang sama
 * @returns {{ allowed: boolean, reason?: string, currentHolder?: object }}
 */
export function canSelectRole(roleName, studentId, groupStudents = []) {
  if (!roleName) {
    return { allowed: false, reason: 'Peran tidak valid' };
  }

  // Aturan Kunci: Ketua Kelompok maksimal 1 orang per kelompok
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
 * Memeriksa apakah batas waktu (deadline) Room telah terlewati atau dikunci oleh guru.
 *
 * @param {object} room
 * @returns {boolean}
 */
export function isDeadlineLocked(room) {
  if (!room) return false;
  if (room.isDeadlineLocked) return true;
  if (!room.deadline) return false;

  const deadlineDate = new Date(room.deadline);
  return !isNaN(deadlineDate.getTime()) && Date.now() > deadlineDate.getTime();
}

/**
 * Memeriksa apakah siswa memiliki hak untuk membuat task baru.
 *
 * @param {string} studentId
 * @param {object} room
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canCreateTask(studentId = ACTIVE_STUDENT_ID, room = null) {
  if (isDeadlineLocked(room)) {
    return {
      allowed: false,
      reason: 'Room telah dikunci oleh Guru / batas waktu telah berakhir. Mode Hanya Baca.',
    };
  }
  return { allowed: true };
}

/**
 * Memeriksa apakah siswa memiliki hak untuk mengedit task atau mengubah statusnya.
 * Memvalidasi kepemilikan task (task.ownerId === studentId) dan status deadline room.
 *
 * @param {object} task
 * @param {string} currentStudentId
 * @param {object} room
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canManageTask(task, currentStudentId = ACTIVE_STUDENT_ID, room = null) {
  if (!task) {
    return { allowed: false, reason: 'Task tidak ditemukan.' };
  }

  // Cek kunci deadline
  if (isDeadlineLocked(room)) {
    return {
      allowed: false,
      reason: 'Room telah dikunci / batas waktu telah berakhir (Hanya Baca).',
    };
  }

  // Cek kepemilikan task
  const ownerId = task.ownerId || task.assigneeId;
  if (ownerId !== currentStudentId) {
    return {
      allowed: false,
      reason: `Task ini milik ${task.ownerName || 'anggota lain'}. Anda hanya memiliki akses Lihat.`,
    };
  }

  return { allowed: true };
}

/**
 * Helper boolean: apakah siswa boleh mengedit task ini.
 */
export function canEditTask(task, currentStudentId = ACTIVE_STUDENT_ID, room = null) {
  return canManageTask(task, currentStudentId, room).allowed;
}

/**
 * Helper boolean: apakah siswa boleh memindahkan status task ini.
 */
export function canMoveTaskStatus(task, currentStudentId = ACTIVE_STUDENT_ID, room = null) {
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
  ACTIVE_STUDENT_ID,
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
