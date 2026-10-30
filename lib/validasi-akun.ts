// Validasi form akun. Dipanggil ulang di server (lib/akun.ts); jangan percaya cek dari browser saja.

export const SANDI_MIN = 8;
// Supabase memotong kata sandi di 72 karakter, jadi lebih dari itu ditolak supaya tidak membingungkan.
export const SANDI_MAKS = 72;

const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validasiEmail(email: string): string | null {
  if (email === "") return "Isi alamat email.";
  if (email.length > 254 || !POLA_EMAIL.test(email)) {
    return "Alamat email tidak valid, contoh: nama@gmail.com";
  }
  return null;
}

export function validasiSandiBaru(sandi: string): string | null {
  if (sandi.length < SANDI_MIN) return `Kata sandi minimal ${SANDI_MIN} karakter.`;
  if (sandi.length > SANDI_MAKS) return `Kata sandi maksimal ${SANDI_MAKS} karakter.`;
  return null;
}

const ASAL_PALSU = "http://iqro.invalid";

// Tujuan setelah masuk (?lanjut=...). Hanya jalur di situs ini, supaya link masuk
// tidak bisa dipakai untuk melempar orang ke situs lain (mis. "//situs-jahat.com").
export function jalurAman(lanjut: string | null | undefined, cadangan = "/dasbor"): string {
  if (!lanjut || !lanjut.startsWith("/")) return cadangan;
  try {
    const url = new URL(lanjut, ASAL_PALSU);
    if (url.origin !== ASAL_PALSU) return cadangan;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return cadangan;
  }
}
