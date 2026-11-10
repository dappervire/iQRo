// Aturan slug = bagian setelah iqro-alpha.vercel.app/ di link pendek.
// Database punya cek format yang sama (supabase/schema.sql), jadi keduanya harus sejalan.

export const SLUG_MIN = 3;
export const SLUG_MAKS = 32;

const PANJANG_OTOMATIS = 7;
// Tanpa 0/o/1/l/i supaya tidak tertukar saat diketik ulang dari kertas. 31 karakter.
const ALFABET = "abcdefghjkmnpqrstuvwxyz23456789";
// 248 = kelipatan 31 tertinggi di bawah 256. Angka acak di atasnya dibuang,
// supaya setiap karakter punya peluang yang sama.
const BATAS_ACAK = Math.floor(256 / ALFABET.length) * ALFABET.length;

const POLA_SLUG = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

// Nama halaman iQRo (sekarang dan yang direncanakan), plus nama umum yang bisa menyesatkan.
// Halaman asli selalu menang atas link pendek, jadi slug ini tidak akan pernah bisa dibuka.
const KATA_TERLARANG = new Set([
  "masuk",
  "daftar",
  "dasbor",
  "pendek",
  "api",
  "auth",
  "privasi",
  "laporkan",
  "lupa-sandi",
  "sandi-baru",
  "link-tidak-aktif",
  "akun-dihapus",
  "toko",
  "keluar",
  "akun",
  "admin",
  "login",
  "logout",
  "signup",
  "register",
  "dashboard",
  "settings",
  "bantuan",
  "help",
  "tentang",
  "kontak",
  "icon",
  "favicon",
  "robots",
  "sitemap",
  "static",
  "public",
  "www",
  "iqro",
]);

// Huruf besar → kecil, spasi di ujung dibuang. Dipakai sebelum validasi dan sebelum disimpan.
export function rapikanSlug(masukan: string): string {
  return masukan.trim().toLowerCase();
}

// Cek cepat untuk rute redirect: bentuknya mungkin slug atau tidak.
export function formatSlugBenar(slug: string): boolean {
  return slug.length >= SLUG_MIN && slug.length <= SLUG_MAKS && POLA_SLUG.test(slug);
}

// null = boleh dipakai. Slug sudah dipakai orang lain dicek database (constraint unique).
// "sebutan" = nama kolom di pesan galat; halaman toko (M14) memakai aturan yang sama.
export function validasiSlug(slug: string, sebutan = "Nama link"): string | null {
  if (slug.length < SLUG_MIN) return `${sebutan} minimal ${SLUG_MIN} karakter.`;
  if (slug.length > SLUG_MAKS) return `${sebutan} maksimal ${SLUG_MAKS} karakter.`;
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return `${sebutan} hanya boleh huruf a–z, angka 0–9, dan tanda minus (-).`;
  }
  if (!POLA_SLUG.test(slug)) {
    return `${sebutan} tidak boleh diawali atau diakhiri tanda minus (-).`;
  }
  if (KATA_TERLARANG.has(slug)) return `"${slug}" dipakai iQRo sendiri. Coba nama lain.`;
  return null;
}

// Slug acak 7 karakter, mis. "k7pq2xm". Bentrok dengan yang sudah ada → lib/link.ts mencoba lagi.
export function slugOtomatis(): string {
  const hasil: string[] = [];
  const acak = new Uint8Array(1);
  while (hasil.length < PANJANG_OTOMATIS) {
    crypto.getRandomValues(acak);
    if (acak[0] < BATAS_ACAK) hasil.push(ALFABET[acak[0] % ALFABET.length]);
  }
  return hasil.join("");
}
