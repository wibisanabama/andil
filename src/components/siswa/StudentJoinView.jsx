import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  joinStudentToRoomInSupabase,
  getActiveStudentSession,
} from '../../utils/storageSync';

export function StudentJoinView() {
  const navigate = useNavigate();
  const activeSession = getActiveStudentSession();

  const [roomCode, setRoomCode] = useState(() => activeSession?.roomCode || '');
  const [studentAbsen, setStudentAbsen] = useState(
    () => (activeSession?.absen ? String(activeSession.absen) : '')
  );
  const [studentName, setStudentName] = useState(() => activeSession?.name || '');
  const [studentPassword, setStudentPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setErrorMessage('Silakan masukkan Kode Room yang dibagikan oleh Guru.');
      return;
    }

    setIsJoining(true);
    setErrorMessage('');
    try {
      const result = await joinStudentToRoomInSupabase({
        roomCode: roomCode.trim(),
        absen: studentAbsen,
        name: studentName,
        password: studentPassword,
      });

      if (!result.ok) {
        setErrorMessage(result.error || 'Gagal bergabung ke Room.');
        return;
      }

      navigate('/siswa/peran');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <main className="bg-[#F8FAFD] min-h-[calc(100vh-72px)] py-12 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-[560px] mx-auto">
        <section className="bg-white rounded-[28px] border border-[#E2E8F0] p-8 sm:p-10 shadow-[0_2px_16px_rgba(15,23,42,0.04)]">
          {/* Header Icon */}
          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#D3E3FD] text-[#0B57D0] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
                login
              </span>
            </div>
          </div>

          {/* Title & Description */}
          <h1 className="text-[26px] sm:text-[28px] font-extrabold text-[#0F172A] tracking-tight mb-2">
            Masuk &amp; Gabung ke Room Kelas
          </h1>
          <p className="text-[13.5px] text-[#64748B] leading-relaxed mb-6">
            Masukkan Kode Room yang dibagikan guru beserta Nomor Absen, Nama Lengkap, dan PIN/Kata Sandi untuk masuk ke kelompokmu.
          </p>

          {/* Form */}
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="room-code" className="text-[13px] font-bold text-[#0F172A] mb-1.5 block">
                Kode Room
              </label>
              <input
                id="room-code"
                type="text"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] focus:border-[#0B57D0] focus:ring-2 focus:ring-[#0B57D0]/20 text-[15px] font-bold text-[#0B57D0] tracking-wide outline-none transition-all placeholder:font-normal placeholder:text-[#94A3B8]"
                placeholder="Masukkan Kode Room dari Guru"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-1">
                <label htmlFor="student-absen" className="text-[13px] font-bold text-[#0F172A] mb-1.5 block">
                  No. Absen
                </label>
                <input
                  id="student-absen"
                  type="number"
                  min={1}
                  max={100}
                  value={studentAbsen}
                  onChange={(e) => {
                    setStudentAbsen(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] focus:border-[#0B57D0] focus:ring-2 focus:ring-[#0B57D0]/20 text-[14.5px] font-bold text-[#0F172A] outline-none placeholder:font-normal placeholder:text-[#94A3B8]"
                  placeholder="Contoh: 1"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="student-name" className="text-[13px] font-bold text-[#0F172A] mb-1.5 block">
                  Nama Lengkap Siswa
                </label>
                <input
                  id="student-name"
                  type="text"
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] focus:border-[#0B57D0] focus:ring-2 focus:ring-[#0B57D0]/20 text-[14.5px] font-bold text-[#0F172A] outline-none placeholder:font-normal placeholder:text-[#94A3B8]"
                  placeholder="Masukkan nama lengkapmu"
                />
              </div>
            </div>

            <div>
              <label htmlFor="student-password" className="text-[13px] font-bold text-[#0F172A] mb-1.5 block">
                Kata Sandi / PIN Siswa (Opsional)
              </label>
              <input
                id="student-password"
                type="password"
                value={studentPassword}
                onChange={(e) => {
                  setStudentPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] focus:border-[#0B57D0] focus:ring-2 focus:ring-[#0B57D0]/20 text-[14px] text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
                placeholder="Buat atau masukkan PIN pengaman absenmu"
              />
            </div>

            {errorMessage && (
              <div className="bg-[#FEE2E2] text-[#DC2626] text-[13px] font-semibold p-3 rounded-xl">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isJoining}
              className="w-full bg-[#0B57D0] hover:bg-[#0842A0] disabled:opacity-60 text-white font-bold text-[14.5px] py-3.5 px-6 rounded-full flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <span>{isJoining ? 'Memverifikasi Room...' : 'Masuk ke Kelompok'}</span>
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

export default StudentJoinView;
