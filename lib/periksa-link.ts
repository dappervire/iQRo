import "server-only";

// Pemeriksaan link yang dipakai bersama oleh link pendek (lib/link.ts) dan halaman toko (lib/toko.ts).
// "server-only": kunci Safe Browsing tidak boleh ikut terkirim ke browser.

import { cekSafeBrowsing } from "./safe-browsing";

// Cek Google Safe Browsing. null = aman. Kalau pemeriksaan gagal, link TIDAK disimpan (lebih aman).
export async function periksaKeamanan(url: string): Promise<string | null> {
  const hasil = await cekSafeBrowsing(url);
  if (hasil === "berbahaya") {
    return "Link ini ditandai berbahaya oleh Google Safe Browsing (penipuan atau virus), jadi tidak bisa dipakai.";
  }
  if (hasil === "gagal") return "Keamanan link belum bisa diperiksa sekarang. Coba lagi sebentar lagi.";
  return null;
}
