import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TopNavbar from './components/TopNavbar';
import LandingPage from './components/LandingPage';
import TeacherRoomList from './components/guru/TeacherRoomList';
import TeacherCreateRoom from './components/guru/TeacherCreateRoom';
import TeacherRoomDetail from './components/guru/TeacherRoomDetail';
import StudentJoinView from './components/siswa/StudentJoinView';
import StudentRoleView from './components/siswa/StudentRoleView';
import StudentWorkspace from './components/siswa/StudentWorkspace';
import { useRoomData } from './utils/storageSync';

const ROUTE_TITLES = {
  '/': 'Andil | Pantau Peran, Catat Bukti, Nilai Lebih Adil',
  '/guru': 'Daftar Room Guru | Andil',
  '/guru/buat-room': 'Buat Room Baru | Andil',
  '/guru/room': 'Kelola & Penilaian Room | Andil',
  '/siswa': 'Gabung ke Room Kelas | Andil',
  '/siswa/peran': 'Pilih Peran Kelompok | Andil',
  '/siswa/workspace': 'Workspace Kanban Kelompok | Andil',
};

export function App() {
  const [roomData] = useRoomData();
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
          <Route path="/" element={<LandingPage roomData={roomData} />} />
          <Route path="/guru" element={<TeacherRoomList roomData={roomData} />} />
          <Route path="/guru/buat-room" element={<TeacherCreateRoom />} />
          <Route path="/guru/room" element={<TeacherRoomDetail />} />
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
