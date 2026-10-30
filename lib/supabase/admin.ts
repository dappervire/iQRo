import "server-only";
import { createClient } from "@supabase/supabase-js";
import { envSupabase } from "./env";

// Klien dengan kunci SECRET: melewati RLS, jadi HANYA dipakai di server untuk hal yang memang
// tidak bisa dilakukan user sendiri (link tamu, simpan/ubah link setelah cek Safe Browsing,
// laporan, cron). Setiap pemakaian wajib membatasi datanya sendiri (mis. .eq("pemilik_id", ...)).
// "server-only": build langsung gagal kalau file ini tidak sengaja dipakai komponen browser.
export function buatKlienAdmin() {
  const { url } = envSupabase();
  const kunci = process.env.SUPABASE_SECRET_KEY;
  if (!kunci) {
    throw new Error("SUPABASE_SECRET_KEY belum diisi (cek .env.local atau env Vercel).");
  }
  return createClient(url, kunci, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
