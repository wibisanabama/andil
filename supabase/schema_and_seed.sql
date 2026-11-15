-- =============================================================================
-- SKEMA DATABASE & SEED DATA ANDIL (SUPABASE POSTGRESQL)
-- =============================================================================

-- 1. Tabel rooms
CREATE TABLE IF NOT EXISTS public.rooms (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  task_title TEXT NOT NULL,
  description TEXT DEFAULT '',
  deadline TIMESTAMPTZ,
  is_deadline_locked BOOLEAN DEFAULT FALSE,
  is_group_finalized BOOLEAN DEFAULT TRUE,
  planned_student_count INT DEFAULT 30,
  group_count INT DEFAULT 7,
  division_method TEXT DEFAULT 'auto',
  available_roles JSONB DEFAULT '["Ketua Kelompok", "Pembuat PPT", "Pencari Materi", "Penyusun Laporan", "Presenter"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel groups
CREATE TABLE IF NOT EXISTS public.groups (
  id TEXT PRIMARY KEY,
  room_code TEXT REFERENCES public.rooms(code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INT NOT NULL
);

-- 3. Tabel students
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY,
  room_code TEXT REFERENCES public.rooms(code) ON DELETE CASCADE,
  absen INT NOT NULL,
  name TEXT NOT NULL,
  group_id TEXT REFERENCES public.groups(id) ON DELETE SET NULL,
  role TEXT DEFAULT NULL,
  grade INT DEFAULT NULL,
  teacher_note TEXT DEFAULT ''
);

-- 4. Tabel tasks
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

-- Indeks Foreign Key untuk performa query optimal
CREATE INDEX IF NOT EXISTS idx_groups_room_code ON public.groups(room_code);
CREATE INDEX IF NOT EXISTS idx_students_room_code ON public.students(room_code);
CREATE INDEX IF NOT EXISTS idx_students_group_id ON public.students(group_id);
CREATE INDEX IF NOT EXISTS idx_tasks_room_code ON public.tasks(room_code);
CREATE INDEX IF NOT EXISTS idx_tasks_group_id ON public.tasks(group_id);
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON public.tasks(owner_id);

-- Hak akses CRUD untuk role anon dan authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.rooms, public.groups, public.students, public.tasks TO anon, authenticated;

-- Aktifkan RLS beserta policy akses publik penuh (tanpa login email/password)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_public_crud" ON public.rooms
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "groups_public_crud" ON public.groups
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "students_public_crud" ON public.students
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "tasks_public_crud" ON public.tasks
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Aktifkan Realtime pada ke-4 tabel
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms, public.groups, public.students, public.tasks;

-- =============================================================================
-- SEED DATA AWAL ROOM ANDIL-2026
-- =============================================================================

-- 1. Seed Room ANDIL-2026
INSERT INTO public.rooms (
  code,
  title,
  task_title,
  description,
  deadline,
  is_deadline_locked,
  is_group_finalized,
  planned_student_count,
  group_count,
  division_method,
  available_roles
) VALUES (
  'ANDIL-2026',
  'Tugas Kelompok Informatika',
  'Presentasi Perkembangan Teknologi',
  'Setiap kelompok membuat materi presentasi dan menyiapkan penyampaiannya.',
  '2026-11-12T23:59:00+07:00',
  FALSE,
  TRUE,
  30,
  7,
  'auto',
  '["Ketua Kelompok", "Pembuat PPT", "Pencari Materi", "Penyusun Laporan", "Presenter"]'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  task_title = EXCLUDED.task_title,
  description = EXCLUDED.description,
  deadline = EXCLUDED.deadline,
  is_deadline_locked = EXCLUDED.is_deadline_locked,
  is_group_finalized = EXCLUDED.is_group_finalized,
  planned_student_count = EXCLUDED.planned_student_count,
  group_count = EXCLUDED.group_count,
  division_method = EXCLUDED.division_method,
  available_roles = EXCLUDED.available_roles;

-- 2. Seed 7 Groups (5-5-4-4-4-4-4)
INSERT INTO public.groups (id, room_code, name, capacity) VALUES
  ('grp-1', 'ANDIL-2026', 'Kelompok 1', 5),
  ('grp-2', 'ANDIL-2026', 'Kelompok 2', 5),
  ('grp-3', 'ANDIL-2026', 'Kelompok 3', 4),
  ('grp-4', 'ANDIL-2026', 'Kelompok 4', 4),
  ('grp-5', 'ANDIL-2026', 'Kelompok 5', 4),
  ('grp-6', 'ANDIL-2026', 'Kelompok 6', 4),
  ('grp-7', 'ANDIL-2026', 'Kelompok 7', 4)
ON CONFLICT (id) DO UPDATE SET
  room_code = EXCLUDED.room_code,
  name = EXCLUDED.name,
  capacity = EXCLUDED.capacity;

-- 3. Seed 30 Students (Absen 01 s.d. 30)
INSERT INTO public.students (id, room_code, absen, name, group_id, role, grade, teacher_note) VALUES
  ('std-01', 'ANDIL-2026', 1, 'Andi Pratama', 'grp-1', 'Ketua Kelompok', 90, 'Koordinasi kelompok dan riset pembuka sangat baik.'),
  ('std-02', 'ANDIL-2026', 2, 'Budi Santoso', 'grp-1', 'Pembuat PPT', 92, 'Seluruh slide selesai tepat waktu dengan bukti lengkap.'),
  ('std-03', 'ANDIL-2026', 3, 'Citra Lestari', 'grp-1', 'Pencari Materi', 88, 'Referensi 5 jurnal dan data statistik tersusun rapi.'),
  ('std-04', 'ANDIL-2026', 4, 'Deni Kurniawan', 'grp-1', 'Penyusun Laporan', 78, 'Bab kesimpulan masih berstatus terkendala dan belum melampirkan bukti.'),
  ('std-05', 'ANDIL-2026', 5, 'Eka Putri', 'grp-1', 'Presenter', NULL, ''),
  ('std-06', 'ANDIL-2026', 6, 'Fajar Nugraha', 'grp-2', 'Ketua Kelompok', 89, 'Koordinasi tim berjalan sangat baik.'),
  ('std-07', 'ANDIL-2026', 7, 'Gita Permata', 'grp-2', 'Pembuat PPT', 87, 'Desain presentasi rapi dan mudah dipahami.'),
  ('std-08', 'ANDIL-2026', 8, 'Hadi Wijaya', 'grp-2', 'Pencari Materi', 85, 'Materi referensi lengkap dan relevan.'),
  ('std-09', 'ANDIL-2026', 9, 'Intan Nuraini', 'grp-2', 'Penyusun Laporan', 86, 'Laporan tertulis tersusun secara sistematis.'),
  ('std-10', 'ANDIL-2026', 10, 'Joko Susilo', 'grp-2', 'Presenter', 84, 'Persiapan penyampaian materi cukup baik.'),
  ('std-11', 'ANDIL-2026', 11, 'Kevin Sanjaya', 'grp-3', 'Ketua Kelompok', 88, 'Pembagian tugas kelompok terarah.'),
  ('std-12', 'ANDIL-2026', 12, 'Laila Sari', 'grp-3', 'Pembuat PPT', 86, 'Visual slide menarik dan informatif.'),
  ('std-13', 'ANDIL-2026', 13, 'M. Rizky', 'grp-3', 'Pencari Materi', 85, 'Sumber literatur sesuai topik.'),
  ('std-14', 'ANDIL-2026', 14, 'Nadia Putri', 'grp-3', 'Presenter', 85, 'Latihan presentasi berjalan lancar.'),
  ('std-15', 'ANDIL-2026', 15, 'Olivia Zahrani', 'grp-4', 'Ketua Kelompok', 90, 'Kepemimpinan kelompok sangat aktif.'),
  ('std-16', 'ANDIL-2026', 16, 'Panji Pratama', 'grp-4', 'Pembuat PPT', 84, 'Slide presentasi sesuai struktur materi.'),
  ('std-17', 'ANDIL-2026', 17, 'Qori Ahmad', 'grp-4', 'Pencari Materi', 86, 'Data pendukung lengkap.'),
  ('std-18', 'ANDIL-2026', 18, 'Rian Hidayat', 'grp-4', 'Penyusun Laporan', 83, 'Format laporan sesuai panduan.'),
  ('std-19', 'ANDIL-2026', 19, 'Salsabila', 'grp-5', 'Ketua Kelompok', 89, 'Manajemen waktu kelompok efektif.'),
  ('std-20', 'ANDIL-2026', 20, 'Teguh Wibowo', 'grp-5', 'Pembuat PPT', 85, 'Tata letak slide bersih dan konsisten.'),
  ('std-21', 'ANDIL-2026', 21, 'Utami Dewi', 'grp-5', 'Pencari Materi', 87, 'Kajian literatur mendalam.'),
  ('std-22', 'ANDIL-2026', 22, 'Viko Bastian', 'grp-5', 'Presenter', 82, 'Penguasaan materi presentasi cukup baik.'),
  ('std-23', 'ANDIL-2026', 23, 'Wahyu Setiawan', 'grp-6', 'Ketua Kelompok', 88, 'Koordinasi anggota tertib dan rapi.'),
  ('std-24', 'ANDIL-2026', 24, 'Xander Pratama', 'grp-6', 'Pembuat PPT', 86, 'Ringkasan poin di slide jelas.'),
  ('std-25', 'ANDIL-2026', 25, 'Yasmin Aulia', 'grp-6', 'Pencari Materi', 85, 'Referensi artikel terpercaya.'),
  ('std-26', 'ANDIL-2026', 26, 'Zacky Maulana', 'grp-6', 'Presenter', 84, 'Siap mempresentasikan materi.'),
  ('std-27', 'ANDIL-2026', 27, 'Aldo Saputra', 'grp-7', 'Ketua Kelompok', 87, 'Mengatur ritme kerja tim dengan baik.'),
  ('std-28', 'ANDIL-2026', 28, 'Bella Safitri', 'grp-7', 'Pembuat PPT', 86, 'Ilustrasi slide mendukung materi.'),
  ('std-29', 'ANDIL-2026', 29, 'Candra Kirana', 'grp-7', 'Pencari Materi', 85, 'Pencarian sumber data tepat waktu.'),
  ('std-30', 'ANDIL-2026', 30, 'Farhan Syahputra', 'grp-7', 'Presenter', 84, 'Komunikasi presentasi terstruktur.')
ON CONFLICT (id) DO UPDATE SET
  room_code = EXCLUDED.room_code,
  absen = EXCLUDED.absen,
  name = EXCLUDED.name,
  group_id = EXCLUDED.group_id,
  role = EXCLUDED.role,
  grade = EXCLUDED.grade,
  teacher_note = EXCLUDED.teacher_note;

-- 4. Seed 6 Tasks Kelompok 1 (4 Kolom Kanban)
INSERT INTO public.tasks (id, room_code, group_id, owner_id, owner_name, owner_role, title, description, status, evidence, logs) VALUES
  (
    'tsk-101',
    'ANDIL-2026',
    'grp-1',
    'std-02',
    'Budi Santoso',
    'Pembuat PPT',
    'Membuat Slide Presentasi Utama (10 Halaman)',
    'Mendesain tata letak visual, grafik perkembangan AI, dan poin utama ke dalam slide.',
    'Completed',
    '{"notes": "Slide 1 sampai 10 sudah selesai didesain dengan tema Material Design 3.", "linkUrl": "https://docs.google.com/presentation/d/slide-presentasi-budi", "fileName": "Presentasi_Kelompok1_Budi.pptx", "fileSize": "2.4 MB", "submittedAt": "11 Nov, 15:00"}'::jsonb,
    '[{"time": "09 Nov, 08:15", "actor": "Budi Santoso", "action": "Membuat task (Not Started)"}, {"time": "09 Nov, 09:15", "actor": "Budi Santoso", "action": "Mengubah status ke In Progress"}, {"time": "10 Nov, 13:20", "actor": "Budi Santoso", "action": "Mengubah status ke On Hold / Terkendala"}, {"time": "11 Nov, 08:30", "actor": "Budi Santoso", "action": "Mengubah status kembali ke In Progress"}, {"time": "11 Nov, 15:00", "actor": "Budi Santoso", "action": "Mengirim bukti & menyelesaikan task (Completed)"}]'::jsonb
  ),
  (
    'tsk-102',
    'ANDIL-2026',
    'grp-1',
    'std-02',
    'Budi Santoso',
    'Pembuat PPT',
    'Merapikan Animasi & Transisi Antar-Slide',
    'Menyelaraskan durasi transisi slide agar pas untuk presentasi 10 menit.',
    'In Progress',
    NULL,
    '[{"time": "11 Nov, 15:30", "actor": "Budi Santoso", "action": "Membuat task (Not Started)"}, {"time": "11 Nov, 16:00", "actor": "Budi Santoso", "action": "Mengubah status ke In Progress"}]'::jsonb
  ),
  (
    'tsk-103',
    'ANDIL-2026',
    'grp-1',
    'std-01',
    'Andi Pratama',
    'Ketua Kelompok',
    'Menyusun Kerangka Materi & Pembagian Kerja',
    'Membagi sub-topik presentasi teknologi dan menyepakati jadwal kerja tim.',
    'Completed',
    '{"notes": "Dokumen pembagian topik dan outline 10 slide sudah disepakati bersama.", "linkUrl": "https://docs.google.com/document/d/outline-kelompok1-andi", "fileName": "Outline_Tugas_Kelompok1.pdf", "fileSize": "1.1 MB", "submittedAt": "09 Nov, 14:20"}'::jsonb,
    '[{"time": "09 Nov, 08:00", "actor": "Andi Pratama", "action": "Membuat task (Not Started)"}, {"time": "09 Nov, 09:00", "actor": "Andi Pratama", "action": "Mengubah status ke In Progress"}, {"time": "09 Nov, 14:20", "actor": "Andi Pratama", "action": "Mengirim bukti & menyelesaikan task (Completed)"}]'::jsonb
  ),
  (
    'tsk-104',
    'ANDIL-2026',
    'grp-1',
    'std-03',
    'Citra Lestari',
    'Pencari Materi',
    'Riset Referensi Jurnal & Data Statistik Teknologi',
    'Mengumpulkan 5 sumber referensi perkembangan teknologi informasi terbaru.',
    'Completed',
    '{"notes": "Ringkasan 5 jurnal dan grafik statistik sudah dirangkum di Google Docs.", "linkUrl": "https://docs.google.com/document/d/rangkuman-materi-citra", "fileName": "Rangkuman_Materi_Citra.docx", "fileSize": "1.8 MB", "submittedAt": "10 Nov, 17:10"}'::jsonb,
    '[{"time": "09 Nov, 08:30", "actor": "Citra Lestari", "action": "Membuat task (Not Started)"}, {"time": "09 Nov, 10:15", "actor": "Citra Lestari", "action": "Mengubah status ke In Progress"}, {"time": "10 Nov, 17:10", "actor": "Citra Lestari", "action": "Mengirim bukti & menyelesaikan task (Completed)"}]'::jsonb
  ),
  (
    'tsk-105',
    'ANDIL-2026',
    'grp-1',
    'std-04',
    'Deni Kurniawan',
    'Penyusun Laporan',
    'Menyusun Bab Kesimpulan Makalah Kelompok',
    'Menulis kesimpulan dan saran pada dokumen laporan tertulis.',
    'On Hold',
    NULL,
    '[{"time": "09 Nov, 09:00", "actor": "Deni Kurniawan", "action": "Membuat task (Not Started)"}, {"time": "10 Nov, 11:00", "actor": "Deni Kurniawan", "action": "Mengubah status ke In Progress"}, {"time": "10 Nov, 16:45", "actor": "Deni Kurniawan", "action": "Mengubah status ke On Hold / Terkendala"}]'::jsonb
  ),
  (
    'tsk-106',
    'ANDIL-2026',
    'grp-1',
    'std-05',
    'Eka Putri',
    'Presenter',
    'Menyiapkan Cue Card & Latihan Presentasi',
    'Membuat catatan poin bicara untuk sesi presentasi dan tanya jawab.',
    'Not Started',
    NULL,
    '[{"time": "09 Nov, 09:30", "actor": "Eka Putri", "action": "Membuat task (Not Started)"}]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  room_code = EXCLUDED.room_code,
  group_id = EXCLUDED.group_id,
  owner_id = EXCLUDED.owner_id,
  owner_name = EXCLUDED.owner_name,
  owner_role = EXCLUDED.owner_role,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  evidence = EXCLUDED.evidence,
  logs = EXCLUDED.logs;
