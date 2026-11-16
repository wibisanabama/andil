import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const STORAGE_KEY = 'andil_room_data_v2';
export const ACTIVE_TEACHER_STORAGE_KEY = 'andil_active_teacher_v2';
export const ACTIVE_STUDENT_STORAGE_KEY = 'andil_active_student_v2';
export const ACTIVE_ROOM_CODE_KEY = 'andil_active_room_code_v2';
const CUSTOM_SYNC_EVENT = 'andil:storage-sync';
const CUSTOM_AUTH_EVENT = 'andil:auth-sync';

function createEmptyRoomData() {
  return {
    room: null,
    groups: [],
    students: [],
    tasks: [],
  };
}

/**
 * Format TIMESTAMPTZ atau YYYY-MM-DD ke label tanggal Indonesia
 */
export function formatDeadlineLabel(isoString, fallback = '-') {
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
    return `${day} ${month} ${year}`;
  } catch {
    return fallback;
  }
}

/**
 * Konversi baris database Supabase (snake_case) ke struktur state aplikasi (camelCase)
 */
export function mapSupabaseToRoomData(roomRow, groupRows, studentRows, taskRows) {
  if (!roomRow) return createEmptyRoomData();

  const mappedRoom = {
    code: roomRow.code,
    teacherId: roomRow.teacher_id || null,
    title: roomRow.title,
    taskTitle: roomRow.task_title,
    description: roomRow.description || '',
    deadline: roomRow.deadline || null,
    deadlineLabel:
      roomRow.deadline_label || formatDeadlineLabel(roomRow.deadline, '-'),
    isDeadlineLocked: Boolean(roomRow.is_deadline_locked),
    isGroupFinalized: Boolean(roomRow.is_group_finalized),
    plannedStudentCount: Number(roomRow.planned_student_count) || 30,
    groupCount: Number(roomRow.group_count) || 6,
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
    createdAt: roomRow.created_at,
  };

  const mappedGroups = (groupRows || [])
    .map((g) => ({
      id: g.id,
      roomCode: g.room_code,
      name: g.name,
      capacity: Number(g.capacity) || 4,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const mappedStudents = (studentRows || [])
    .map((s) => ({
      id: s.id,
      roomCode: s.room_code,
      absen: Number(s.absen),
      name: s.name,
      isLate: Boolean(s.is_late),
      joinStatus: s.join_status || 'approved',
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

// =============================================================================
// MANAJEMEN SESI LOGIN (GURU & SISWA) DAN KODE ROOM AKTIF
// =============================================================================

export function getActiveRoomCode() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(ACTIVE_ROOM_CODE_KEY) || '';
}

export function setActiveRoomCode(roomCode) {
  if (typeof window === 'undefined') return;
  if (!roomCode) {
    window.localStorage.removeItem(ACTIVE_ROOM_CODE_KEY);
  } else {
    window.localStorage.setItem(ACTIVE_ROOM_CODE_KEY, roomCode.trim().toUpperCase());
  }
}

export function getActiveTeacherSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_TEACHER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.id && parsed.email ? parsed : null;
  } catch {
    return null;
  }
}

export function setActiveTeacherSession(teacherObj) {
  if (typeof window === 'undefined') return;
  if (!teacherObj) {
    window.localStorage.removeItem(ACTIVE_TEACHER_STORAGE_KEY);
  } else {
    window.localStorage.setItem(ACTIVE_TEACHER_STORAGE_KEY, JSON.stringify(teacherObj));
  }
  window.dispatchEvent(new CustomEvent(CUSTOM_AUTH_EVENT));
}

export function logoutTeacherSession() {
  setActiveTeacherSession(null);
}

export function getActiveStudentSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_STUDENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.id && parsed.roomCode ? parsed : null;
  } catch {
    return null;
  }
}

export function setActiveStudentSession(studentObj) {
  if (typeof window === 'undefined') return;
  if (!studentObj) {
    window.localStorage.removeItem(ACTIVE_STUDENT_STORAGE_KEY);
  } else {
    window.localStorage.setItem(ACTIVE_STUDENT_STORAGE_KEY, JSON.stringify(studentObj));
  }
  window.dispatchEvent(new CustomEvent(CUSTOM_AUTH_EVENT));
}

export function logoutStudentSession() {
  setActiveStudentSession(null);
}

export function useAuthSession() {
  const [teacher, setTeacher] = useState(() => getActiveTeacherSession());
  const [student, setStudent] = useState(() => getActiveStudentSession());

  useEffect(() => {
    const syncAuth = () => {
      setTeacher(getActiveTeacherSession());
      setStudent(getActiveStudentSession());
    };
    window.addEventListener(CUSTOM_AUTH_EVENT, syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener(CUSTOM_AUTH_EVENT, syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  return {
    teacher,
    student,
    logoutTeacher: logoutTeacherSession,
    logoutStudent: logoutStudentSession,
  };
}

// =============================================================================
// AUTENTIKASI GURU DI SUPABASE (TABEL public.users)
// =============================================================================

export async function registerTeacherInSupabase({ name, email, password }) {
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanName || !cleanEmail || !cleanPassword) {
    return { ok: false, error: 'Nama lengkap, email, dan kata sandi wajib diisi.' };
  }

  if (cleanPassword.length < 4) {
    return { ok: false, error: 'Kata sandi minimal 4 karakter.' };
  }

  try {
    const { data: existing, error: checkErr } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (checkErr) throw checkErr;
    if (existing) {
      return { ok: false, error: 'Email tersebut sudah terdaftar. Silakan masuk menggunakan akun Anda.' };
    }

    const newTeacher = {
      id: `usr-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
      role: 'guru',
    };

    const { data: inserted, error: insertErr } = await supabase
      .from('users')
      .insert(newTeacher)
      .select('id, name, email, role, created_at')
      .single();

    if (insertErr) throw insertErr;

    setActiveTeacherSession(inserted);
    return { ok: true, user: inserted };
  } catch (err) {
    console.error('Gagal mendaftarkan akun guru:', err);
    return { ok: false, error: 'Gagal mendaftarkan akun ke database Supabase.' };
  }
}

export async function loginTeacherInSupabase({ email, password }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanEmail || !cleanPassword) {
    return { ok: false, error: 'Email dan kata sandi wajib diisi.' };
  }

  try {
    const { data: userRow, error } = await supabase
      .from('users')
      .select('id, name, email, password, role, created_at')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error) throw error;
    if (!userRow || userRow.password !== cleanPassword) {
      return { ok: false, error: 'Email atau kata sandi tidak sesuai.' };
    }

    const sessionUser = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
      created_at: userRow.created_at,
    };

    setActiveTeacherSession(sessionUser);
    return { ok: true, user: sessionUser };
  } catch (err) {
    console.error('Gagal masuk akun guru:', err);
    return { ok: false, error: 'Gagal menghubungi server autentikasi Supabase.' };
  }
}

// =============================================================================
// CACHE LOCALSTORAGE (TANPA DATA DUMMY)
// =============================================================================

export function loadRoomData() {
  if (typeof window === 'undefined') {
    return createEmptyRoomData();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptyRoomData();
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return createEmptyRoomData();
    }
    return {
      room: parsed.room || null,
      groups: Array.isArray(parsed.groups) ? parsed.groups : [],
      students: Array.isArray(parsed.students) ? parsed.students : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
    };
  } catch {
    return createEmptyRoomData();
  }
}

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
// OPERASI FULL CRUD KE SUPABASE (100% DATA NYATA)
// =============================================================================

/**
 * READ ALL ROOMS: Mengambil daftar seluruh room beserta ringkasan jumlah kelompok, siswa, dan task
 */
export async function fetchAllRoomsWithStatsFromSupabase(teacherId = null) {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }
  try {
    let query = supabase.from('rooms').select('*').order('created_at', { ascending: false });
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }

    const { data: rooms, error: roomsErr } = await query;
    if (roomsErr) throw roomsErr;
    if (!rooms || rooms.length === 0) return [];

    const roomCodes = rooms.map((r) => r.code);
    const [groupsRes, studentsRes, tasksRes] = await Promise.all([
      supabase.from('groups').select('id, room_code, capacity').in('room_code', roomCodes),
      supabase.from('students').select('id, room_code').in('room_code', roomCodes),
      supabase.from('tasks').select('id, room_code, status').in('room_code', roomCodes),
    ]);

    const groupsByRoom = new Map();
    const studentsByRoom = new Map();
    const tasksByRoom = new Map();

    (groupsRes.data || []).forEach((g) => {
      const list = groupsByRoom.get(g.room_code) || [];
      list.push(g);
      groupsByRoom.set(g.room_code, list);
    });

    (studentsRes.data || []).forEach((s) => {
      studentsByRoom.set(s.room_code, (studentsByRoom.get(s.room_code) || 0) + 1);
    });

    (tasksRes.data || []).forEach((t) => {
      const stat = tasksByRoom.get(t.room_code) || { total: 0, completed: 0 };
      stat.total += 1;
      if (t.status === 'Completed') stat.completed += 1;
      tasksByRoom.set(t.room_code, stat);
    });

    return rooms.map((r) => {
      const taskStat = tasksByRoom.get(r.code) || { total: 0, completed: 0 };
      return {
        code: r.code,
        teacherId: r.teacher_id,
        title: r.title,
        taskTitle: r.task_title,
        description: r.description || '',
        deadlineLabel: r.deadline_label || formatDeadlineLabel(r.deadline, '-'),
        isDeadlineLocked: Boolean(r.is_deadline_locked),
        isGroupFinalized: Boolean(r.is_group_finalized),
        plannedStudentCount: Number(r.planned_student_count) || 30,
        groupCount: (groupsByRoom.get(r.code) || []).length || Number(r.group_count) || 0,
        studentCount: studentsByRoom.get(r.code) || 0,
        completedTaskCount: taskStat.completed,
        totalTaskCount: taskStat.total,
        createdAt: r.created_at,
      };
    });
  } catch (err) {
    console.error('Gagal mengambil daftar room dari Supabase:', err);
    return [];
  }
}

/**
 * READ SINGLE ROOM DATA: Mengambil detail 1 room beserta groups, students, dan tasks dari Supabase
 */
export async function fetchRoomDataFromSupabase(targetRoomCode) {
  if (!isSupabaseConfigured || !supabase) {
    return loadRoomData();
  }

  const studentSession = getActiveStudentSession();
  const teacherSession = getActiveTeacherSession();
  const codeToFetch = (
    targetRoomCode ||
    getActiveRoomCode() ||
    studentSession?.roomCode ||
    ''
  )
    .trim()
    .toUpperCase();

  try {
    let roomRow = null;

    if (codeToFetch) {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', codeToFetch)
        .maybeSingle();
      if (error) throw error;
      roomRow = data;
    }

    if (!roomRow && teacherSession?.id) {
      const { data: latestTeacherRoom } = await supabase
        .from('rooms')
        .select('*')
        .eq('teacher_id', teacherSession.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      roomRow = latestTeacherRoom || null;
    }

    if (!roomRow) {
      const emptyState = createEmptyRoomData();
      writeLocalCacheOnly(emptyState);
      return emptyState;
    }

    const activeCode = roomRow.code;
    setActiveRoomCode(activeCode);

    const [groupsRes, studentsRes, tasksRes] = await Promise.all([
      supabase.from('groups').select('*').eq('room_code', activeCode),
      supabase
        .from('students')
        .select('*')
        .eq('room_code', activeCode)
        .order('absen', { ascending: true }),
      supabase.from('tasks').select('*').eq('room_code', activeCode),
    ]);

    if (groupsRes.error) throw groupsRes.error;
    if (studentsRes.error) throw studentsRes.error;
    if (tasksRes.error) throw tasksRes.error;

    const mapped = mapSupabaseToRoomData(
      roomRow,
      groupsRes.data,
      studentsRes.data,
      tasksRes.data
    );

    // Jika siswa sedang login di room ini, perbarui juga sesi lokalnya apabila grup/peran/status berubah
    if (studentSession && studentSession.roomCode === activeCode) {
      const updatedSelf = mapped.students.find((s) => s.id === studentSession.id);
      if (updatedSelf) {
        const selfGroup = mapped.groups.find((g) => g.id === updatedSelf.groupId);
        setActiveStudentSession({
          ...studentSession,
          name: updatedSelf.name,
          absen: updatedSelf.absen,
          absenFormatted: String(updatedSelf.absen).padStart(2, '0'),
          isLate: Boolean(updatedSelf.isLate),
          joinStatus: updatedSelf.joinStatus || 'approved',
          groupId: updatedSelf.groupId,
          groupName: selfGroup?.name || 'Kelompok 1',
          role: updatedSelf.role,
        });
      }
    }

    writeLocalCacheOnly(mapped);
    return mapped;
  } catch (err) {
    console.warn('Gagal mengambil data room dari Supabase:', err);
    return loadRoomData();
  }
}

/**
 * CREATE ROOM: Membuat Room baru di Supabase (tanpa data siswa palsu)
 */
export async function createOrUpdateRoomInSupabase({
  code,
  title,
  taskTitle,
  description,
  deadlineLabel,
  plannedStudentCount,
  groupCount,
  divisionMethod,
  availableRoles,
  calculatedGroups,
}) {
  const teacherSession = getActiveTeacherSession();
  const normalizedCode = (code || '').trim().toUpperCase();
  if (!normalizedCode) {
    throw new Error('Kode Room wajib diisi.');
  }

  setActiveRoomCode(normalizedCode);

  const rawDateInput = (deadlineLabel || '').trim();
  let parsedDeadlineIso = null;
  let formattedDeadlineText = '';

  if (rawDateInput) {
    const d = new Date(
      /^\d{4}-\d{2}-\d{2}$/.test(rawDateInput)
        ? `${rawDateInput}T23:59:59`
        : rawDateInput
    );
    if (!Number.isNaN(d.getTime())) {
      parsedDeadlineIso = d.toISOString();
      formattedDeadlineText = formatDeadlineLabel(d.toISOString(), rawDateInput);
    } else {
      formattedDeadlineText = rawDateInput;
    }
  }

  const { error: roomErr } = await supabase.from('rooms').upsert(
    {
      code: normalizedCode,
      teacher_id: teacherSession?.id || null,
      title: title.trim(),
      task_title: taskTitle.trim(),
      description: (description || '').trim(),
      deadline: parsedDeadlineIso,
      deadline_label: formattedDeadlineText,
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

  return await fetchRoomDataFromSupabase(normalizedCode);
}

/**
 * UPDATE ROOM: Memperbarui atribut room (is_group_finalized, is_deadline_locked, dll)
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
 * DELETE ROOM: Menghapus room dari tabel public.rooms
 */
export async function deleteRoomFromSupabase(roomCode) {
  const targetCode = (roomCode || getActiveRoomCode() || '').trim().toUpperCase();
  if (!targetCode) return createEmptyRoomData();

  if (getActiveRoomCode() === targetCode) {
    setActiveRoomCode('');
    writeLocalCacheOnly(createEmptyRoomData());
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
    return createEmptyRoomData();
  }
}

/**
 * ADD STUDENT BY TEACHER: Guru menambahkan siswa secara langsung ke Room
 */
export async function addStudentToRoomInSupabase({ roomCode, absen, name, groupId }) {
  const normalizedCode = (roomCode || getActiveRoomCode() || '').trim().toUpperCase();
  const parsedAbsen = parseInt(absen, 10);
  const trimmedName = (name || '').trim();

  if (!normalizedCode || Number.isNaN(parsedAbsen) || parsedAbsen < 1 || !trimmedName) {
    return { ok: false, error: 'Nomor absen dan nama lengkap siswa wajib diisi.' };
  }

  try {
    // Ambil kuota jumlah siswa dari room
    const { data: roomInfo } = await supabase
      .from('rooms')
      .select('planned_student_count')
      .eq('code', normalizedCode)
      .maybeSingle();

    const maxAbsen = Number(roomInfo?.planned_student_count) || 30;
    if (parsedAbsen > maxAbsen) {
      return {
        ok: false,
        error: `Nomor Absen tidak boleh melebihi batas jumlah siswa yang diatur di Room ini (maksimal absen ${maxAbsen}).`,
      };
    }

    // Cek apakah nomor absen sudah ada di room tersebut
    const { data: existing } = await supabase
      .from('students')
      .select('id, name')
      .eq('room_code', normalizedCode)
      .eq('absen', parsedAbsen)
      .maybeSingle();

    if (existing) {
      return {
        ok: false,
        error: `Nomor Absen ${String(parsedAbsen).padStart(2, '0')} sudah terdaftar atas nama ${existing.name}.`,
      };
    }

    let targetGroupId = groupId;
    if (!targetGroupId) {
      const currentData = loadRoomData();
      const groups = currentData.groups || [];
      const students = currentData.students || [];
      const availableGroup =
        groups.find((g) => {
          const count = students.filter((s) => s.groupId === g.id).length;
          return count < g.capacity;
        }) || groups[0];
      targetGroupId = availableGroup?.id || null;
    }

    const newStudentId = `std-${normalizedCode.toLowerCase()}-${String(parsedAbsen).padStart(2, '0')}`;
    const { data: inserted, error } = await supabase
      .from('students')
      .insert({
        id: newStudentId,
        room_code: normalizedCode,
        absen: parsedAbsen,
        name: trimmedName,
        group_id: targetGroupId,
        role: null,
        grade: null,
        teacher_note: '',
      })
      .select('*')
      .single();

    if (error) throw error;
    await fetchRoomDataFromSupabase(normalizedCode);
    return { ok: true, student: inserted };
  } catch (err) {
    console.error('Gagal menambahkan siswa ke Supabase:', err);
    return { ok: false, error: 'Gagal menambahkan siswa ke database.' };
  }
}

/**
 * DELETE STUDENT: Menghapus siswa dari Room di Supabase
 */
export async function deleteStudentFromSupabase(studentId) {
  if (!isSupabaseConfigured || !supabase || !studentId) return;
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);
    if (error) throw error;
    await fetchRoomDataFromSupabase();
  } catch (err) {
    console.error('Gagal menghapus siswa dari Supabase:', err);
  }
}

/**
 * UPDATE STUDENT GROUP (Manual Move)
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
 * BULK UPDATE STUDENT GROUPS (Auto Distribute)
 */
export async function bulkUpdateStudentGroupsInSupabase(studentsArray, roomCode) {
  if (!isSupabaseConfigured || !supabase || !Array.isArray(studentsArray) || studentsArray.length === 0) {
    return;
  }
  const activeCode = roomCode || getActiveRoomCode();
  try {
    const rows = studentsArray.map((s) => ({
      id: s.id,
      room_code: s.roomCode || activeCode,
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
 * UPDATE STUDENT GRADE & NOTE
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
 * VERIFY ROOM CODE (/siswa Step 1):
 * Memverifikasi Kode Room di public.rooms dan mengembalikan informasi Room beserta batas jumlah siswa (planned_student_count).
 */
export async function verifyRoomCodeInSupabase(roomCode) {
  const normalizedCode = (roomCode || '').trim().toUpperCase();
  if (!normalizedCode) {
    return { ok: false, error: 'Silakan masukkan Kode Room yang dibagikan oleh Guru.' };
  }

  try {
    const { data: roomRow, error: roomErr } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (roomErr) throw roomErr;
    if (!roomRow) {
      return {
        ok: false,
        error: `Kode Room "${normalizedCode}" tidak ditemukan. Pastikan kode sesuai dengan yang dibuat oleh Guru.`,
      };
    }

    return {
      ok: true,
      room: {
        code: roomRow.code,
        title: roomRow.title || '',
        subject: roomRow.subject || 'Informatika',
        className: roomRow.class_name || '',
        teacherName: roomRow.teacher_name || 'Guru Pengampu',
        taskTitle: roomRow.task_title || '',
        plannedStudentCount: Number(roomRow.planned_student_count) || 30,
        groupCount: Number(roomRow.group_count) || 6,
      },
    };
  } catch (err) {
    console.error('Gagal memverifikasi Kode Room ke Supabase:', err);
    return {
      ok: false,
      error: 'Gagal menghubungi database Supabase saat memeriksa Kode Room.',
    };
  }
}

/**
 * JOIN / LOGIN STUDENT KE ROOM (/siswa Step 2):
 * Memverifikasi Kode Room & batas maksimal absen di public.rooms, lalu memuat atau mendaftarkan siswa di public.students
 * secara nyata sesuai Nomor Absen, Nama Lengkap, dan Kata Sandi/PIN siswa (wajib).
 */
export async function joinStudentToRoomInSupabase({ roomCode, absen, name, password }) {
  const normalizedCode = (roomCode || '').trim().toUpperCase();
  const parsedAbsen = parseInt(absen, 10);
  const trimmedName = (name || '').trim();
  const cleanPassword = (password || '').trim();

  if (!normalizedCode) {
    return { ok: false, error: 'Kode Room wajib diisi.' };
  }
  if (Number.isNaN(parsedAbsen) || parsedAbsen < 1) {
    return { ok: false, error: 'Nomor Absen harus berupa angka yang valid (minimal 1).' };
  }
  if (!trimmedName) {
    return { ok: false, error: 'Nama Lengkap Siswa wajib diisi.' };
  }
  if (!cleanPassword) {
    return { ok: false, error: 'Kata Sandi / PIN Siswa wajib diisi.' };
  }
  if (cleanPassword.length < 4) {
    return { ok: false, error: 'Kata Sandi / PIN Siswa minimal 4 karakter.' };
  }

  try {
    // 1. Verifikasi keberadaan Room dan batas jumlah siswa di tabel public.rooms
    const { data: roomRow, error: roomErr } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', normalizedCode)
      .maybeSingle();

    if (roomErr) throw roomErr;
    if (!roomRow) {
      return {
        ok: false,
        error: `Kode Room "${normalizedCode}" tidak ditemukan. Pastikan kode sesuai dengan yang dibuat oleh Guru.`,
      };
    }

    const maxAbsen = Number(roomRow.planned_student_count) || 30;
    if (parsedAbsen > maxAbsen) {
      return {
        ok: false,
        error: `Nomor Absen tidak boleh melebihi batas jumlah siswa di Room ini (maksimal absen ${maxAbsen}).`,
      };
    }

    setActiveRoomCode(normalizedCode);

    // 2. Ambil daftar kelompok dan siswa yang sudah ada di room tersebut
    const [groupsRes, studentsRes] = await Promise.all([
      supabase.from('groups').select('*').eq('room_code', normalizedCode),
      supabase.from('students').select('*').eq('room_code', normalizedCode),
    ]);

    if (groupsRes.error) throw groupsRes.error;
    if (studentsRes.error) throw studentsRes.error;

    const roomGroups = (groupsRes.data || []).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );
    const roomStudents = studentsRes.data || [];

    // 3. Cek apakah siswa dengan nomor absen tersebut sudah terdaftar di room ini
    const existingStudent = roomStudents.find((s) => Number(s.absen) === parsedAbsen);

    let activeStudentRecord = existingStudent;

    if (existingStudent) {
      if (existingStudent.password && existingStudent.password !== cleanPassword) {
        return {
          ok: false,
          error: `Kata Sandi / PIN untuk Nomor Absen ${String(parsedAbsen).padStart(2, '0')} (${existingStudent.name}) tidak sesuai.`,
        };
      }

      if (
        (trimmedName && existingStudent.name !== trimmedName) ||
        !existingStudent.password
      ) {
        const { data: updatedRow, error: updErr } = await supabase
          .from('students')
          .update({
            name: trimmedName || existingStudent.name,
            password: cleanPassword,
          })
          .eq('id', existingStudent.id)
          .select('*')
          .single();
        if (!updErr && updatedRow) {
          activeStudentRecord = updatedRow;
        }
      }
    } else {
      const isRoomFinalized = Boolean(roomRow.is_group_finalized);
      const divisionMethod = roomRow.division_method || 'auto';

      // Jika Guru belum menyelesaikan pembagian kelompok:
      // - Metode 'auto': langsung alokasikan secara acak ke kelompok yang kuotanya masih tersedia
      // - Metode 'manual': biarkan group_id = null agar Guru yang memilihkan kelompoknya secara manual
      // Jika Guru SUDAH menyelesaikan pembagian kelompok: status Telat Masuk (pending_late) & menunggu persetujuan Guru
      let assignedGroupId = null;
      if (!isRoomFinalized && divisionMethod !== 'manual') {
        const approvedStudents = roomStudents.filter(
          (s) => (s.join_status || 'approved') === 'approved'
        );
        const availableGroups = roomGroups.filter((g) => {
          const currentCount = approvedStudents.filter((s) => s.group_id === g.id).length;
          return currentCount < (Number(g.capacity) || 4);
        });
        const candidatePool = availableGroups.length > 0 ? availableGroups : roomGroups;
        if (candidatePool.length > 0) {
          const randomIndex = Math.floor(Math.random() * candidatePool.length);
          assignedGroupId = candidatePool[randomIndex]?.id || null;
        }
      }

      const newStudentId = `std-${normalizedCode.toLowerCase()}-${String(parsedAbsen).padStart(2, '0')}`;
      const { data: insertedStudent, error: insertErr } = await supabase
        .from('students')
        .insert({
          id: newStudentId,
          room_code: normalizedCode,
          absen: parsedAbsen,
          name: trimmedName,
          password: cleanPassword,
          is_late: isRoomFinalized,
          join_status: isRoomFinalized ? 'pending_late' : 'approved',
          group_id: assignedGroupId,
          role: null,
          grade: null,
          teacher_note: '',
        })
        .select('*')
        .single();

      if (insertErr) throw insertErr;
      activeStudentRecord = insertedStudent;
    }

    const assignedGroup = roomGroups.find((g) => g.id === activeStudentRecord.group_id);

    const sessionPayload = {
      id: activeStudentRecord.id,
      roomCode: normalizedCode,
      absen: Number(activeStudentRecord.absen),
      absenFormatted: String(activeStudentRecord.absen).padStart(2, '0'),
      name: activeStudentRecord.name,
      isLate: Boolean(activeStudentRecord.is_late),
      joinStatus: activeStudentRecord.join_status || 'approved',
      groupId: activeStudentRecord.group_id || assignedGroup?.id || '',
      groupName: assignedGroup?.name || 'Kelompok 1',
      role: activeStudentRecord.role || null,
    };

    setActiveStudentSession(sessionPayload);
    await fetchRoomDataFromSupabase(normalizedCode);

    return { ok: true, student: sessionPayload };
  } catch (err) {
    console.error('Gagal memproses login/gabung room ke Supabase:', err);
    return {
      ok: false,
      error: 'Terjadi kesalahan saat menghubungi database Supabase. Silakan coba lagi.',
    };
  }
}

/**
 * APPROVE LATE STUDENT BY TEACHER:
 * Menyetujui siswa yang terlambat masuk room dan menempatkannya ke kelompok
 * secara otomatis (kelompok yang anggotanya belum terpenuhi) atau manual sesuai pilihan Guru.
 */
export async function approveLateStudentInSupabase(studentId, roomCode, manualGroupId = null) {
  if (!isSupabaseConfigured || !supabase || !studentId) return { ok: false };
  const normalizedCode = (roomCode || getActiveRoomCode() || '').trim().toUpperCase();

  try {
    const [groupsRes, studentsRes] = await Promise.all([
      supabase.from('groups').select('*').eq('room_code', normalizedCode),
      supabase.from('students').select('*').eq('room_code', normalizedCode),
    ]);

    if (groupsRes.error) throw groupsRes.error;
    if (studentsRes.error) throw studentsRes.error;

    const roomGroups = (groupsRes.data || []).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );
    const approvedStudents = (studentsRes.data || []).filter(
      (s) => s.id !== studentId && (s.join_status || 'approved') === 'approved' && s.group_id
    );

    let targetGroup = null;

    if (manualGroupId) {
      targetGroup = roomGroups.find((g) => g.id === manualGroupId) || null;
    }

    // Jika mode otomatis atau manualGroupId tidak ditemukan, cari kelompok yang belum terpenuhi kapasitas anggotanya
    if (!targetGroup) {
      targetGroup = roomGroups.find((g) => {
        const count = approvedStudents.filter((s) => s.group_id === g.id).length;
        return count < (Number(g.capacity) || 4);
      });
    }

    // Jika semua kelompok sudah penuh, pilih kelompok dengan anggota paling sedikit
    if (!targetGroup && roomGroups.length > 0) {
      targetGroup = [...roomGroups].sort((a, b) => {
        const countA = approvedStudents.filter((s) => s.group_id === a.id).length;
        const countB = approvedStudents.filter((s) => s.group_id === b.id).length;
        return countA - countB;
      })[0];
    }

    const { error } = await supabase
      .from('students')
      .update({
        join_status: 'approved',
        group_id: targetGroup?.id || null,
      })
      .eq('id', studentId);

    if (error) throw error;
    await fetchRoomDataFromSupabase(normalizedCode);
    return { ok: true, groupName: targetGroup?.name || 'Kelompok' };
  } catch (err) {
    console.error('Gagal menyetujui siswa yang terlambat masuk:', err);
    return { ok: false, error: 'Gagal menyetujui siswa.' };
  }
}

/**
 * REJECT LATE STUDENT BY TEACHER:
 * Menolak permintaan bergabung dari siswa yang terlambat masuk room.
 */
export async function rejectLateStudentInSupabase(studentId, roomCode) {
  if (!isSupabaseConfigured || !supabase || !studentId) return { ok: false };
  const normalizedCode = (roomCode || getActiveRoomCode() || '').trim().toUpperCase();

  try {
    const { error } = await supabase
      .from('students')
      .update({
        join_status: 'rejected',
        group_id: null,
      })
      .eq('id', studentId);

    if (error) throw error;
    await fetchRoomDataFromSupabase(normalizedCode);
    return { ok: true };
  } catch (err) {
    console.error('Gagal menolak siswa yang terlambat masuk:', err);
    return { ok: false };
  }
}

/**
 * REQUEST REJOIN FOR REJECTED LATE STUDENT:
 * Mengizinkan siswa yang ditolak untuk mengajukan permintaan persetujuan ulang ke Guru.
 */
export async function requestRejoinLateStudentInSupabase(studentId, roomCode) {
  if (!isSupabaseConfigured || !supabase || !studentId) return { ok: false };
  const normalizedCode = (roomCode || getActiveRoomCode() || '').trim().toUpperCase();

  try {
    const { error } = await supabase
      .from('students')
      .update({
        join_status: 'pending_late',
      })
      .eq('id', studentId);

    if (error) throw error;
    await fetchRoomDataFromSupabase(normalizedCode);
    return { ok: true };
  } catch (err) {
    console.error('Gagal mengajukan ulang permintaan masuk:', err);
    return { ok: false };
  }
}

/**
 * UPDATE STUDENT ROLE (/siswa/peran)
 */
export async function updateStudentRoleInSupabase(studentId, role) {
  if (!isSupabaseConfigured || !supabase || !studentId) return;
  try {
    const { error } = await supabase
      .from('students')
      .update({ role })
      .eq('id', studentId);
    if (error) throw error;

    await supabase
      .from('tasks')
      .update({ owner_role: role, updated_at: new Date().toISOString() })
      .eq('owner_id', studentId);

    const currentSession = getActiveStudentSession();
    if (currentSession && currentSession.id === studentId) {
      setActiveStudentSession({
        ...currentSession,
        role,
      });
    }
  } catch (err) {
    console.error('Gagal memperbarui peran siswa di Supabase:', err);
  }
}

/**
 * CREATE TASK (/siswa/workspace)
 */
export async function createTaskInSupabase(newTask, roomCode) {
  if (!isSupabaseConfigured || !supabase || !newTask) return;
  try {
    const { error } = await supabase.from('tasks').insert({
      id: newTask.id,
      room_code: newTask.roomCode || roomCode || getActiveRoomCode(),
      group_id: newTask.groupId,
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
 * UPDATE TASK (/siswa/workspace)
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
 * DELETE TASK (/siswa/workspace)
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
 * Sinkronisasi perubahan state lokal ke Supabase
 */
async function syncDiffToSupabase(prev, next) {
  if (!isSupabaseConfigured || !supabase || !prev || !next || !next.room) return;
  const roomCode = next.room.code;
  if (!roomCode) return;

  try {
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

export function useRoomData(roomCodeOverride) {
  const [data, setData] = useState(() => loadRoomData());

  useEffect(() => {
    if (roomCodeOverride) {
      setActiveRoomCode(roomCodeOverride);
      fetchRoomDataFromSupabase(roomCodeOverride);
    }
    ensureRealtimeSubscription();
    return subscribeToStorage((updatedData) => {
      setData(updatedData);
    });
  }, [roomCodeOverride]);

  const updateData = useCallback((updater) => {
    setData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      writeLocalCacheOnly(next);
      syncDiffToSupabase(prev, next);
      return next;
    });
  }, []);

  return [data, updateData];
}

export const getRoomData = loadRoomData;
export const updateRoomData = saveRoomData;
export const initRoomData = loadRoomData;

export default {
  STORAGE_KEY,
  loadRoomData,
  saveRoomData,
  subscribeToStorage,
  useRoomData,
  useAuthSession,
  getRoomData,
  updateRoomData,
  initRoomData,
  registerTeacherInSupabase,
  loginTeacherInSupabase,
  logoutTeacherSession,
  logoutStudentSession,
  getActiveTeacherSession,
  getActiveStudentSession,
  getActiveRoomCode,
  setActiveRoomCode,
  fetchAllRoomsWithStatsFromSupabase,
  fetchRoomDataFromSupabase,
  createOrUpdateRoomInSupabase,
  updateRoomFieldsInSupabase,
  deleteRoomFromSupabase,
  addStudentToRoomInSupabase,
  deleteStudentFromSupabase,
  updateStudentGroupInSupabase,
  bulkUpdateStudentGroupsInSupabase,
  updateStudentGradeInSupabase,
  joinStudentToRoomInSupabase,
  updateStudentRoleInSupabase,
  createTaskInSupabase,
  updateTaskInSupabase,
  deleteTaskFromSupabase,
};
