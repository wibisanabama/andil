import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TopNavbar from './components/TopNavbar';
import LandingPage from './components/LandingPage';
import TeacherAuthGate from './components/guru/TeacherAuthGate';
import TeacherRoomList from './components/guru/TeacherRoomList';
import TeacherCreateRoom from './components/guru/TeacherCreateRoom';
import TeacherRoomDetail from './components/guru/TeacherRoomDetail';
import TeacherRoomGradingPage from './components/guru/TeacherRoomGradingPage';
import StudentJoinView from './components/siswa/StudentJoinView';
import StudentRoleView from './components/siswa/StudentRoleView';
import StudentWorkspace from './components/siswa/StudentWorkspace';

const ROUTE_TITLES = {
  '/': 'Andil | Pantau Peran, Catat Bukti, Nilai Lebih Adil',
  '/guru': 'Dashboard Room Guru | Andil',
  '/guru/buat-room': 'Buat Room Baru | Andil',
  '/guru/room': 'Kelola & Pantauan Kelompok | Andil',
  '/guru/room/nilai': 'Penilaian Kontribusi Individu | Andil',
  '/siswa': 'Gabung ke Room Kelas | Andil',
  '/siswa/peran': 'Pilih Peran Kelompok | Andil',
  '/siswa/workspace': 'Workspace Kanban Kelompok | Andil',
};

export function App() {
  const location = useLocation();

  useEffect(() => {
    const nextTitle = ROUTE_TITLES[location.pathname] || 'Andil | Manajemen Tugas Kelompok';
    document.title = nextTitle;
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-[#0F172A] flex flex-col">
      <TopNavbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/guru"
            element={
              <TeacherAuthGate>
                <TeacherRoomList />
              </TeacherAuthGate>
            }
          />
          <Route
            path="/guru/buat-room"
            element={
              <TeacherAuthGate>
                <TeacherCreateRoom />
              </TeacherAuthGate>
            }
          />
          <Route
            path="/guru/room"
            element={
              <TeacherAuthGate>
                <TeacherRoomDetail />
              </TeacherAuthGate>
            }
          />
          <Route
            path="/guru/room/nilai"
            element={
              <TeacherAuthGate>
                <TeacherRoomGradingPage />
              </TeacherAuthGate>
            }
          />
          <Route path="/siswa" element={<StudentJoinView />} />
          <Route path="/siswa/peran" element={<StudentRoleView />} />
          <Route path="/siswa/workspace" element={<StudentWorkspace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
