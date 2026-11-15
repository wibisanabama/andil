import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
            {!verifiedRoom
              ? 'Masukkan Kode Room yang dibagikan oleh Guru terlebih dahulu untuk melanjutkan pengisian data siswa.'
              : `Room kelas berhasil ditemukan. Silakan isi Nomor Absen (maksimal ${maxAbsen}), Nama Lengkap, dan Kata Sandi / PIN Siswa.`}
          </p>

          {/* STEP 1: FORM KODE ROOM */}
          {!verifiedRoom ? (
            <form onSubmit={handleVerifyRoom} className="space-y-4">
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

              {errorMessage && (
                <div className="bg-[#FEE2E2] text-[#DC2626] text-[13px] font-semibold p-3 rounded-xl">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isCheckingRoom}
                className="w-full bg-[#0B57D0] hover:bg-[#0842A0] disabled:opacity-60 text-white font-bold text-[14.5px] py-3.5 px-6 rounded-full flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <span>{isCheckingRoom ? 'Memeriksa Kode Room...' : 'Lanjutkan'}</span>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  arrow_forward
                </span>
              </button>
            </form>
          ) : (
            /* STEP 2: FORM NO ABSEN, NAMA LENGKAP, & KATA SANDI / PIN SISWA (WAJIB) */
            <form onSubmit={handleJoin} className="space-y-4">
              {/* Info Room Terverifikasi */}
              <div className="bg-[#F0F4F9] border border-[#D3E3FD] rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-[#0B57D0] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      {verifiedRoom.code}
                    </span>
                    <span className="text-[12px] font-bold text-[#475569]">
                      Batas Absen: 1 s.d. {maxAbsen}
                    </span>
                  </div>
                  <p className="text-[14px] font-extrabold text-[#0F172A] truncate">
                    {verifiedRoom.taskTitle || verifiedRoom.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVerifiedRoom(null);
                    setErrorMessage('');
                  }}
                  className="text-[12px] font-bold text-[#0B57D0] hover:text-[#0842A0] bg-white border border-[#CBD5E1] px-3 py-1.5 rounded-full shrink-0 transition-colors cursor-pointer"
                >
                  Ganti Kode
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-1">
                  <label htmlFor="student-absen" className="text-[13px] font-bold text-[#0F172A] mb-1.5 block">
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
                    className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] focus:border-[#0B57D0] focus:ring-2 focus:ring-[#0B57D0]/20 text-[14.5px] font-bold text-[#0F172A] outline-none placeholder:font-normal placeholder:text-[#94A3B8]"
                    placeholder={`1 - ${maxAbsen}`}
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
                  Kata Sandi / PIN Siswa
                </label>
                <input
                  id="student-password"
                  type="password"
                  value={studentPassword}
                  onChange={(e) => {
                    setStudentPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] focus:border-[#0B57D0] focus:ring-2 focus:ring-[#0B57D0]/20 text-[14px] text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
                  placeholder="Buat atau masukkan kata sandi pengaman absenmu"
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
