import { createClient } from "@supabase/supabase-js";
import { envSupabase } from "./env";

// Klien tanpa login dan tanpa cookie, untuk pengunjung yang membuka link pendek (scan QR).
// Hanya bisa memanggil fungsi publik cari_link(); tabel links tertutup oleh RLS.
export function buatKlienPublik() {
  const { url, kunci } = envSupabase();
  return createClient(url, kunci, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
