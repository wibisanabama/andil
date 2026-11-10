import React from 'react';
import { Link } from 'react-router-dom';

export function TopNavbar() {
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
      </div>
    </header>
  );
}

export default TopNavbar;
