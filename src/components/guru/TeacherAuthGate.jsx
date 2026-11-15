import React, { useState } from 'react';
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
    <main className="bg-[#F8FAFD] min-h-[calc(100vh-72px)] py-12 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-[520px] mx-auto">
        <section className="bg-white rounded-[28px] border border-[#E2E8F0] p-8 sm:p-10 shadow-[0_2px_16px_rgba(15,23,42,0.04)]">
          {/* Icon & Mode Switcher */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#D3E3FD] text-[#0B57D0] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
                school
              </span>
            </div>

            <div className="bg-[#F0F4F9] p-1 rounded-full border border-[#E2E8F0] inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                }}
                className={
                  mode === 'login'
                    ? 'bg-[#D3E3FD] text-[#041E49] font-extrabold px-4 py-1.5 rounded-full text-[12.5px] transition-colors cursor-pointer'
                    : 'text-[#475569] hover:text-[#0F172A] font-semibold px-4 py-1.5 rounded-full text-[12.5px] transition-colors cursor-pointer'
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
                    ? 'bg-[#D3E3FD] text-[#041E49] font-extrabold px-4 py-1.5 rounded-full text-[12.5px] transition-colors cursor-pointer'
                    : 'text-[#475569] hover:text-[#0F172A] font-semibold px-4 py-1.5 rounded-full text-[12.5px] transition-colors cursor-pointer'
                }
              >
                Daftar Akun
              </button>
            </div>
          </div>

          <h1 className="text-[26px] sm:text-[28px] font-extrabold text-[#0F172A] tracking-tight mb-2">
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
                <label htmlFor="teacher-name" className="text-[13px] font-bold text-[#0F172A] mb-1.5 block">
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
                  className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] focus:border-[#0B57D0] focus:ring-2 focus:ring-[#0B57D0]/20 text-[14px] text-[#0F172A] outline-none transition-all placeholder:text-[#94A3B8]"
                />
              </div>
            )}

            <div>
              <label htmlFor="teacher-email" className="text-[13px] font-bold text-[#0F172A] mb-1.5 block">
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
                className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] focus:border-[#0B57D0] focus:ring-2 focus:ring-[#0B57D0]/20 text-[14px] text-[#0F172A] outline-none transition-all placeholder:text-[#94A3B8]"
              />
            </div>

            <div>
              <label htmlFor="teacher-password" className="text-[13px] font-bold text-[#0F172A] mb-1.5 block">
                Kata Sandi
              </label>
              <input
                id="teacher-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Minimal 4 karakter"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] focus:border-[#0B57D0] focus:ring-2 focus:ring-[#0B57D0]/20 text-[14px] text-[#0F172A] outline-none transition-all placeholder:text-[#94A3B8]"
              />
            </div>

            {errorMessage && (
              <div className="bg-[#FEE2E2] text-[#DC2626] text-[13px] font-semibold p-3 rounded-xl">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0B57D0] hover:bg-[#0842A0] disabled:opacity-60 text-white font-bold text-[14.5px] py-3.5 px-6 rounded-full flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
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
          </form>
        </section>
      </div>
    </main>
  );
}

export default TeacherAuthGate;
