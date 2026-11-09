/**
 * Modul Validasi Hak Akses & Aturan Bisnis Andil (src/utils/permissions.js)
 * Sesuai Spesifikasi MVP.md (Bagian 2, 4, & 7.B)
 *
 * Aturan Utama:
 * 1. Kunci 1 Ketua Kelompok: Peran 'Ketua Kelompok' maksimal 1 orang per kelompok.
 * 2. Kepemilikan Task: Siswa hanya dapat mengedit, memindahkan, atau menghapus task miliknya sendiri.
 * 3. Wajib Bukti: Pemindahan task ke status 'Completed' mewajibkan lampiran bukti (catatan & link/berkas).
 * 4. Kunci Deadline: Jika deadline terlewati atau room dikunci, aksi modifikasi dibatasi.
 */

export const ROLE_LEADER_NAME = 'Ketua Kelompok';

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
 *
 * @param {string} roleName
 * @param {string} studentId
 * @param {Array} groupStudents
 * @returns {boolean}
 */
export function isRoleLocked(roleName, studentId, groupStudents = []) {
  return !canSelectRole(roleName, studentId, groupStudents).allowed;
}

/**
 * Mencari siswa dalam kelompok yang sedang memegang peran tertentu.
 *
 * @param {string} roleName
 * @param {Array} groupStudents
 * @returns {object|null}
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
 * Memeriksa apakah siswa memiliki hak untuk mengedit task.
 * Hanya pemilik task yang berhak mengedit status atau konten task miliknya.
 *
 * @param {object} task
 * @param {string} currentStudentId
 * @returns {boolean}
 */
export function canEditTask(task, currentStudentId) {
  if (!task || !currentStudentId) return false;
  return task.assigneeId === currentStudentId;
}

/**
 * Memeriksa apakah bukti pekerjaan valid untuk menyelesaikan task (Completed).
 * Wajib memiliki deskripsi hasil kerja (notes minimal 5 karakter) dan salah satu bukti (linkUrl / fileName).
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
  if (notes.length < 5) {
    errors.push('Deskripsi hasil kerja wajib diisi (minimal 5 karakter).');
  }

  const hasLink = Boolean((evidence.linkUrl || '').trim());
  const hasFile = Boolean((evidence.fileName || '').trim());

  if (!hasLink && !hasFile) {
    errors.push('Wajib menyertakan minimal 1 bukti: Tautan URL atau Lampiran Berkas.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Memeriksa apakah batas waktu (deadline) Room telah terlewati atau dikunci.
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

export default {
  ROLE_LEADER_NAME,
  canSelectRole,
  isRoleLocked,
  getStudentByRole,
  canEditTask,
  validateCompletedEvidence,
  isDeadlineLocked,
};

