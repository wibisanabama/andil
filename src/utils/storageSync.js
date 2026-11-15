import { useState, useEffect, useCallback } from 'react';
import { sampleRoomData, ACTIVE_STUDENT_POV } from '../data/sampleRoomData';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const STORAGE_KEY = 'andil_mvp_room_data_v1';
export const ACTIVE_STUDENT_STORAGE_KEY = 'andil_active_student_v1';
export const ACTIVE_ROOM_CODE_KEY = 'andil_active_room_code_v1';
const CUSTOM_SYNC_EVENT = 'andil:storage-sync';

/**
 * Mengambil salinan mendalam (deep clone) dari sampleRoomData
 */
function cloneDefaultData() {
  return JSON.parse(JSON.stringify(sampleRoomData));
}

/**
 * Format TIMESTAMPTZ ke label tanggal Indonesia (contoh: "12 Nov 2026, 23:59")
 */
export function formatDeadlineLabel(isoString, fallback = '12 Nov 2026, 23:59') {
  if (!isoString) return fallback;
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return fallback;
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
    ];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  } catch {
    return fallback;
  }
}

/**
 * Konversi baris database Supabase (snake_case) ke struktur state aplikasi (camelCase)
 */
export function mapSupabaseToRoomData(roomRow, groupRows, studentRows, taskRows, prevLocalData) {
  const fallback = prevLocalData || cloneDefaultData();
  if (!roomRow) return fallback;

  const mappedRoom = {
    code: roomRow.code,
    title: roomRow.title,
    taskTitle: roomRow.task_title,
    description: roomRow.description || '',
    deadline: roomRow.deadline || '2026-11-12T23:59:00+07:00',
    deadlineLabel:
      prevLocalData?.room?.code === roomRow.code && prevLocalData?.room?.deadlineLabel
        ? prevLocalData.room.deadlineLabel
        : formatDeadlineLabel(roomRow.deadline),
    isDeadlineLocked: Boolean(roomRow.is_deadline_locked),
    isGroupFinalized:
      roomRow.is_group_finalized !== undefined && roomRow.is_group_finalized !== null
        ? Boolean(roomRow.is_group_finalized)
        : true,
    plannedStudentCount: Number(roomRow.planned_student_count) || 30,
    groupCount: Number(roomRow.group_count) || 7,
    divisionMethod: roomRow.division_method || 'auto',
    availableRoles: Array.isArray(roomRow.available_roles)
      ? roomRow.available_roles
      : [
          'Ketua Kelompok',
          'Pembuat PPT',
          'Pencari Materi',
          'Penyusun Laporan',
          'Presenter',
        ],
  };

  const mappedGroups = (groupRows || [])
    .map((g) => ({
      id: g.id,
      roomCode: g.room_code,
      name: g.name,
      capacity: Number(g.capacity) || 4,
    }))
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const mappedStudents = (studentRows || [])
    .map((s) => ({
      id: s.id,
      roomCode: s.room_code,
      absen: Number(s.absen),
      name: s.name,
      groupId: s.group_id,
      role: s.role || null,
      grade: s.grade !== null && s.grade !== undefined ? Number(s.grade) : null,
      teacherNote: s.teacher_note || '',
    }))
    .sort((a, b) => a.absen - b.absen);

  const mappedTasks = (taskRows || [])
    .map((t) => ({
      id: t.id,
      roomCode: t.room_code,
      groupId: t.group_id,
      ownerId: t.owner_id,
      ownerName: t.owner_name,
      ownerRole: t.owner_role || '',
      title: t.title,
      description: t.description || '',
      status: t.status || 'Not Started',
      evidence: t.evidence || null,
      logs: Array.isArray(t.logs) ? t.logs : [],
      updatedAt: t.updated_at,
    }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));

  return {
    room: mappedRoom,
    groups: mappedGroups,
    students: mappedStudents,
    tasks: mappedTasks,
  };
}

/**
 * Mengambil kode room aktif saat ini
 */
export function getActiveRoomCode() {
  if (typeof window === 'undefined') return 'ANDIL-2026';
  return window.localStorage.getItem(ACTIVE_ROOM_CODE_KEY) || 'ANDIL-2026';
}

export function setActiveRoomCode(roomCode) {
  if (typeof window === 'undefined' || !roomCode) return;
  window.localStorage.setItem(ACTIVE_ROOM_CODE_KEY, roomCode);
}

/**
 * Mengambil dan menyimpan identitas siswa aktif di POV Siswa
 */
export function getActiveStudentSession() {
  if (typeof window === 'undefined') return ACTIVE_STUDENT_POV;
  try {
    const raw = window.localStorage.getItem(ACTIVE_STUDENT_STORAGE_KEY);
    if (!raw) return ACTIVE_STUDENT_POV;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && parsed.name) {
      return parsed;
    }
    return ACTIVE_STUDENT_POV;
  } catch {
    return ACTIVE_STUDENT_POV;
  }
}

export function setActiveStudentSession(studentObj) {
  if (typeof window === 'undefined' || !studentObj) return;
  try {
    window.localStorage.setItem(ACTIVE_STUDENT_STORAGE_KEY, JSON.stringify(studentObj));
  } catch (err) {
    console.warn('Gagal menyimpan sesi siswa aktif:', err);
  }
}

/**
 * Memuat state Room dari LocalStorage (cache lokal).
 */
export function loadRoomData() {
  if (typeof window === 'undefined') {
    return cloneDefaultData();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = cloneDefaultData();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.room || !Array.isArray(parsed.groups) || !Array.isArray(parsed.students)) {
      const initial = cloneDefaultData();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return parsed;
  } catch (err) {
    console.warn('Gagal membaca LocalStorage Andil, menggunakan sampleRoomData:', err);
    return cloneDefaultData();
  }
}

/**
 * Menyimpan cache Room ke LocalStorage dan menyiarkan event ke seluruh komponen di tab aktif.
 */
export function writeLocalCacheOnly(resolvedData) {
  if (typeof window === 'undefined') return resolvedData;
  try {
    const serialized = JSON.stringify(resolvedData);
    window.localStorage.setItem(STORAGE_KEY, serialized);
    window.dispatchEvent(new CustomEvent(CUSTOM_SYNC_EVENT, { detail: resolvedData }));
    return resolvedData;
  } catch (err) {
    console.error('Gagal menulis cache ke LocalStorage:', err);
    return resolvedData;
  }
}

// =============================================================================
// OPERASI FULL CRUD KE SUPABASE
// =============================================================================

/**
 * READ: Mengambil seluruh data Room (rooms, groups, students, tasks) dari Supabase
 */
export async function fetchRoomDataFromSupabase(targetRoomCode) {
  if (!isSupabaseConfigured || !supabase) {
    return loadRoomData();
  }

  const codeToFetch = targetRoomCode || getActiveRoomCode() || 'ANDIL-2026';

  try {
    let { data: roomRow, error: roomErr } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', codeToFetch)
      .maybeSingle();

    if (roomErr) throw roomErr;

    // Jika room dengan codeToFetch tidak ditemukan, ambil room terbaru yang tersedia di tabel rooms
    if (!roomRow) {
      const { data: latestRoom } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestRoom) {
        // Tabel rooms kosong (misal baru dihapus semua)
        const emptyState = {
          room: null,
          groups: [],
          students: [],
          tasks: [],
        };
        writeLocalCacheOnly(emptyState);
        return emptyState;
      }
      roomRow = latestRoom;
      setActiveRoomCode(roomRow.code);
    }

    const activeCode = roomRow.code;

    const [groupsRes, studentsRes, tasksRes] = await Promise.all([
      supabase.from('groups').select('*').eq('room_code', activeCode),
      supabase.from('students').select('*').eq('room_code', activeCode).order('absen', { ascending: true }),
      supabase.from('tasks').select('*').eq('room_code', activeCode),
    ]);

    if (groupsRes.error) throw groupsRes.error;
    if (studentsRes.error) throw studentsRes.error;
    if (tasksRes.error) throw tasksRes.error;

    const prevLocal = loadRoomData();
    const mapped = mapSupabaseToRoomData(
      roomRow,
      groupsRes.data,
      studentsRes.data,
      tasksRes.data,
      prevLocal
    );

    writeLocalCacheOnly(mapped);
    return mapped;
  } catch (err) {
    console.warn('Gagal mengambil data dari Supabase, menggunakan cache LocalStorage:', err);
    return loadRoomData();
  }
}

/**
 * READ ALL ROOMS: Mengambil daftar seluruh room yang ada di tabel public.rooms
 */
export async function fetchAllRoomsFromSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    const local = loadRoomData();
    return local?.room ? [local.room] : [];
  }
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Gagal mengambil daftar room dari Supabase:', err);
    return [];
  }
}

/**
 * CREATE / UPSERT ROOM: Membuat atau memperbarui Room beserta kelompok dan siswa di Supabase
 */
export async function createOrUpdateRoomInSupabase({
  code = 'ANDIL-2026',
  title,
  taskTitle,
  description,
  deadlineLabel,
  plannedStudentCount,
  groupCount,
  divisionMethod,
  availableRoles,
  calculatedGroups,
  studentsList,
}) {
  const normalizedCode = (code || 'ANDIL-2026').trim().toUpperCase();
  setActiveRoomCode(normalizedCode);

  // Perbarui state lokal terlebih dahulu (optimistic UI)
  const currentLocal = loadRoomData();
  const nextLocal = {
    ...currentLocal,
    room: {
      ...(currentLocal.room || {}),
      code: normalizedCode,
      title,
      taskTitle,
      description,
      deadline: '2026-11-12T23:59:00+07:00',
      deadlineLabel: deadlineLabel || '12 Nov 2026, 23:59',
      isDeadlineLocked: false,
      isGroupFinalized: false,
      plannedStudentCount,
      groupCount,
      divisionMethod,
      availableRoles,
    },
    groups: calculatedGroups,
    students: studentsList,
  };
  writeLocalCacheOnly(nextLocal);

  if (!isSupabaseConfigured || !supabase) {
    return nextLocal;
  }

  try {
    // 1. Upsert ke tabel public.rooms dengan is_group_finalized: false
    const { error: roomErr } = await supabase.from('rooms').upsert(
      {
        code: normalizedCode,
        title,
        task_title: taskTitle,
        description,
        deadline: '2026-11-12T23:59:00+07:00',
        is_deadline_locked: false,
        is_group_finalized: false,
        planned_student_count: plannedStudentCount,
        group_count: groupCount,
        division_method: divisionMethod,
        available_roles: availableRoles,
      },
      { onConflict: 'code' }
    );
    if (roomErr) throw roomErr;

    // 2. Upsert kelompok ke tabel public.groups
    const groupRows = calculatedGroups.map((g) => ({
      id: g.id,
      room_code: normalizedCode,
      name: g.name,
      capacity: g.capacity,
    }));
    const { error: groupErr } = await supabase
      .from('groups')
      .upsert(groupRows, { onConflict: 'id' });
    if (groupErr) throw groupErr;

    // Hapus kelompok berlebih jika jumlah kelompok dikurangi oleh guru
    const validGroupIds = calculatedGroups.map((g) => g.id);
    if (validGroupIds.length > 0) {
      await supabase
        .from('groups')
        .delete()
        .eq('room_code', normalizedCode)
        .not('id', 'in', `(${validGroupIds.join(',')})`);
    }

    // 3. Upsert daftar siswa agar terhubung dengan kelompok yang valid
    if (Array.isArray(studentsList) && studentsList.length > 0) {
      const studentRows = studentsList.map((s) => ({
        id: s.id,
        room_code: normalizedCode,
        absen: s.absen,
        name: s.name,
        group_id: s.groupId,
        role: s.role || null,
        grade: s.grade !== undefined ? s.grade : null,
        teacher_note: s.teacherNote || '',
      }));
      const { error: stdErr } = await supabase
        .from('students')
        .upsert(studentRows, { onConflict: 'id' });
      if (stdErr) throw stdErr;
    }

    return await fetchRoomDataFromSupabase(normalizedCode);
  } catch (err) {
    console.error('Gagal menyimpan Room ke Supabase:', err);
    return nextLocal;
  }
}

/**
 * UPDATE ROOM: Memperbarui atribut room (is_group_finalized, is_deadline_locked, available_roles, dll)
 */
export async function updateRoomFieldsInSupabase(roomCode, dbFields) {
  if (!isSupabaseConfigured || !supabase || !roomCode) return;
  try {
    const { error } = await supabase
      .from('rooms')
      .update(dbFields)
      .eq('code', roomCode);
    if (error) throw error;
  } catch (err) {
    console.error('Gagal memperbarui atribut room di Supabase:', err);
  }
}

/**
 * DELETE ROOM: Menghapus room dari tabel public.rooms (ON DELETE CASCADE menghapus groups, students, tasks)
 */
export async function deleteRoomFromSupabase(roomCode) {
  const targetCode = roomCode || getActiveRoomCode() || 'ANDIL-2026';
  const emptyState = {
    room: null,
    groups: [],
    students: [],
    tasks: [],
  };
  writeLocalCacheOnly(emptyState);

  if (!isSupabaseConfigured || !supabase) {
    return emptyState;
  }

  try {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('code', targetCode);
    if (error) throw error;
    return await fetchRoomDataFromSupabase();
  } catch (err) {
    console.error('Gagal menghapus room dari Supabase:', err);
    return emptyState;
  }
}

/**
 * SEED / RESTORE DEFAULT ROOM: Mengembalikan data awal ANDIL-2026 ke Supabase & LocalStorage
 */
export async function restoreDefaultRoomToSupabase() {
  const initial = cloneDefaultData();
  initial.room.isGroupFinalized = true;
  writeLocalCacheOnly(initial);
  setActiveRoomCode('ANDIL-2026');

  if (!isSupabaseConfigured || !supabase) {
    return initial;
  }

  try {
    await supabase.from('rooms').upsert(
      {
        code: initial.room.code,
        title: initial.room.title,
        task_title: initial.room.taskTitle,
        description: initial.room.description,
        deadline: '2026-11-12T23:59:00+07:00',
        is_deadline_locked: false,
        is_group_finalized: true,
        planned_student_count: initial.room.plannedStudentCount,
        group_count: initial.room.groupCount,
        division_method: initial.room.divisionMethod,
        available_roles: initial.room.availableRoles,
      },
      { onConflict: 'code' }
    );

    await supabase.from('groups').upsert(
      initial.groups.map((g) => ({
        id: g.id,
        room_code: initial.room.code,
        name: g.name,
        capacity: g.capacity,
      })),
      { onConflict: 'id' }
    );

    await supabase.from('students').upsert(
      initial.students.map((s) => ({
        id: s.id,
        room_code: initial.room.code,
        absen: s.absen,
        name: s.name,
        group_id: s.groupId,
        role: s.role,
        grade: s.grade,
        teacher_note: s.teacherNote || '',
      })),
      { onConflict: 'id' }
    );

    await supabase.from('tasks').upsert(
      initial.tasks.map((t) => ({
        id: t.id,
        room_code: initial.room.code,
        group_id: t.groupId,
        owner_id: t.ownerId,
        owner_name: t.ownerName,
        owner_role: t.ownerRole,
        title: t.title,
        description: t.description,
        status: t.status,
        evidence: t.evidence,
        logs: t.logs,
      })),
      { onConflict: 'id' }
    );

    return await fetchRoomDataFromSupabase('ANDIL-2026');
  } catch (err) {
    console.error('Gagal merestore data awal ke Supabase:', err);
    return initial;
  }
}

/**
 * UPDATE STUDENT GROUP (Manual Move): Memindahkan kelompok 1 siswa di tabel public.students
 */
export async function updateStudentGroupInSupabase(studentId, groupId) {
  if (!isSupabaseConfigured || !supabase || !studentId) return;
  try {
    const { error } = await supabase
      .from('students')
      .update({ group_id: groupId })
      .eq('id', studentId);
    if (error) throw error;
  } catch (err) {
    console.error('Gagal memindahkan kelompok siswa di Supabase:', err);
  }
}

/**
 * BULK UPDATE STUDENT GROUPS (Auto Distribute): Menyimpan hasil acak seimbang ke tabel public.students
 */
export async function bulkUpdateStudentGroupsInSupabase(studentsArray, roomCode = 'ANDIL-2026') {
  if (!isSupabaseConfigured || !supabase || !Array.isArray(studentsArray)) return;
  try {
    const rows = studentsArray.map((s) => ({
      id: s.id,
      room_code: s.roomCode || roomCode,
      absen: s.absen,
      name: s.name,
      group_id: s.groupId,
      role: s.role || null,
      grade: s.grade !== undefined ? s.grade : null,
      teacher_note: s.teacherNote || '',
    }));
    const { error } = await supabase
      .from('students')
      .upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  } catch (err) {
    console.error('Gagal menyimpan pembagian kelompok otomatis ke Supabase:', err);
  }
}

/**
 * UPDATE STUDENT GRADE & NOTE: Menyimpan nilai individu (0-100) & catatan guru ke tabel public.students
 */
export async function updateStudentGradeInSupabase(studentId, grade, teacherNote) {
  if (!isSupabaseConfigured || !supabase || !studentId) return;
  try {
    const { error } = await supabase
      .from('students')
      .update({
        grade: grade,
        teacher_note: teacherNote,
      })
      .eq('id', studentId);
    if (error) throw error;
  } catch (err) {
    console.error('Gagal menyimpan nilai siswa ke Supabase:', err);
  }
}

/**
 * JOIN ROOM (/siswa): Memverifikasi kode room di tabel rooms dan memuat/mendaftarkan siswa di tabel students
 */
export async function joinStudentToRoomInSupabase({ roomCode, absen, name }) {
  const normalizedCode = (roomCode || '').trim().toUpperCase();
  const parsedAbsen = parseInt(absen, 10) || 2;
  const trimmedName = (name || 'Budi Santoso').trim();

  if (!isSupabaseConfigured || !supabase) {
    const local = loadRoomData();
    if (local?.room?.code && local.room.code.toUpperCase() !== normalizedCode) {
      return { ok: false, error: `Kode Room "${normalizedCode}" tidak ditemukan.` };
    }
    const found = (local.students || []).find((s) => s.absen === parsedAbsen) || ACTIVE_STUDENT_POV;
    setActiveStudentSession({
      id: found.id,
      absen: found.absen,
      absenFormatted: String(found.absen).padStart(2, '0'),
      name: found.name,
      groupId: found.groupId || 'grp-1',
      role: found.role || 'Pembuat PPT',
    });
    return { ok: true, student: found };
  }

  try {
    // 1. Verifikasi keberadaan Room di tabel public.rooms
    const { data: roomRow, error: roomErr } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (roomErr) throw roomErr;
    if (!roomRow) {
      return {
        ok: false,
        error: `Kode Room "${normalizedCode}" tidak ditemukan. Pastikan kode sesuai dengan yang dibagikan guru.`,
      };
    }

    setActiveRoomCode(normalizedCode);

    // 2. Cek apakah siswa dengan nomor absen tersebut sudah terdaftar di room ini
    const { data: existingStudent, error: stdCheckErr } = await supabase
      .from('students')
      .select('*')
      .eq('room_code', normalizedCode)
      .eq('absen', parsedAbsen)
      .maybeSingle();

    if (stdCheckErr) throw stdCheckErr;

    let activeStudentRecord = existingStudent;

    if (!activeStudentRecord) {
      // Siswa baru: INSERT ke tabel public.students
      const newStudentId = `std-${String(parsedAbsen).padStart(2, '0')}`;
      const { data: insertedStudent, error: insertErr } = await supabase
        .from('students')
        .upsert(
          {
            id: newStudentId,
            room_code: normalizedCode,
            absen: parsedAbsen,
            name: trimmedName,
            group_id: 'grp-1',
            role: 'Anggota',
            grade: null,
            teacher_note: '',
          },
          { onConflict: 'id' }
        )
        .select('*')
        .single();

      if (insertErr) throw insertErr;
      activeStudentRecord = insertedStudent;
    } else if (trimmedName && activeStudentRecord.name !== trimmedName && parsedAbsen !== 2) {
      // Perbarui nama jika siswa non-demo memperbarui namanya
      const { data: updatedStudent } = await supabase
        .from('students')
        .update({ name: trimmedName })
        .eq('id', activeStudentRecord.id)
        .select('*')
        .single();
      if (updatedStudent) activeStudentRecord = updatedStudent;
    }

    const sessionPayload = {
      id: activeStudentRecord.id,
      absen: activeStudentRecord.absen,
      absenFormatted: String(activeStudentRecord.absen).padStart(2, '0'),
      name: activeStudentRecord.name,
      groupId: activeStudentRecord.group_id || 'grp-1',
      groupName: 'Kelompok 1',
      role: activeStudentRecord.role || 'Pembuat PPT',
    };
    setActiveStudentSession(sessionPayload);

    await fetchRoomDataFromSupabase(normalizedCode);
    return { ok: true, student: sessionPayload };
  } catch (err) {
    console.error('Gagal memproses join room ke Supabase:', err);
    return { ok: false, error: 'Terjadi kesalahan saat menghubungi server. Silakan coba lagi.' };
  }
}

/**
 * UPDATE STUDENT ROLE (/siswa/peran): Memperbarui peran siswa di tabel public.students
 */
export async function updateStudentRoleInSupabase(studentId, role) {
  if (!isSupabaseConfigured || !supabase || !studentId) return;
  try {
    const { error } = await supabase
      .from('students')
      .update({ role })
      .eq('id', studentId);
    if (error) throw error;

    // Ikut perbarui owner_role pada task milik siswa tersebut
    await supabase
      .from('tasks')
      .update({ owner_role: role, updated_at: new Date().toISOString() })
      .eq('owner_id', studentId);
  } catch (err) {
    console.error('Gagal memperbarui peran siswa di Supabase:', err);
  }
}

/**
 * CREATE TASK (/siswa/workspace): Menambah task baru ke tabel public.tasks
 */
export async function createTaskInSupabase(newTask, roomCode = 'ANDIL-2026') {
  if (!isSupabaseConfigured || !supabase || !newTask) return;
  try {
    const { error } = await supabase.from('tasks').insert({
      id: newTask.id,
      room_code: newTask.roomCode || roomCode || getActiveRoomCode(),
      group_id: newTask.groupId || 'grp-1',
      owner_id: newTask.ownerId,
      owner_name: newTask.ownerName,
      owner_role: newTask.ownerRole || '',
      title: newTask.title,
      description: newTask.description || '',
      status: newTask.status || 'Not Started',
      evidence: newTask.evidence || null,
      logs: Array.isArray(newTask.logs) ? newTask.logs : [],
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  } catch (err) {
    console.error('Gagal membuat task baru di Supabase:', err);
  }
}

/**
 * UPDATE TASK (/siswa/workspace): Memperbarui judul/deskripsi/status/evidence/logs di tabel public.tasks
 */
export async function updateTaskInSupabase(taskId, updates) {
  if (!isSupabaseConfigured || !supabase || !taskId) return;
  try {
    const payload = {
      updated_at: new Date().toISOString(),
    };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.evidence !== undefined) payload.evidence = updates.evidence;
    if (updates.logs !== undefined) payload.logs = updates.logs;
    if (updates.ownerRole !== undefined) payload.owner_role = updates.ownerRole;

    const { error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', taskId);
    if (error) throw error;
  } catch (err) {
    console.error('Gagal memperbarui task di Supabase:', err);
  }
}

/**
 * DELETE TASK (/siswa/workspace): Menghapus task milik siswa aktif dari tabel public.tasks
 */
export async function deleteTaskFromSupabase(taskId) {
  if (!isSupabaseConfigured || !supabase || !taskId) return;
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    if (error) throw error;
  } catch (err) {
    console.error('Gagal menghapus task dari Supabase:', err);
  }
}

/**
 * Sinkronisasi cerdas otomatis apabila komponen memanggil saveRoomData(updater) secara langsung
 */
async function syncDiffToSupabase(prev, next) {
  if (!isSupabaseConfigured || !supabase || !prev || !next || !next.room) return;
  const roomCode = next.room.code || 'ANDIL-2026';

  try {
    // 1. Cek perubahan pada objek room
    if (
      prev.room &&
      (prev.room.isDeadlineLocked !== next.room.isDeadlineLocked ||
        prev.room.isGroupFinalized !== next.room.isGroupFinalized ||
        prev.room.title !== next.room.title ||
        prev.room.taskTitle !== next.room.taskTitle ||
        JSON.stringify(prev.room.availableRoles) !== JSON.stringify(next.room.availableRoles))
    ) {
      await updateRoomFieldsInSupabase(roomCode, {
        title: next.room.title,
        task_title: next.room.taskTitle,
        description: next.room.description,
        is_deadline_locked: Boolean(next.room.isDeadlineLocked),
        is_group_finalized: Boolean(next.room.isGroupFinalized),
        planned_student_count: next.room.plannedStudentCount,
        group_count: next.room.groupCount,
        division_method: next.room.divisionMethod,
        available_roles: next.room.availableRoles,
      });
    }

    // 2. Cek perubahan pada students (groupId, role, grade, teacherNote)
    const prevStudentMap = new Map((prev.students || []).map((s) => [s.id, s]));
    const changedStudents = (next.students || []).filter((s) => {
      const p = prevStudentMap.get(s.id);
      if (!p) return true;
      return (
        p.groupId !== s.groupId ||
        p.role !== s.role ||
        p.grade !== s.grade ||
        p.teacherNote !== s.teacherNote ||
        p.name !== s.name
      );
    });

    if (changedStudents.length === 1) {
      const st = changedStudents[0];
      await supabase
        .from('students')
        .update({
          group_id: st.groupId,
          role: st.role,
          grade: st.grade,
          teacher_note: st.teacherNote || '',
          name: st.name,
        })
        .eq('id', st.id);
    } else if (changedStudents.length > 1) {
      await bulkUpdateStudentGroupsInSupabase(changedStudents, roomCode);
    }

    // 3. Cek perubahan pada tasks (create, update, delete)
    const prevTasks = prev.tasks || [];
    const nextTasks = next.tasks || [];
    const prevTaskMap = new Map(prevTasks.map((t) => [t.id, t]));
    const nextTaskMap = new Map(nextTasks.map((t) => [t.id, t]));

    for (const nt of nextTasks) {
      const pt = prevTaskMap.get(nt.id);
      if (!pt) {
        await createTaskInSupabase(nt, roomCode);
      } else if (
        pt.title !== nt.title ||
        pt.description !== nt.description ||
        pt.status !== nt.status ||
        JSON.stringify(pt.evidence) !== JSON.stringify(nt.evidence) ||
        JSON.stringify(pt.logs) !== JSON.stringify(nt.logs)
      ) {
        await updateTaskInSupabase(nt.id, nt);
      }
    }

    for (const pt of prevTasks) {
      if (!nextTaskMap.has(pt.id)) {
        await deleteTaskFromSupabase(pt.id);
      }
    }
  } catch (err) {
    console.warn('Sinkronisasi latar belakang ke Supabase gagal:', err);
  }
}

/**
 * Menyimpan state Room ke LocalStorage & menyinkronkannya ke Supabase.
 */
export function saveRoomData(nextData) {
  if (typeof window === 'undefined') return nextData;
  try {
    const prev = loadRoomData();
    const resolved = typeof nextData === 'function' ? nextData(prev) : nextData;
    writeLocalCacheOnly(resolved);
    syncDiffToSupabase(prev, resolved);
    return resolved;
  } catch (err) {
    console.error('Gagal menyimpan data:', err);
    return nextData;
  }
}

/**
 * Mengembalikan data Room ke kondisi awal (sampleRoomData) di LocalStorage & Supabase.
 */
export function resetRoomData() {
  const initial = cloneDefaultData();
  writeLocalCacheOnly(initial);
  restoreDefaultRoomToSupabase();
  return initial;
}

/**
 * Berlangganan perubahan data dari LocalStorage dan custom event.
 */
export function subscribeToStorage(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleStorageEvent = (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        callback(parsed);
      } catch (err) {
        console.error('Gagal memproses sinkronisasi storage antar-tab:', err);
      }
    } else if (event.key === STORAGE_KEY && event.newValue === null) {
      callback(loadRoomData());
    }
  };

  const handleCustomSync = (event) => {
    if (event.detail !== undefined) {
      callback(event.detail);
    }
  };

  window.addEventListener('storage', handleStorageEvent);
  window.addEventListener(CUSTOM_SYNC_EVENT, handleCustomSync);

  return () => {
    window.removeEventListener('storage', handleStorageEvent);
    window.removeEventListener(CUSTOM_SYNC_EVENT, handleCustomSync);
  };
}

// =============================================================================
// SUPABASE REALTIME SUBSCRIPTION SINGLETON
// =============================================================================
let realtimeInitialized = false;
let realtimeDebounceTimer = null;

function ensureRealtimeSubscription() {
  if (realtimeInitialized || typeof window === 'undefined' || !isSupabaseConfigured || !supabase) {
    return;
  }
  realtimeInitialized = true;

  // Muat data awal dari Supabase saat aplikasi dibuka
  fetchRoomDataFromSupabase();

  const triggerRefetch = () => {
    if (realtimeDebounceTimer) clearTimeout(realtimeDebounceTimer);
    realtimeDebounceTimer = setTimeout(() => {
      fetchRoomDataFromSupabase();
    }, 150);
  };

  supabase
    .channel('andil-realtime-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, triggerRefetch)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, triggerRefetch)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, triggerRefetch)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, triggerRefetch)
    .subscribe();
}

/**
 * React Hook untuk membaca dan memperbarui state Room Andil secara reaktif & Realtime dengan Supabase.
 */
export function useRoomData() {
  const [data, setData] = useState(() => loadRoomData());

  useEffect(() => {
    ensureRealtimeSubscription();
    return subscribeToStorage((updatedData) => {
      setData(updatedData);
    });
  }, []);

  const updateData = useCallback((updater) => {
    setData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      writeLocalCacheOnly(next);
      syncDiffToSupabase(prev, next);
      return next;
    });
  }, []);

  const resetData = useCallback(() => {
    const initial = resetRoomData();
    setData(initial);
    return initial;
  }, []);

  return [data, updateData, resetData];
}

// Alias ekspor tambahan untuk kompatibilitas lintas modul
export const getRoomData = loadRoomData;
export const updateRoomData = saveRoomData;
export const initRoomData = loadRoomData;

export default {
  STORAGE_KEY,
  loadRoomData,
  saveRoomData,
  resetRoomData,
  subscribeToStorage,
  useRoomData,
  getRoomData,
  updateRoomData,
  initRoomData,
  fetchRoomDataFromSupabase,
  createOrUpdateRoomInSupabase,
  updateRoomFieldsInSupabase,
  deleteRoomFromSupabase,
  restoreDefaultRoomToSupabase,
  updateStudentGroupInSupabase,
  bulkUpdateStudentGroupsInSupabase,
  updateStudentGradeInSupabase,
  joinStudentToRoomInSupabase,
  updateStudentRoleInSupabase,
  createTaskInSupabase,
  updateTaskInSupabase,
  deleteTaskFromSupabase,
  getActiveStudentSession,
  setActiveStudentSession,
};
