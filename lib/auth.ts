import { buatKlienServer } from "./supabase/server";
import type { Pengguna } from "./types";

// Satu-satunya cara mengecek login di server. getClaims() memverifikasi tanda tangan token;
// getSession() TIDAK (isinya bisa dipalsukan lewat cookie), jadi jangan dipakai untuk otorisasi.
export async function ambilPengguna(): Promise<Pengguna | null> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) return null;
  return { id: data.claims.sub, email: data.claims.email ?? "" };
}
