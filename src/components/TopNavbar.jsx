import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthSession } from '../utils/storageSync';

export function TopNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { teacher, student, logoutTeacher, logoutStudent } = useAuthSession();

  const isGuruRoute = location.pathname.startsWith('/guru');
  const isSiswaRoute = location.pathname.startsWith('/siswa');

  const handleLogoutGuru = () => {
    logoutTeacher();
    navigate('/guru');
  };

  const handleLogoutSiswa = () => {
    logoutStudent();
    navigate('/siswa');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E2E8F0]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-[72px] flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 group shrink-0 rounded-xl"
          aria-label="Andil, Kembali ke Halaman Utama"
        >
          <img
            src="/logo.png"
            alt="Logo Icon Andil"
            className="w-10 h-10 object-contain shrink-0"
          />
          <img
            src="/logo-teks.png"
            alt="Andil"
            className="h-7 sm:h-8 w-auto object-contain shrink-0"
          />
        </Link>

        {/* Info Sesi Login Guru */}
        {isGuruRoute && teacher && (
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center h-8 px-3.5 rounded-full bg-[#F0F4F9] border border-[#E2E8F0] text-[#0F172A] text-[12.5px] font-bold gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#0B57D0]" aria-hidden="true">
                person
              </span>
              <span className="truncate max-w-[160px]">{teacher.name}</span>
            </span>
            <button
              type="button"
              onClick={handleLogoutGuru}
              className="inline-flex items-center justify-center h-8 px-3.5 rounded-full bg-white hover:bg-[#FEE2E2] border border-[#E2E8F0] hover:border-[#FECACA] text-[#475569] hover:text-[#DC2626] text-[12.5px] font-bold gap-1.5 transition-colors cursor-pointer"
              title="Keluar Akun Guru"
            >
              <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                logout
              </span>
              <span>Keluar</span>
            </button>
          </div>
        )}

        {/* Info Sesi Login Siswa */}
        {isSiswaRoute && student && location.pathname !== '/siswa' && (
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center h-8 px-3.5 rounded-full bg-[#F0F4F9] border border-[#E2E8F0] text-[#0F172A] text-[12.5px] font-bold gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#0B57D0]" aria-hidden="true">
                badge
              </span>
              <span className="truncate max-w-[180px]">
                {student.absenFormatted}. {student.name}
              </span>
            </span>
            <button
              type="button"
              onClick={handleLogoutSiswa}
              className="inline-flex items-center justify-center h-8 px-3.5 rounded-full bg-white hover:bg-[#FEE2E2] border border-[#E2E8F0] hover:border-[#FECACA] text-[#475569] hover:text-[#DC2626] text-[12.5px] font-bold gap-1.5 transition-colors cursor-pointer"
              title="Keluar dari Room"
            >
              <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                logout
              </span>
              <span>Ganti Akun</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default TopNavbar;
