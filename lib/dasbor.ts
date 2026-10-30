// Logika murni untuk halaman dasbor: kata pencarian, nomor halaman, alamat, tanggal.

export const LINK_PER_HALAMAN = 20;
export const CARI_MAKS = 100;

// Kata pencarian dimasukkan ke filter database (app/dasbor/page.tsx), jadi tanda yang punya
// arti khusus di filter dibuang: % _ * (pola), " \ , ( ) (susunan filter).
export function rapikanCari(masukan: string | undefined): string {
  return (masukan ?? "")
    .replace(/[%_*"\\,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, CARI_MAKS);
}

// "?hal=" dari alamat halaman. Apa pun yang bukan angka 1 ke atas dianggap halaman 1.
export function nomorHalaman(masukan: string | undefined): number {
  const angka = Number(masukan);
  return Number.isInteger(angka) && angka >= 1 && angka <= 10000 ? angka : 1;
}

// Alamat dasbor dengan pencarian & halaman, mis. "/dasbor?q=kopi&hal=2". Halaman 1 tidak ditulis.
export function alamatDasbor(cari: string, hal: number): string {
  const param = new URLSearchParams();
  if (cari) param.set("q", cari);
  if (hal > 1) param.set("hal", String(hal));
  const teks = param.toString();
  return teks ? `/dasbor?${teks}` : "/dasbor";
}

// Link bisa dibuka kalau tidak dinonaktifkan dan belum kedaluwarsa (null = tidak pernah kedaluwarsa).
export function linkAktif(dinonaktifkan: boolean, kedaluwarsa: string | null): boolean {
  return !dinonaktifkan && (kedaluwarsa === null || Date.parse(kedaluwarsa) > Date.now());
}

const FORMAT_TANGGAL =new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

// "2026-10-30T03:00:00Z" → "30 Okt 2026" (waktu Indonesia barat).
export function formatTanggal(iso: string): string {
  return FORMAT_TANGGAL.format(new Date(iso));
}
