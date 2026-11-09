/**
 * Utility helper untuk kalkulasi kapasitas kelompok yang seimbang dan alokasi siswa
 * Sesuai spesifikasi MVP Andil (Bagian 4.A & 7.A)
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
 * Contoh: 30 siswa, 7 kelompok -> [5, 5, 4, 4, 4, 4, 4]
 *
 * @param {number} totalStudents - Jumlah total siswa yang direncanakan (default: 30)
 * @param {number} groupCount - Jumlah kelompok yang diinginkan (default: 7)
 * @returns {Array<{ id: string, name: string, capacity: number }>}
 */
export function calculateGroupCapacities(totalStudents = 30, groupCount = 7) {
  // ponytail: gunakan modulo sederhana untuk pembagian kapasitas seimbang tanpa library luar
  const safeGroupCount = Math.max(1, Number(groupCount) || 1);
  const safeTotalStudents = Math.max(0, Number(totalStudents) || 0);

  const base = Math.floor(safeTotalStudents / safeGroupCount);
  const remainder = safeTotalStudents % safeGroupCount;

  return Array.from({ length: safeGroupCount }, (_, i) => ({
    id: `grp-${i + 1}`,
    name: `Kelompok ${i + 1}`,
    capacity: i < remainder ? base + 1 : base,
  }));
}

/**
 * Memformat distribusi kapasitas kelompok ke dalam bentuk string "5-5-4-4-4-4-4"
 *
 * @param {Array<{ capacity: number } | number>} groups
 * @returns {string}
 */
export function formatCapacityDistribution(groups) {
  if (!Array.isArray(groups) || groups.length === 0) return '';
  return groups
    .map((g) => (typeof g === 'number' ? g : g?.capacity ?? 0))
    .join('-');
}

/**
 * Mengacak siswa (Fisher-Yates) dan membagikannya ke kelompok secara otomatis.
 * CATATAN PENTING: Kelompok 1 (grp-1) dan 5 siswa demo awal (std-01 s.d std-05)
 * tetap dijaga utuh agar alur demo MVP & interaksi POV Siswa tidak terganggu!
 *
 * @param {Array<Object>} students - Daftar siswa
 * @param {Array<{ id: string, capacity: number }>} groups - Daftar kelompok beserta kapasitasnya
 * @returns {Array<Object>} Daftar siswa yang telah dialokasikan, terurut berdasarkan nomor absen
 */
export function allocateStudentsAuto(students = [], groups = []) {
  if (!Array.isArray(students)) return [];
  if (!Array.isArray(groups) || groups.length === 0) return [...students];

  // ponytail: jaga 5 siswa demo (std-01..std-05 / absen 1..5) tetap di Kelompok 1 untuk kestabilan skenario demo
  const DEMO_IDS = new Set(['std-01', 'std-02', 'std-03', 'std-04', 'std-05']);
  const demoStudents = students
    .filter((s) => DEMO_IDS.has(s.id) || (typeof s.absen === 'number' && s.absen <= 5))
    .map((s) => ({
      ...s,
      groupId: 'grp-1',
    }));

  // Ambil siswa selain siswa demo untuk diacak
  const remaining = students.filter(
    (s) => !DEMO_IDS.has(s.id) && (typeof s.absen !== 'number' || s.absen > 5)
  );

  // Fisher-Yates shuffle untuk siswa sisa
  const shuffled = [...remaining];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Target kelompok untuk siswa acak (kelompok 2 dst, jika ada)
  const targetGroups = groups.filter((g) => g.id !== 'grp-1');
  const groupsToUse = targetGroups.length > 0 ? targetGroups : groups;

  const allocated = [];
  let cursor = 0;

  for (const group of groupsToUse) {
    const capacity = group.capacity || 0;
    for (let roleIdx = 0; roleIdx < capacity && cursor < shuffled.length; roleIdx++) {
      const student = shuffled[cursor++];
      // ponytail: penetapan peran berulang sederhana (round-robin) memastikan setiap kelompok memiliki Ketua Kelompok
      const role = DEFAULT_GROUP_ROLES[roleIdx % DEFAULT_GROUP_ROLES.length];
      allocated.push({
        ...student,
        groupId: group.id,
        role: role,
      });
    }
  }

  // Jika masih ada sisa siswa karena kelebihan kapasitas, bagikan ke kelompok yang ada
  while (cursor < shuffled.length) {
    const student = shuffled[cursor];
    const group = groupsToUse[cursor % groupsToUse.length];
    const existingInGroup = allocated.filter((s) => s.groupId === group.id).length;
    allocated.push({
      ...student,
      groupId: group.id,
      role: DEFAULT_GROUP_ROLES[existingInGroup % DEFAULT_GROUP_ROLES.length],
    });
    cursor++;
  }

  // Gabungkan siswa demo dan siswa teralokasi, lalu urutkan kembali berdasarkan nomor absen
  const result = [...demoStudents, ...allocated].sort(
    (a, b) => (Number(a.absen) || 0) - (Number(b.absen) || 0)
  );

  return result;
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
  // ponytail: direct map update untuk operasi mutasi state immutable yang ringkas
  return students.map((s) => (s.id === studentId ? { ...s, groupId: targetGroupId } : s));
}

export default {
  DEFAULT_GROUP_ROLES,
  calculateGroupCapacities,
  formatCapacityDistribution,
  allocateStudentsAuto,
  moveStudentToGroup,
};
