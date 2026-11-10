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

// Yang dilaporkan: link pendek (slug) atau halaman toko (nama di /toko/<nama>).
export type SasaranLaporan = { jenis: "link"; slug: string } | { jenis: "toko"; nama: string };

// Baca yang diketik pelapor: "abc1234", "/abc1234", "iqro-alpha.vercel.app/abc1234",
// "https://iqro-alpha.vercel.app/abc1234?x=1", "toko/kopi-senja", atau
// "iqro-alpha.vercel.app/toko/kopi-senja". null = bukan link iQRo.
// hostIqro = domain iQRo yang diterima, mis. ["iqro-alpha.vercel.app", "localhost:3000"].
export function sasaranDariMasukan(masukan: string, hostIqro: string[]): SasaranLaporan | null {
  const teks = masukan.trim().replace(/^\/+/, "");
  if (teks === "") return null;

  let bagian = [teks];
  if (/^toko\//i.test(teks)) {
    bagian = teks.split(/[/?#]/);
  } else if (teks.includes("/")) {
    try {
      const url = new URL(/^https?:\/\//i.test(teks) ? teks : `https://${teks}`);
      if (!hostIqro.includes(url.host.toLowerCase())) return null;
      bagian = url.pathname.split("/").slice(1);
    } catch {
      return null;
    }
  }

  if (rapikanSlug(bagian[0] ?? "") === "toko") {
    const nama = rapikanSlug(bagian[1] ?? "");
    return formatSlugBenar(nama) ? { jenis: "toko", nama } : null;
  }
  const slug = rapikanSlug(bagian[0] ?? "");
  return formatSlugBenar(slug) ? { jenis: "link", slug } : null;
}
