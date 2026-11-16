import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthSession } from '../utils/storageSync';

export function TopNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { teacher, student, logoutTeacher, logoutStudent } = useAuthSession();

  const isHomeRoute = location.pathname === '/';
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
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#DCE8F5]">
      <div className="max-w-[1280px] mx-auto px-3.5 sm:px-8 h-[64px] sm:h-[72px] flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 sm:gap-2.5 group shrink-0 rounded-xl"
          aria-label="Andil, Kembali ke Halaman Utama"
        >
          <img
            src="/logo.png"
            alt="Logo Icon Andil"
            className="h-8 sm:h-11 w-auto object-contain shrink-0"
          />
          <img
            src="/logo-teks.png"
            alt="Andil"
            className="h-6 sm:h-8.5 w-auto object-contain shrink-0"
          />
        </Link>

        {/* Navigasi Kontekstual & Sesi Pengguna */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {!isHomeRoute && (
            <Link
              to="/"
              className="inline-flex items-center justify-center h-8 px-2.5 sm:px-3.5 rounded-full bg-[#EDF5FD] hover:bg-[#DCEBFA] border border-[#CBE0F7] text-[#1B3B6F] text-[12px] sm:text-[12.5px] font-bold gap-1.5 transition-colors no-underline shrink-0"
              title="Kembali ke Beranda"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                home
              </span>
              <span className="hidden sm:inline">Beranda</span>
            </Link>
          )}

          {/* Info Sesi Login Guru */}
          {isGuruRoute && teacher && (
            <>
              {location.pathname !== '/guru' && (
                <Link
                  to="/guru"
                  className="inline-flex items-center justify-center h-8 px-2.5 sm:px-3.5 rounded-full bg-[#EDF5FD] hover:bg-[#DCEBFA] border border-[#CBE0F7] text-[#1B3B6F] text-[12px] sm:text-[12.5px] font-bold gap-1.5 transition-colors no-underline shrink-0"
                  title="Daftar Room"
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                    dashboard
                  </span>
                  <span className="hidden md:inline">Daftar Room</span>
                </Link>
              )}
              <span className="hidden sm:inline-flex items-center h-8 px-3 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#1B3B6F] text-[12px] font-bold gap-1.5 max-w-[150px]">
                <span className="material-symbols-outlined text-[15px] text-[#2563EB] shrink-0" aria-hidden="true">
                  person
                </span>
                <span className="truncate">{teacher.name}</span>
              </span>
              <button
                type="button"
                onClick={handleLogoutGuru}
                className="inline-flex items-center justify-center h-8 px-2.5 sm:px-3.5 rounded-full bg-white hover:bg-[#FEE2E2] border border-[#DCE8F5] hover:border-[#FECACA] text-[#475569] hover:text-[#DC2626] text-[12px] sm:text-[12.5px] font-bold gap-1 transition-colors cursor-pointer shrink-0"
                title="Keluar Akun Guru"
              >
                <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                  logout
                </span>
                <span>Keluar</span>
              </button>
            </>
          )}

          {/* Info Sesi Login Siswa */}
          {isSiswaRoute && student && location.pathname !== '/siswa' && (
            <>
              <span className="inline-flex items-center h-8 px-2.5 sm:px-3.5 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#1B3B6F] text-[11.5px] sm:text-[12.5px] font-bold gap-1 sm:gap-1.5 max-w-[130px] sm:max-w-[180px]">
                <span className="material-symbols-outlined text-[15px] text-[#2563EB] shrink-0" aria-hidden="true">
                  badge
                </span>
                <span className="truncate">
                  {student.absenFormatted}. {student.name}
                </span>
              </span>
              <button
                type="button"
                onClick={handleLogoutSiswa}
                className="inline-flex items-center justify-center h-8 px-2.5 sm:px-3.5 rounded-full bg-white hover:bg-[#FEE2E2] border border-[#DCE8F5] hover:border-[#FECACA] text-[#475569] hover:text-[#DC2626] text-[11.5px] sm:text-[12.5px] font-bold gap-1 transition-colors cursor-pointer shrink-0"
                title="Keluar dari Room"
              >
                <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                  logout
                </span>
                <span className="hidden sm:inline">Ganti Akun</span>
                <span className="sm:hidden">Keluar</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopNavbar;
