-- ============================================================================
-- ANDIL: SUPABASE RELATIONAL SCHEMA, RLS POLICIES & REALTIME (ZERO DUMMY DATA)
-- ============================================================================

-- 0. Tabel Users (Guru / Akun Terautentikasi)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'teacher',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Tabel Rooms
CREATE TABLE IF NOT EXISTS public.rooms (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT DEFAULT 'Informatika',
  class_name TEXT DEFAULT '',
  teacher_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  teacher_name TEXT DEFAULT '',
  task_title TEXT NOT NULL,
  description TEXT DEFAULT '',
  deadline TIMESTAMPTZ,
  is_deadline_locked BOOLEAN DEFAULT FALSE,
  is_group_finalized BOOLEAN DEFAULT FALSE,
  planned_student_count INT DEFAULT 30,
  group_count INT DEFAULT 6,
  division_method TEXT DEFAULT 'auto',
  available_roles JSONB DEFAULT '["Ketua Kelompok", "Pembuat PPT", "Pencari Materi", "Penyusun Laporan", "Presenter"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Groups
CREATE TABLE IF NOT EXISTS public.groups (
  id TEXT PRIMARY KEY,
  room_code TEXT REFERENCES public.rooms(code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INT NOT NULL
);

-- 3. Tabel Students
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY,
  room_code TEXT REFERENCES public.rooms(code) ON DELETE CASCADE,
  absen INT NOT NULL,
  name TEXT NOT NULL,
  password TEXT DEFAULT '',
  session_token TEXT DEFAULT '',
  is_late BOOLEAN DEFAULT FALSE,
  join_status TEXT DEFAULT 'approved',
  group_id TEXT REFERENCES public.groups(id) ON DELETE SET NULL,
  role TEXT DEFAULT NULL,
  grade INT DEFAULT NULL,
  teacher_note TEXT DEFAULT ''
);

-- 4. Tabel Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  room_code TEXT REFERENCES public.rooms(code) ON DELETE CASCADE,
  group_id TEXT REFERENCES public.groups(id) ON DELETE CASCADE,
  owner_id TEXT REFERENCES public.students(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  owner_role TEXT DEFAULT '',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Not Started',
  evidence JSONB DEFAULT NULL,
  logs JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_rooms_teacher_id ON public.rooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_groups_room_code ON public.groups(room_code);
CREATE INDEX IF NOT EXISTS idx_students_room_code ON public.students(room_code);
CREATE INDEX IF NOT EXISTS idx_students_group_id ON public.students(group_id);
CREATE INDEX IF NOT EXISTS idx_tasks_room_code ON public.tasks(room_code);
CREATE INDEX IF NOT EXISTS idx_tasks_group_id ON public.tasks(group_id);
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON public.tasks(owner_id);

-- ============================================================================
-- GRANT & RLS POLICIES (FULL CRUD FOR ANON & AUTHENTICATED)
-- ============================================================================
GRANT ALL ON TABLE public.users, public.rooms, public.groups, public.students, public.tasks TO anon, authenticated;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to users" ON public.users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to rooms" ON public.rooms FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to groups" ON public.groups FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to students" ON public.students FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to tasks" ON public.tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- REALTIME PUBLICATION
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.users, public.rooms, public.groups, public.students, public.tasks;

-- ============================================================================
-- SUPABASE STORAGE BUCKET FOR EVIDENCE FILES & PHOTOS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Allow public read on evidence bucket"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'evidence');

CREATE POLICY "Allow public upload on evidence bucket"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'evidence');

CREATE POLICY "Allow public update on evidence bucket"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'evidence')
WITH CHECK (bucket_id = 'evidence');

