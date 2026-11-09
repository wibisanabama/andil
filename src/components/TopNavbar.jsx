import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const GURU_NAV_ITEMS = [
  { label: 'Daftar Room', path: '/guru', exact: true },
  { label: 'Buat Room', path: '/guru/buat-room', exact: true },
  { label: 'Kelola & Penilaian Room', path: '/guru/room', exact: false },
];

const SISWA_NAV_ITEMS = [
  { label: 'Gabung Room', path: '/siswa', exact: true },
  { label: 'Pilih Peran', path: '/siswa/peran', exact: false },
  { label: 'Workspace Kanban', path: '/siswa/workspace', exact: false },
];

export function TopNavbar({ currentPath }) {
  const location = useLocation();
  const pathname = currentPath || location.pathname || '/';

  const isGuruPOV = pathname.startsWith('/guru');
  const isSiswaPOV = pathname.startsWith('/siswa');

  const isNavItemActive = (item) => {
    if (item.exact) {
      return pathname === item.path;
    }
    return pathname === item.path || pathname.startsWith(`${item.path}/`);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E2E8F0]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-[72px] flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link
          to="/"
          className="inline-flex items-center gap-3 group shrink-0 rounded-xl"
          aria-label="Andil, Kembali ke Halaman Utama"
        >
          <span
            className="w-10 h-10 rounded-xl bg-[#0B57D0] text-white flex items-center justify-center shadow-xs group-hover:bg-[#0842A0] transition-colors"
            aria-hidden="true"
          >
            <span className="material-symbols-outlined material-symbols-filled text-[22px]">
              groups
            </span>
          </span>
          <span className="text-[20px] font-extrabold tracking-tight text-[#0F172A]">
            Andil
          </span>
        </Link>

        {/* Center Navigation Menu (POV Guru or POV Siswa) */}
        {isGuruPOV && (
          <nav aria-label="Menu Guru" className="hidden md:flex items-center gap-1.5">
            {GURU_NAV_ITEMS.map((item) => {
              const active = isNavItemActive(item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={`px-4 py-2 rounded-full text-[13.5px] transition-colors ${
                    active
                      ? 'bg-[#D3E3FD] text-[#041E49] font-bold'
                      : 'text-[#334155] hover:text-[#0F172A] hover:bg-[#F0F4F9] font-semibold'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {isSiswaPOV && (
          <nav aria-label="Menu Siswa" className="hidden md:flex items-center gap-1.5">
            {SISWA_NAV_ITEMS.map((item) => {
              const active = isNavItemActive(item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={`px-4 py-2 rounded-full text-[13.5px] transition-colors ${
                    active
                      ? 'bg-[#D3E3FD] text-[#041E49] font-bold'
                      : 'text-[#334155] hover:text-[#0F172A] hover:bg-[#F0F4F9] font-semibold'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Action Buttons */}
        {isGuruPOV && (
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/siswa"
              className="bg-[#F0F4F9] hover:bg-[#E2E8F0] text-[#0F172A] font-bold text-[13px] px-4 py-2 rounded-full transition-colors whitespace-nowrap"
            >
              Lihat POV Siswa
            </Link>
            <Link
              to="/"
              className="text-[#475569] hover:text-[#0F172A] font-semibold text-[13.5px] px-2.5 py-2 rounded-full transition-colors whitespace-nowrap"
            >
              Keluar (/)
            </Link>
          </div>
        )}

        {isSiswaPOV && (
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/guru"
              className="bg-[#F0F4F9] hover:bg-[#E2E8F0] text-[#0F172A] font-bold text-[13px] px-4 py-2 rounded-full transition-colors whitespace-nowrap"
            >
              Lihat POV Guru
            </Link>
            <Link
              to="/"
              className="text-[#475569] hover:text-[#0F172A] font-semibold text-[13.5px] px-2.5 py-2 rounded-full transition-colors whitespace-nowrap"
            >
              Keluar (/)
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default TopNavbar;
