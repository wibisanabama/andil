/**
 * Helper Ekspor Rekap Penilaian Individu Urut Nomor Absen (CSV & Cetak PDF)
 * Mengacu pada spesifikasi Issue #4 dan Bagian 5.B.5 MVP.md
 */

/**
 * Mengamankan nilai sel CSV agar koma, tanda kutip, atau baris baru tidak merusak kolom.
 */
function escapeCsvCell(value) {
  if (value === null || value === undefined) return '""';
  const stringValue = String(value).replace(/"/g, '""');
  return `"${stringValue}"`;
}

/**
 * Menghasilkan konten string CSV dari data Room Andil yang diurutkan berdasarkan Nomor Absen (01-30).
 */
export function buildGradesCSV(roomData) {
  const students = [...(roomData?.students || [])].sort((a, b) => a.absen - b.absen);
  const groups = roomData?.groups || [];
  const tasks = roomData?.tasks || [];

  const groupMap = new Map(groups.map((g) => [g.id, g.name]));

  const headers = [
    'No. Absen',
    'Nama Siswa',
    'Kelompok',
    'Peran',
    'Task Selesai',
    'Status Bukti',
    'Nilai Individu',
    'Catatan Guru',
  ];

  const rows = students.map((student) => {
    const absenFormatted = String(student.absen).padStart(2, '0');
    const groupName = groupMap.get(student.groupId) || student.groupId || '-';
    const roleName = student.role || 'Anggota Kelompok';

    const studentTasks = tasks.filter((t) => t.ownerId === student.id);
    const completedCount = studentTasks.filter((t) => t.status === 'Completed').length;
    const hasEvidence = studentTasks.some(
      (t) => t.evidence && (t.evidence.notes || t.evidence.linkUrl || t.evidence.fileName)
    );

    const taskSummary =
      studentTasks.length > 0
        ? `${completedCount}/${studentTasks.length} Selesai`
        : '0/0 Selesai';

    const evidenceStatus =
      studentTasks.length > 0
        ? hasEvidence
          ? 'Bukti Ada'
          : 'Tanpa Bukti'
        : 'Anggota Kelompok';

    const gradeText =
      student.grade !== null && student.grade !== undefined && student.grade !== ''
        ? String(student.grade)
        : 'Belum Dinilai';

    return [
      absenFormatted,
      student.name,
      groupName,
      roleName,
      taskSummary,
      evidenceStatus,
      gradeText,
      student.teacherNote || '',
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  // Gunakan UTF-8 BOM (\uFEFF) agar langsung terbaca rapi di Microsoft Excel / Google Sheets
  return `\uFEFF${headers.map(escapeCsvCell).join(',')}\r\n${rows.join('\r\n')}`;
}

/**
 * Mengunduh berkas CSV rekap penilaian seluruh siswa urut nomor absen.
 */
export function exportGradesToCSV(roomData) {
  if (typeof window === 'undefined') return;

  const csvContent = buildGradesCSV(roomData);
  const roomCode = roomData?.room?.code || 'ANDIL-2026';
  const fileName = `Rekap_Nilai_${roomCode}_Urut_Absen.csv`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Memicu dialog cetak PDF bawaan browser (window.print()).
 */
export function printGradesToPDF() {
  if (typeof window === 'undefined') return;
  window.print();
}

export const downloadCSV = exportGradesToCSV;
export const printPDF = printGradesToPDF;

export default {
  buildGradesCSV,
  exportGradesToCSV,
  printGradesToPDF,
  downloadCSV,
  printPDF,
};
