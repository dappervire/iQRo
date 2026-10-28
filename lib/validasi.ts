import type { HasilUrl } from "./types";

const BATAS_PERINGATAN = 300;
const BATAS_MAKS = 1000;

// "javascript:", "mailto:", "https:" dianggap skema. "tokoku.id:8080" bukan (ada titik).
const ADA_SKEMA = /^[a-z][a-z0-9+-]*:/i;

export function normalisasiUrl(masukan: string): HasilUrl {
  const teks = masukan.trim();
  if (teks === "") return { ok: false, error: null };
  if (teks.length > BATAS_MAKS) {
    return { ok: false, error: `Link terlalu panjang (maksimal ${BATAS_MAKS} karakter).` };
  }

  const kandidat = ADA_SKEMA.test(teks) ? teks : `https://${teks}`;

  let url: URL;
  try {
    url = new URL(kandidat);
  } catch {
    return { ok: false, error: "Link tidak valid. Periksa lagi penulisannya." };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Hanya link yang diawali http:// atau https:// yang bisa dipakai." };
  }
  if (!url.hostname.includes(".")) {
    return { ok: false, error: "Alamat situs belum lengkap, contoh: tokoku.id" };
  }

  // URL menambahkan "/" di akhir alamat polos; buang supaya sama dengan yang diketik.
  const hasil = url.href === `${kandidat}/` ? kandidat : url.href;
  if (hasil.length > BATAS_MAKS) {
    return { ok: false, error: `Link terlalu panjang (maksimal ${BATAS_MAKS} karakter).` };
  }

  const peringatan =
    hasil.length > BATAS_PERINGATAN
      ? "Link ini panjang, jadi QR-nya rapat dan lebih sulit di-scan. Pertimbangkan memakai pemendek link."
      : null;

  return { ok: true, url: hasil, peringatan };
}
