import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useAuthSession,
  loginTeacherInSupabase,
  registerTeacherInSupabase,
} from '../../utils/storageSync';

/**
 * TeacherAuthGate
 * Membungkus halaman Guru (/guru, /guru/buat-room, /guru/room) dengan autentikasi nyata
 * menggunakan tabel public.users di Supabase tanpa data mock/dummy.
 */
export function TeacherAuthGate({ children }) {
  const { teacher } = useAuthSession();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (teacher) {
    return children;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (mode === 'register') {
        const res = await registerTeacherInSupabase({ name, email, password });
        if (!res.ok) {
          setErrorMessage(res.error);
        }
      } else {
        const res = await loginTeacherInSupabase({ email, password });
        if (!res.ok) {
          setErrorMessage(res.error);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-[#F4F9FF] min-h-[calc(100vh-72px)] py-6 sm:py-12 px-3.5 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-[520px] mx-auto">
        <div className="mb-3.5 sm:mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[12.5px] sm:text-[13px] font-bold text-[#1B3B6F] hover:text-[#2563EB] bg-white border border-[#DCE8F5] px-3.5 sm:px-4 py-2 rounded-full shadow-2xs transition-colors no-underline"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              arrow_back
            </span>
            <span>Kembali ke Halaman Utama</span>
          </Link>
        </div>

        <section className="bg-white rounded-[22px] sm:rounded-[28px] border border-[#DCE8F5] p-5 sm:p-10 shadow-[0_2px_16px_rgba(15,23,42,0.04)]">
          {/* Icon & Mode Switcher */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] text-[#2563EB] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
                school
              </span>
            </div>

            <div className="bg-[#EDF5FD] p-1 rounded-full border border-[#DCE8F5] inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                }}
                className={
                  mode === 'login'
                    ? 'bg-[#E0F2FE] text-[#1B3B6F] font-extrabold px-4 py-1.5 rounded-full text-[12.5px] transition-colors cursor-pointer'
                    : 'text-[#475569] hover:text-[#1B3B6F] font-semibold px-4 py-1.5 rounded-full text-[12.5px] transition-colors cursor-pointer'
                }
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage('');
                }}
                className={
                  mode === 'register'
                    ? 'bg-[#E0F2FE] text-[#1B3B6F] font-extrabold px-4 py-1.5 rounded-full text-[12.5px] transition-colors cursor-pointer'
                    : 'text-[#475569] hover:text-[#1B3B6F] font-semibold px-4 py-1.5 rounded-full text-[12.5px] transition-colors cursor-pointer'
                }
              >
                Daftar Akun
              </button>
            </div>
          </div>

          <h1 className="text-[26px] sm:text-[28px] font-extrabold text-[#1B3B6F] tracking-tight mb-2">
            {mode === 'login' ? 'Masuk Akun Guru' : 'Daftar Akun Guru Baru'}
          </h1>
          <p className="text-[13.5px] text-[#64748B] leading-relaxed mb-6">
            {mode === 'login'
              ? 'Masuk menggunakan email dan kata sandi untuk mengelola Room tugas kelompok dan penilaian siswa.'
              : 'Buat akun Guru untuk mulai membuat Room kelas, membagi kelompok, dan menilai kontribusi siswa.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="teacher-name" className="text-[13px] font-bold text-[#1B3B6F] mb-1.5 block">
                  Nama Lengkap Guru
                </label>
                <input
                  id="teacher-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Contoh: Budi Raharjo, S.Kom."
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-[14px] text-[#1B3B6F] outline-none transition-all placeholder:text-[#94A3B8]"
                />
              </div>
            )}

            <div>
              <label htmlFor="teacher-email" className="text-[13px] font-bold text-[#1B3B6F] mb-1.5 block">
                Email Guru
              </label>
              <input
                id="teacher-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="guru@sekolah.sch.id"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-[14px] text-[#1B3B6F] outline-none transition-all placeholder:text-[#94A3B8]"
              />
            </div>

            <div>
              <label htmlFor="teacher-password" className="text-[13px] font-bold text-[#1B3B6F] mb-1.5 block">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="teacher-password"
                  type={showPassword ? 'text' : 'password'}
                  minLength={4}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Minimal 4 karakter"
                  required
                  className="w-full pl-4 pr-11 py-3 rounded-xl border border-[#CBD5E1] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-[14px] text-[#1B3B6F] outline-none transition-all placeholder:text-[#94A3B8]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-[#64748B] hover:text-[#1B3B6F] hover:bg-[#EDF5FD] flex items-center justify-center transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                >
                  <span className="material-symbols-outlined text-[19px]" aria-hidden="true">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="bg-[#FEE2E2] text-[#DC2626] text-[13px] font-semibold p-3 rounded-xl">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2563EB] hover:bg-[#1B3B6F] disabled:opacity-60 text-white font-bold text-[14.5px] py-3.5 px-6 rounded-full flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <span>
                {isLoading
                  ? 'Memproses...'
                  : mode === 'login'
                  ? 'Masuk ke Dashboard Guru'
                  : 'Daftar & Masuk ke Dashboard Guru'}
              </span>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                arrow_forward
              </span>
            </button>

            <div className="pt-3 border-t border-[#F1F5F9] text-center">
              <Link
                to="/siswa"
                className="text-[12.5px] font-bold text-[#475569] hover:text-[#2563EB] inline-flex items-center gap-1 transition-colors no-underline"
              >
                <span>Bukan Guru? Masuk sebagai Siswa</span>
                <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default TeacherAuthGate;
