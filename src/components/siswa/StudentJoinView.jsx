import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomData } from '../../utils/storageSync';
import { ACTIVE_STUDENT_POV } from '../../data/sampleRoomData';

export function StudentJoinView() {
  const navigate = useNavigate();
  const [roomData] = useRoomData();

  const defaultRoomCode = roomData?.room?.code || 'ANDIL-2026';
  const [roomCode, setRoomCode] = useState(defaultRoomCode);
  const [studentAbsen, setStudentAbsen] = useState(ACTIVE_STUDENT_POV.absenFormatted || '02');
  const [studentName, setStudentName] = useState(ACTIVE_STUDENT_POV.name || 'Budi Santoso');
  const [errorMessage, setErrorMessage] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setErrorMessage('Silakan masukkan Kode Room yang valid.');
      return;
    }

    // Navigasi ke halaman pemilihan peran kelompok
    navigate('/siswa/peran');
  };

  return (
    <main className="bg-[#F8FAFD] min-h-[calc(100vh-72px)] py-12 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-[560px] mx-auto">
        <section className="bg-white rounded-[28px] border border-[#E2E8F0] p-8 sm:p-10 shadow-[0_2px_16px_rgba(15,23,42,0.04)]">
          {/* Header Row: Action Icon & POV Badge */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#D3E3FD] text-[#0B57D0] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
                login
              </span>
            </div>
            <div className="inline-flex items-center bg-[#D3E3FD] text-[#041E49] px-3.5 py-1 rounded-full text-[12px] font-bold font-mono">
              POV Siswa • /siswa
            </div>
          </div>

          {/* Title & Description */}
          <h1 className="text-[26px] sm:text-[28px] font-extrabold text-[#0F172A] tracking-tight mb-2">
            Gabung ke Room Kelas
          </h1>
          <p className="text-[13.5px] text-[#64748B] leading-relaxed mb-6">
            Masukkan Kode Room yang dibagikan guru beserta Nomor Absen dan Nama Lengkapmu untuk masuk ke kelompok.
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
                className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] focus:border-[#0B57D0] focus:ring-2 focus:ring-[#0B57D0]/20 text-[15px] font-bold text-[#0B57D0] tracking-wide outline-none transition-all placeholder:text-[#94A3B8]"
                placeholder="ANDIL-2026"
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
                  type="text"
                  value={studentAbsen}
                  onChange={(e) => setStudentAbsen(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F0F4F9] border border-transparent text-[14.5px] font-bold text-[#0F172A] outline-none"
                  placeholder="02"
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
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F0F4F9] border border-transparent text-[14.5px] font-bold text-[#0F172A] outline-none"
                  placeholder="Budi Santoso"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="bg-[#FEE2E2] text-[#DC2626] text-[13px] font-semibold p-3 rounded-xl">
                {errorMessage}
              </div>
            )}

            {/* Info Callout Box */}
            <div className="bg-[#F0F4F9] rounded-2xl p-4 flex items-start gap-3 border border-[#E2E8F0]/60 text-[13px] text-[#475569] leading-relaxed">
              <span
                className="material-symbols-outlined material-symbols-filled text-[#0B57D0] text-[20px] shrink-0 mt-0.5"
                aria-hidden="true"
              >
                info
              </span>
              <p>
                Pada POV Siswa ini, kamu masuk sebagai{' '}
                <strong className="text-[#0F172A] font-bold">Budi Santoso (Absen 02)</strong> yang tergabung di dalam{' '}
                <strong className="text-[#0F172A] font-bold">Kelompok 1</strong>.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#0B57D0] hover:bg-[#0842A0] text-white font-bold text-[14.5px] py-3.5 px-6 rounded-full flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <span>Masuk ke Kelompok 1 (/siswa/peran)</span>
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

