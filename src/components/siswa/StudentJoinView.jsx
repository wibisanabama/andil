import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  verifyRoomCodeInSupabase,
  joinStudentToRoomInSupabase,
  getActiveStudentSession,
} from '../../utils/storageSync';

export function StudentJoinView() {
  const navigate = useNavigate();
  const activeSession = getActiveStudentSession();

  const [roomCode, setRoomCode] = useState(() => activeSession?.roomCode || '');
  const [verifiedRoom, setVerifiedRoom] = useState(null);
  const [studentAbsen, setStudentAbsen] = useState(
    () => (activeSession?.absen ? String(activeSession.absen) : '')
  );
  const [studentName, setStudentName] = useState(() => activeSession?.name || '');
  const [studentPassword, setStudentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCheckingRoom, setIsCheckingRoom] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const maxAbsen = Number(verifiedRoom?.plannedStudentCount) || 30;

  // Step 1: Verifikasi Kode Room terlebih dahulu
  const handleVerifyRoom = async (e) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setErrorMessage('Silakan masukkan Kode Room yang dibagikan oleh Guru.');
      return;
    }

    setIsCheckingRoom(true);
    setErrorMessage('');
    try {
      const result = await verifyRoomCodeInSupabase(roomCode.trim());
      if (!result.ok) {
        setErrorMessage(result.error || 'Kode Room tidak ditemukan.');
        return;
      }

      setVerifiedRoom(result.room);
      const limit = Number(result.room.plannedStudentCount) || 30;
      if (studentAbsen && Number(studentAbsen) > limit) {
        setStudentAbsen('');
      }
    } finally {
      setIsCheckingRoom(false);
    }
  };

  // Step 2: Isi No. Absen (sesuai batas Room), Nama Lengkap, dan Kata Sandi / PIN Siswa (Wajib)
  const handleJoin = async (e) => {
    e.preventDefault();
    if (!verifiedRoom) return;

    const parsedAbsen = parseInt(studentAbsen, 10);
    if (Number.isNaN(parsedAbsen) || parsedAbsen < 1 || parsedAbsen > maxAbsen) {
      setErrorMessage(`Nomor Absen harus di antara 1 sampai ${maxAbsen} sesuai jumlah siswa yang diatur Guru.`);
      return;
    }

    if (!studentName.trim()) {
      setErrorMessage('Silakan masukkan Nama Lengkap Siswa.');
      return;
    }

    if (!studentPassword.trim()) {
      setErrorMessage('Kata Sandi / PIN Siswa wajib diisi untuk mengamankan nomor absenmu.');
      return;
    }

    if (studentPassword.trim().length < 4) {
      setErrorMessage('Kata Sandi / PIN Siswa minimal 4 karakter.');
      return;
    }

    setIsJoining(true);
    setErrorMessage('');
    try {
      const result = await joinStudentToRoomInSupabase({
        roomCode: verifiedRoom.code,
        absen: parsedAbsen,
        name: studentName.trim(),
        password: studentPassword.trim(),
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
    <main className="bg-[#F4F9FF] min-h-[calc(100vh-72px)] py-12 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-[560px] mx-auto">
        <div className="mb-4 flex items-center justify-between gap-2">
          {!verifiedRoom ? (
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#1B3B6F] hover:text-[#2563EB] bg-white border border-[#DCE8F5] px-4 py-2 rounded-full shadow-2xs transition-colors no-underline"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                arrow_back
              </span>
              <span>Kembali ke Halaman Utama</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setVerifiedRoom(null);
                setErrorMessage('');
              }}
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#1B3B6F] hover:text-[#2563EB] bg-white border border-[#DCE8F5] px-4 py-2 rounded-full shadow-2xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                arrow_back
              </span>
              <span>Kembali Ubah Kode Room</span>
            </button>
          )}
        </div>

        <section className="bg-white rounded-[28px] border border-[#DCE8F5] p-8 sm:p-10 shadow-[0_2px_16px_rgba(15,23,42,0.04)]">
          {/* Header Icon */}
          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] text-[#2563EB] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
                login
              </span>
            </div>
          </div>

          {/* Title & Description */}
          <h1 className="text-[26px] sm:text-[28px] font-extrabold text-[#1B3B6F] tracking-tight mb-2">
            Masuk &amp; Gabung ke Room Kelas
          </h1>
          <p className="text-[13.5px] text-[#64748B] leading-relaxed mb-6">
            {!verifiedRoom
              ? 'Masukkan Kode Room yang dibagikan oleh Guru terlebih dahulu untuk melanjutkan pengisian data siswa.'
              : `Room kelas berhasil ditemukan. Silakan isi Nomor Absen (maksimal ${maxAbsen}), Nama Lengkap, dan Kata Sandi / PIN Siswa.`}
          </p>

          {/* STEP 1: FORM KODE ROOM */}
          {!verifiedRoom ? (
            <form onSubmit={handleVerifyRoom} className="space-y-4">
              <div>
                <label htmlFor="room-code" className="text-[13px] font-bold text-[#1B3B6F] mb-1.5 block">
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
                  className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-[15px] font-bold text-[#2563EB] tracking-wide outline-none transition-all placeholder:font-normal placeholder:text-[#94A3B8]"
                  placeholder="Masukkan Kode Room dari Guru"
                  required
                />
              </div>

              {errorMessage && (
                <div className="bg-[#FEE2E2] text-[#DC2626] text-[13px] font-semibold p-3 rounded-xl">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isCheckingRoom}
                className="w-full bg-[#2563EB] hover:bg-[#1B3B6F] disabled:opacity-60 text-white font-bold text-[14.5px] py-3.5 px-6 rounded-full flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <span>{isCheckingRoom ? 'Memeriksa Kode Room...' : 'Lanjutkan'}</span>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  arrow_forward
                </span>
              </button>

              <div className="pt-3 border-t border-[#F1F5F9] text-center">
                <Link
                  to="/guru"
                  className="text-[12.5px] font-bold text-[#475569] hover:text-[#2563EB] inline-flex items-center gap-1 transition-colors no-underline"
                >
                  <span>Bukan Siswa? Masuk sebagai Guru</span>
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </form>
          ) : (
            /* STEP 2: FORM NO ABSEN, NAMA LENGKAP, & KATA SANDI / PIN SISWA (WAJIB) */
            <form onSubmit={handleJoin} className="space-y-4">
              {/* Info Room Terverifikasi */}
              <div className="bg-[#EDF5FD] border border-[#E0F2FE] rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-[#2563EB] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      {verifiedRoom.code}
                    </span>
                    <span className="text-[12px] font-bold text-[#475569]">
                      Batas Absen: 1 s.d. {maxAbsen}
                    </span>
                  </div>
                  <p className="text-[14px] font-extrabold text-[#1B3B6F] truncate">
                    {verifiedRoom.taskTitle || verifiedRoom.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVerifiedRoom(null);
                    setErrorMessage('');
                  }}
                  className="text-[12px] font-bold text-[#2563EB] hover:text-[#1B3B6F] bg-white border border-[#CBD5E1] px-3 py-1.5 rounded-full shrink-0 transition-colors cursor-pointer"
                >
                  Ganti Kode
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-1">
                  <label htmlFor="student-absen" className="text-[13px] font-bold text-[#1B3B6F] mb-1.5 block">
                    No. Absen (1-{maxAbsen})
                  </label>
                  <input
                    id="student-absen"
                    type="number"
                    min={1}
                    max={maxAbsen}
                    value={studentAbsen}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') {
                        setStudentAbsen('');
                      } else {
                        const num = parseInt(raw, 10);
                        if (!Number.isNaN(num)) {
                          const clamped = Math.min(Math.max(num, 1), maxAbsen);
                          setStudentAbsen(String(clamped));
                        }
                      }
                      if (errorMessage) setErrorMessage('');
                    }}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-[14.5px] font-bold text-[#1B3B6F] outline-none placeholder:font-normal placeholder:text-[#94A3B8]"
                    placeholder={`1 - ${maxAbsen}`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="student-name" className="text-[13px] font-bold text-[#1B3B6F] mb-1.5 block">
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
                    className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-[14.5px] font-bold text-[#1B3B6F] outline-none placeholder:font-normal placeholder:text-[#94A3B8]"
                    placeholder="Masukkan nama lengkapmu"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="student-password" className="text-[13px] font-bold text-[#1B3B6F] mb-1.5 block">
                  Kata Sandi / PIN Siswa
                </label>
                <div className="relative">
                  <input
                    id="student-password"
                    type={showPassword ? 'text' : 'password'}
                    minLength={4}
                    value={studentPassword}
                    onChange={(e) => {
                      setStudentPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    required
                    className="w-full pl-4 pr-11 py-3 rounded-xl border border-[#CBD5E1] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 text-[14px] text-[#1B3B6F] outline-none placeholder:text-[#94A3B8]"
                    placeholder="Minimal 4 karakter"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isJoining}
                className="w-full bg-[#2563EB] hover:bg-[#1B3B6F] disabled:opacity-60 text-white font-bold text-[14.5px] py-3.5 px-6 rounded-full flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <span>{isJoining ? 'Memproses Masuk...' : 'Gabung ke Room Kelas'}</span>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  arrow_forward
                </span>
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

export default StudentJoinView;
