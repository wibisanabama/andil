import { useState, useEffect, useCallback } from 'react';
import { sampleRoomData } from '../data/sampleRoomData';

export const STORAGE_KEY = 'andil_mvp_room_data_v1';
const CUSTOM_SYNC_EVENT = 'andil:storage-sync';

/**
 * Mengambil salinan mendalam (deep clone) dari sampleRoomData
 */
function cloneDefaultData() {
  return JSON.parse(JSON.stringify(sampleRoomData));
}

/**
 * Memuat state Room dari LocalStorage.
 * Jika belum tersedia atau tidak valid, otomatis menginisialisasi dengan sampleRoomData.
 */
export function loadRoomData() {
  if (typeof window === 'undefined') {
    return cloneDefaultData();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = cloneDefaultData();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.room || !Array.isArray(parsed.groups) || !Array.isArray(parsed.students)) {
      const initial = cloneDefaultData();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return parsed;
  } catch (err) {
    console.warn('Gagal membaca LocalStorage Andil, menggunakan sampleRoomData:', err);
    return cloneDefaultData();
  }
}

/**
 * Menyimpan state Room ke LocalStorage dan memicu sinkronisasi pada tab saat ini maupun tab lain.
 */
export function saveRoomData(nextData) {
  if (typeof window === 'undefined') return nextData;
  try {
    const resolved = typeof nextData === 'function' ? nextData(loadRoomData()) : nextData;
    const serialized = JSON.stringify(resolved);
    window.localStorage.setItem(STORAGE_KEY, serialized);
    window.dispatchEvent(new CustomEvent(CUSTOM_SYNC_EVENT, { detail: resolved }));
    return resolved;
  } catch (err) {
    console.error('Gagal menyimpan data ke LocalStorage:', err);
    return nextData;
  }
}

/**
 * Mengembalikan data Room ke kondisi awal (sampleRoomData).
 */
export function resetRoomData() {
  const initial = cloneDefaultData();
  saveRoomData(initial);
  return initial;
}

/**
 * Berlangganan perubahan data baik dari tab lain (via window 'storage' event)
 * maupun dari komponen lain di tab yang sama (via custom event).
 */
export function subscribeToStorage(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleStorageEvent = (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        callback(parsed);
      } catch (err) {
        console.error('Gagal memproses sinkronisasi storage antar-tab:', err);
      }
    } else if (event.key === STORAGE_KEY && event.newValue === null) {
      callback(loadRoomData());
    }
  };

  const handleCustomSync = (event) => {
    if (event.detail) {
      callback(event.detail);
    }
  };

  window.addEventListener('storage', handleStorageEvent);
  window.addEventListener(CUSTOM_SYNC_EVENT, handleCustomSync);

  return () => {
    window.removeEventListener('storage', handleStorageEvent);
    window.removeEventListener(CUSTOM_SYNC_EVENT, handleCustomSync);
  };
}

/**
 * React Hook untuk membaca dan memperbarui state Room Andil secara reaktif & tersinkronisasi antar-tab.
 */
export function useRoomData() {
  const [data, setData] = useState(() => loadRoomData());

  useEffect(() => {
    return subscribeToStorage((updatedData) => {
      setData(updatedData);
    });
  }, []);

  const updateData = useCallback((updater) => {
    setData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveRoomData(next);
      return next;
    });
  }, []);

  const resetData = useCallback(() => {
    const initial = resetRoomData();
    setData(initial);
    return initial;
  }, []);

  return [data, updateData, resetData];
}

// Alias ekspor tambahan untuk kompatibilitas lintas modul (Issues #2 s.d. #6)
export const getRoomData = loadRoomData;
export const updateRoomData = saveRoomData;
export const initRoomData = loadRoomData;

export default {
  STORAGE_KEY,
  loadRoomData,
  saveRoomData,
  resetRoomData,
  subscribeToStorage,
  useRoomData,
  getRoomData,
  updateRoomData,
  initRoomData,
};
