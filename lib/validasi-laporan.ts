// Aturan form /laporkan (logika murni, dipakai form di browser dan Server Action di lib/laporan.ts).

import { formatSlugBenar, rapikanSlug } from "./slug";
import type { AlasanLaporan } from "./types";

export const KETERANGAN_MAKS = 500;
export const LINK_MAKS = 2000;

// Sama dengan pilihan di tabel reports (supabase/schema.sql).
export const ALASAN_LAPORAN: { id: AlasanLaporan; label: string }[] = [
  { id: "penipuan", label: "Penipuan atau phishing (meminta data, kata sandi, atau uang)" },
  { id: "malware", label: "Virus atau aplikasi berbahaya" },
  { id: "spam", label: "Spam" },
  { id: "lainnya", label: "Lainnya" },
];

export function alasanBenar(nilai: string): nilai is AlasanLaporan {
  return ALASAN_LAPORAN.some((a) => a.id === nilai);
}

// Ambil slug dari yang diketik pelapor: "abc1234", "/abc1234", "iqro-alpha.vercel.app/abc1234",
// atau link lengkap "https://iqro-alpha.vercel.app/abc1234?x=1". null = bukan link pendek iQRo.
// hostIqro = domain iQRo yang diterima, mis. ["iqro-alpha.vercel.app", "localhost:3000"].
export function slugDariMasukan(masukan: string, hostIqro: string[]): string | null {
  const teks = masukan.trim().replace(/^\/+/, "");
  if (teks === "") return null;

  let slug = teks;
  if (teks.includes("/")) {
    try {
      const url = new URL(/^https?:\/\//i.test(teks) ? teks : `https://${teks}`);
      if (!hostIqro.includes(url.host.toLowerCase())) return null;
      slug = url.pathname.split("/")[1] ?? "";
    } catch {
      return null;
    }
  }
  slug = rapikanSlug(slug);
  return formatSlugBenar(slug) ? slug : null;
}
