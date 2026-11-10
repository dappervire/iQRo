import type { HasilNomorWa, HasilWa } from "./types";
import { normalisasiUrl } from "./validasi";

export const PANJANG_PESAN_WA_MAKS = 300;

const DIGIT_MIN = 10;
const DIGIT_MAKS = 15;

// Boleh: angka, spasi, strip, titik, kurung, dan satu "+" di paling depan.
const KARAKTER_BOLEH = /^\+?[0-9\s.()-]+$/;

// "0812-3456-7890", "+62 812 3456 7890", "62812…", "812…" → "6281234567890".
// Nomor luar negeri harus ditulis dengan "+kode negara" dan dipakai apa adanya.
export function normalisasiNomorWa(masukan: string): HasilNomorWa {
  const teks = masukan.trim();
  if (teks === "") return { ok: false, error: null };
  if (!KARAKTER_BOLEH.test(teks)) {
    return {
      ok: false,
      error: "Nomor hanya boleh berisi angka. Spasi, strip, dan tanda + di depan boleh.",
    };
  }

  let angka = teks.replace(/\D/g, "");
  let pakaiKodeNegara = teks.startsWith("+");

  // "0062 812…" = cara lain menulis "+62 812…".
  if (!pakaiKodeNegara && angka.startsWith("00")) {
    angka = angka.slice(2);
    pakaiKodeNegara = true;
  }

  if (pakaiKodeNegara) {
    if (angka.startsWith("0")) {
      return { ok: false, error: "Sesudah tanda +, tulis kode negara. Contoh: +62 812-3456-7890" };
    }
  } else if (angka.startsWith("0")) {
    angka = `62${angka.slice(1)}`; // 0812… → 62812…
  } else if (angka.startsWith("8")) {
    angka = `62${angka}`; // 812… (lupa angka 0) → 62812…
  }

  // "+62 0812…" sering ditulis begini; angka 0 sesudah 62 harus dibuang.
  if (angka.startsWith("620")) angka = `62${angka.slice(3)}`;

  if (angka.length < DIGIT_MIN) {
    return { ok: false, error: "Nomor terlalu pendek. Contoh: 0812-3456-7890" };
  }
  if (angka.length > DIGIT_MAKS) {
    return { ok: false, error: "Nomor terlalu panjang. Periksa lagi, mungkin ada angka yang dobel." };
  }
  return { ok: true, nomor: angka };
}

// Link resmi WhatsApp "klik untuk chat". Pesan dikodekan supaya spasi, baris baru, dan emoji aman.
export function buatLinkWa(nomor: string, pesan: string): string {
  const isi = pesan.trim();
  const dasar = `https://wa.me/${nomor}`;
  return isi === "" ? dasar : `${dasar}?text=${encodeURIComponent(isi)}`;
}

// Nomor + pesan → link siap jadi QR. Tetap lewat normalisasiUrl() yang sama dengan link biasa.
export function periksaWa(nomor: string, pesan: string): HasilWa {
  const hasilNomor = normalisasiNomorWa(nomor);
  if (!hasilNomor.ok) return { ok: false, kolom: "nomor", error: hasilNomor.error };

  const hasil = normalisasiUrl(buatLinkWa(hasilNomor.nomor, pesan));
  // Satu-satunya cara link wa.me gagal di sini: pesan berisi banyak emoji/simbol sehingga
  // setelah dikodekan melewati 1000 karakter.
  if (!hasil.ok) {
    return { ok: false, kolom: "pesan", error: "Pesan terlalu panjang untuk QR. Persingkat pesannya." };
  }

  return {
    ok: true,
    url: hasil.url,
    nomor: hasilNomor.nomor,
    peringatan: hasil.peringatan
      ? "Pesannya panjang, jadi QR-nya rapat dan lebih sulit di-scan. Persingkat kalau bisa."
      : null,
  };
}
