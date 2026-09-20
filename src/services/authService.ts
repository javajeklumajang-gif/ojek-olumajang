import { Driver } from '../types';

const SESSION_KEY = 'ojek_olumajang_driver_session';
const REMEMBER_FLAG_KEY = 'ojek_olumajang_driver_remember';

/**
 * Hash password menggunakan SHA-256 bawaan Web Crypto API
 * Password tidak pernah disimpan dalam plain text.
 */
export async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password + '_ojek_olumajang_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Menyimpan sesi login driver
 */
export function saveDriverSession(driverId: string, rememberMe: boolean): void {
  if (rememberMe) {
    localStorage.setItem(SESSION_KEY, driverId);
    localStorage.setItem(REMEMBER_FLAG_KEY, 'true');
    sessionStorage.removeItem(SESSION_KEY);
  } else {
    sessionStorage.setItem(SESSION_KEY, driverId);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(REMEMBER_FLAG_KEY);
  }
}

/**
 * Membaca sesi login driver saat ini
 */
export function getStoredDriverSession(): { driverId: string | null; rememberMe: boolean } {
  const localDriver = localStorage.getItem(SESSION_KEY);
  if (localDriver) {
    return { driverId: localDriver, rememberMe: true };
  }
  const sessionDriver = sessionStorage.getItem(SESSION_KEY);
  if (sessionDriver) {
    return { driverId: sessionDriver, rememberMe: false };
  }
  return { driverId: null, rememberMe: false };
}

export const getDriverSession = getStoredDriverSession;

/**
 * Hapus sesi login driver
 */
export function clearDriverSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(REMEMBER_FLAG_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Verifikasi login driver
 */
export async function authenticateDriver(
  identifier: string,
  plainPassword: string,
  drivers: Driver[]
): Promise<{ success: boolean; driver?: Driver; error?: string }> {
  const cleanId = identifier.trim().toLowerCase();
  const driver = drivers.find(
    (d) =>
      d.username.toLowerCase() === cleanId ||
      d.whatsapp.replace(/\D/g, '') === cleanId.replace(/\D/g, '')
  );

  if (!driver) {
    return { success: false, error: 'Akun Driver tidak ditemukan dengan Username/No WA tersebut.' };
  }

  if (driver.status === 'MENUNGGU VERIFIKASI') {
    return {
      success: false,
      error: 'Akun Anda sedang dalam proses verifikasi oleh Admin. Silakan tunggu konfirmasi.',
    };
  }

  if (driver.status === 'DITOLAK') {
    return { success: false, error: 'Pendaftaran Anda belum disetujui oleh Admin.' };
  }

  if (driver.status === 'NONAKTIF') {
    return { success: false, error: 'Akun Anda sedang dinonaktifkan/disuspend oleh Admin.' };
  }

  const inputHash = await hashPassword(plainPassword);
  if (driver.passwordHash !== inputHash) {
    return { success: false, error: 'Password salah. Silakan periksa kembali.' };
  }

  return { success: true, driver };
}

// ==========================================================
// ADMIN AUTHENTICATION (TAHAP 3 - SISTEM MANDIRI)
// ==========================================================

const ADMIN_SESSION_KEY = 'ojek_olumajang_admin_session_v2';
const ADMIN_REMEMBER_KEY = 'ojek_olumajang_admin_remember_v2';
const ADMIN_PASSWORD_HASH_KEY = 'ojek_olumajang_admin_pwd_hash_v2';

// Daftar username yang diizinkan sebagai Administrator
const ALLOWED_ADMIN_USERNAMES = ['admin', 'admin_olumajang', 'adminolumajang', 'dispatcher'];

// Hapus sesi legacy jika ada
try {
  localStorage.removeItem('ojek_olumajang_admin_session_v1');
  localStorage.removeItem('ojek_olumajang_admin_remember_v1');
} catch {
  // safe ignore
}

/**
 * Autentikasi Login Admin (Local Preview Auth)
 * - Password diverifikasi murni menggunakan SHA-256 (tidak pernah plain text).
 * - Menjaga kerahasiaan: tidak pernah membocorkan password di UI, error, atau console.
 * - Jika salah, selalu menghasilkan pesan seragam: "Username atau password salah."
 */
export async function authenticateAdmin(
  usernameInput: string,
  plainPasswordInput: string
): Promise<{ success: boolean; username?: string; name?: string; error?: string }> {
  const cleanUsername = (usernameInput || '').trim().toLowerCase();
  const cleanPassword = (plainPasswordInput || '').trim();

  // Wajib terisi
  if (!cleanUsername || !cleanPassword) {
    return { success: false, error: 'Username atau password salah.' };
  }

  // Cek apakah username termasuk akun Admin
  const isAllowedUser = ALLOWED_ADMIN_USERNAMES.includes(cleanUsername);
  if (!isAllowedUser) {
    return { success: false, error: 'Username atau password salah.' };
  }

  const inputHash = await hashPassword(cleanPassword);
  const storedHash = localStorage.getItem(ADMIN_PASSWORD_HASH_KEY);

  // Jika password admin belum diset oleh pengguna sebelumnya,
  // password yang dimasukkan pertama kali ini langsung ditetapkan sebagai password Admin baru.
  if (!storedHash) {
    localStorage.setItem(ADMIN_PASSWORD_HASH_KEY, inputHash);
    return {
      success: true,
      username: cleanUsername,
      name: cleanUsername === 'admin' ? 'Admin Utama' : 'Admin Dispatcher',
    };
  }

  // Verifikasi hash SHA-256
  if (storedHash !== inputHash) {
    return {
      success: false,
      error: 'Username atau password salah.',
    };
  }

  return {
    success: true,
    username: cleanUsername,
    name: cleanUsername === 'admin' ? 'Admin Utama' : 'Admin Dispatcher',
  };
}

/**
 * Ubah Kata Sandi Admin (Hanya dapat diakses setelah Admin berhasil login)
 */
export async function updateAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const storedHash = localStorage.getItem(ADMIN_PASSWORD_HASH_KEY);
  if (storedHash) {
    const currentHash = await hashPassword(currentPassword);
    if (currentHash !== storedHash) {
      return { success: false, error: 'Kata sandi lama tidak sesuai.' };
    }
  }

  if (!newPassword || newPassword.trim().length < 4) {
    return { success: false, error: 'Kata sandi baru minimal 4 karakter.' };
  }

  const newHash = await hashPassword(newPassword.trim());
  localStorage.setItem(ADMIN_PASSWORD_HASH_KEY, newHash);
  return { success: true };
}

/**
 * Simpan Sesi Login Admin
 */
export function saveAdminSession(username: string, rememberMe: boolean): void {
  if (rememberMe) {
    localStorage.setItem(ADMIN_SESSION_KEY, username);
    localStorage.setItem(ADMIN_REMEMBER_KEY, 'true');
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } else {
    sessionStorage.setItem(ADMIN_SESSION_KEY, username);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_REMEMBER_KEY);
  }
}

/**
 * Dapatkan Sesi Login Admin
 */
export function getAdminSession(): { username: string | null; rememberMe: boolean } {
  const localAdmin = localStorage.getItem(ADMIN_SESSION_KEY);
  if (localAdmin) {
    return { username: localAdmin, rememberMe: true };
  }
  const sessionAdmin = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (sessionAdmin) {
    return { username: sessionAdmin, rememberMe: false };
  }
  return { username: null, rememberMe: false };
}

/**
 * Hapus Sesi Login Admin (Logout)
 */
export function clearAdminSession(): void {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(ADMIN_REMEMBER_KEY);
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}


