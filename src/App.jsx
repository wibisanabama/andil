import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import TopNavbar from './components/TopNavbar';
import LandingPage from './components/LandingPage';
import { useRoomData } from './utils/storageSync';

const ROUTE_TITLES = {
  '/': 'Andil — Pantau Peran, Catat Bukti, Nilai Lebih Adil',
  '/guru': 'Daftar Room Guru (/guru) | Andil',
  '/guru/buat-room': 'Buat Room Baru (/guru/buat-room) | Andil',
  '/guru/room': 'Kelola & Penilaian Room (/guru/room) | Andil',
  '/siswa': 'Gabung ke Room Kelas (/siswa) | Andil',
  '/siswa/peran': 'Pilih Peran Kelompok (/siswa/peran) | Andil',
  '/siswa/workspace': 'Workspace Kanban Kelompok (/siswa/workspace) | Andil',
};

function RoutePlaceholder({ badge, title, description, issueLabel, roomData }) {
  return (
    <main className="bg-[#F8FAFD] min-h-[calc(100vh-72px)] py-8 px-4 sm:px-8">
      <div className="max-w-[1180px] mx-auto">
        <section className="bg-white rounded-[28px] border border-[#E2E8F0] p-8 sm:p-10 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
          <div className="inline-flex items-center gap-2 bg-[#D3E3FD] text-[#041E49] px-3.5 py-1 rounded-full text-[12.5px] font-bold font-mono mb-4">
            {badge}
          </div>
          <h1 className="text-[26px] sm:text-[30px] font-extrabold text-[#0F172A] mb-2">
            {title}
          </h1>
          <p className="text-[14.5px] text-[#475569] leading-[1.6] max-w-2xl mb-6">
            {description}
          </p>

          <div className="bg-[#F0F4F9] rounded-2xl p-5 border border-[#E2E8F0] mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13.5px]">
            <div>
              <span className="text-[#64748B] block text-[12px]">Room Aktif (LocalStorage)</span>
              <strong className="text-[#0F172A] font-bold">
                {roomData?.room?.code} — {roomData?.room?.title}
              </strong>
            </div>
            <div>
              <span className="text-[#64748B] block text-[12px]">Kapasitas Kelas</span>
              <strong className="text-[#0F172A] font-bold">
                {roomData?.students?.length || 30} Siswa • {roomData?.groups?.length || 7} Kelompok
              </strong>
            </div>
            <div>
              <span className="text-[#64748B] block text-[12px]">Modul Terkait</span>
              <strong className="text-[#0B57D0] font-bold">{issueLabel}</strong>
            </div>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-[13.5px] px-5 py-2.5 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              arrow_back
            </span>
            <span>Kembali ke Halaman Utama (/)</span>
          </Link>
        </section>
      </div>
    </main>
  );
}

export function App() {
  const [roomData] = useRoomData();
  const location = useLocation();

  useEffect(() => {
    const nextTitle = ROUTE_TITLES[location.pathname] || 'Andil — Manajemen Tugas Kelompok';
    document.title = nextTitle;
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-[#0F172A] flex flex-col">
      <TopNavbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage roomData={roomData} />} />
          <Route
            path="/guru"
            element={
              <RoutePlaceholder
                badge="POV Guru • /guru"
                title="Dashboard Room Tugas Kelompok"
                description="Halaman daftar Room Guru siap diintegrasikan pada Issue #2 (src/components/guru/TeacherRoomList.jsx)."
                issueLabel="Issue #2 — TeacherRoomList.jsx"
                roomData={roomData}
              />
            }
          />
          <Route
            path="/guru/buat-room"
            element={
              <RoutePlaceholder
                badge="POV Guru • /guru/buat-room"
                title="Buat Room Tugas Kelompok Baru"
                description="Halaman pembuatan Room & kalkulator kapasitas otomatis siap diintegrasikan pada Issue #2 (src/components/guru/TeacherCreateRoom.jsx)."
                issueLabel="Issue #2 — TeacherCreateRoom.jsx"
                roomData={roomData}
              />
            }
          />
          <Route
            path="/guru/room"
            element={
              <RoutePlaceholder
                badge="POV Guru • /guru/room"
                title="Kelola Pembagian Kelompok, Pantauan, & Penilaian Siswa"
                description="Halaman kelola Room 3 Sub-Tab siap diintegrasikan pada Issue #3 & Issue #4 (TeacherRoomDetail.jsx, TeacherGroupsTab.jsx, TeacherGradingTab.jsx)."
                issueLabel="Issue #3 & #4 — Kelola & Penilaian Room"
                roomData={roomData}
              />
            }
          />
          <Route
            path="/siswa"
            element={
              <RoutePlaceholder
                badge="POV Siswa • /siswa"
                title="Gabung ke Room Kelas"
                description="Halaman gabung Room Siswa (Budi Santoso — Absen 02) siap diintegrasikan pada Issue #5 (src/components/siswa/StudentJoinView.jsx)."
                issueLabel="Issue #5 — StudentJoinView.jsx"
                roomData={roomData}
              />
            }
          />
          <Route
            path="/siswa/peran"
            element={
              <RoutePlaceholder
                badge="POV Siswa • /siswa/peran"
                title="Pilih Peranmu di Kelompok 1"
                description="Halaman pemilihan peran kelompok dengan kunci maksimal 1 Ketua Kelompok siap diintegrasikan pada Issue #5 (src/components/siswa/StudentRoleView.jsx)."
                issueLabel="Issue #5 — StudentRoleView.jsx"
                roomData={roomData}
              />
            }
          />
          <Route
            path="/siswa/workspace"
            element={
              <RoutePlaceholder
                badge="POV Siswa • /siswa/workspace"
                title="Workspace Kanban Kelompok 1"
                description="Halaman papan Kanban 4 kolom berpemilik & modal wajib bukti siap diintegrasikan pada Issue #6 (src/components/siswa/StudentWorkspace.jsx)."
                issueLabel="Issue #6 — StudentWorkspace.jsx"
                roomData={roomData}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
