/**
 * Utility helper untuk kalkulasi kapasitas kelompok yang seimbang dan alokasi siswa
 */

export const DEFAULT_GROUP_ROLES = [
  'Ketua Kelompok',
  'Pembuat PPT',
  'Pencari Materi',
  'Penyusun Laporan',
  'Presenter',
];

/**
 * Menghitung kapasitas per kelompok secara seimbang berdasarkan total siswa dan jumlah kelompok.
 * Sisa pembagian (remainder) didistribusikan ke kelompok-kelompok awal (+1).
 *
 * @param {number} totalStudents - Jumlah total siswa yang direncanakan
 * @param {number} groupCount - Jumlah kelompok yang diinginkan
 * @param {string} [roomCode] - Kode room opsional untuk membuat ID unik per room
 * @returns {Array<{ id: string, name: string, capacity: number }>}
 */
export function calculateGroupCapacities(totalStudents = 30, groupCount = 6, roomCode = '') {
  const safeGroupCount = Math.max(1, Number(groupCount) || 1);
  const safeTotalStudents = Math.max(0, Number(totalStudents) || 0);

  const base = Math.floor(safeTotalStudents / safeGroupCount);
  const remainder = safeTotalStudents % safeGroupCount;
  const prefix = roomCode ? `grp-${roomCode.toLowerCase()}` : 'grp';

  return Array.from({ length: safeGroupCount }, (_, i) => ({
    id: `${prefix}-${i + 1}`,
    name: `Kelompok ${i + 1}`,
    capacity: i < remainder ? base + 1 : base,
  }));
}

/**
 * Memformat distribusi kapasitas kelompok ke dalam bentuk string (contoh: "5-5-5-5-5-5")
 *
 * @param {Array<{ capacity: number } | number>} groups
 * @returns {string}
 */
export function formatCapacityDistribution(groups) {
  if (!Array.isArray(groups) || groups.length === 0) return '-';
  return groups
    .map((g) => (typeof g === 'number' ? g : g?.capacity ?? 0))
    .join('-');
}

/**
 * Mengacak seluruh siswa di dalam room (Fisher-Yates) dan membagikannya ke kelompok
 * secara proporsional sesuai kapasitas masing-masing kelompok.
 *
 * @param {Array<Object>} students - Daftar siswa
 * @param {Array<{ id: string, capacity: number }>} groups - Daftar kelompok beserta kapasitasnya
 * @returns {Array<Object>} Daftar siswa yang telah dialokasikan, terurut berdasarkan nomor absen
 */
export function allocateStudentsAuto(students = [], groups = []) {
  if (!Array.isArray(students)) return [];
  if (!Array.isArray(groups) || groups.length === 0) return [...students];

  const shuffled = [...students];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const allocated = [];
  let cursor = 0;

  for (const group of groups) {
    const capacity = group.capacity || 1;
    for (let slot = 0; slot < capacity && cursor < shuffled.length; slot++) {
      const student = shuffled[cursor++];
      allocated.push({
        ...student,
        groupId: group.id,
      });
    }
  }

  // Jika jumlah siswa melebihi rencana kapasitas awal, distribusikan merata ke kelompok yang ada
  while (cursor < shuffled.length) {
    const student = shuffled[cursor];
    const targetGroup = groups[cursor % groups.length];
    allocated.push({
      ...student,
      groupId: targetGroup.id,
    });
    cursor++;
  }

  return allocated.sort((a, b) => (Number(a.absen) || 0) - (Number(b.absen) || 0));
}

/**
 * Memindahkan siswa tertentu ke kelompok tujuan secara manual.
 *
 * @param {Array<Object>} students - Array data siswa
 * @param {string} studentId - ID siswa yang dipindahkan
 * @param {string} targetGroupId - ID kelompok tujuan
 * @returns {Array<Object>}
 */
export function moveStudentToGroup(students, studentId, targetGroupId) {
  if (!Array.isArray(students)) return [];
  return students.map((s) => (s.id === studentId ? { ...s, groupId: targetGroupId } : s));
}

export default {
  DEFAULT_GROUP_ROLES,
  calculateGroupCapacities,
  formatCapacityDistribution,
  allocateStudentsAuto,
  moveStudentToGroup,
};
