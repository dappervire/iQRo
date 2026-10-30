import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { envSupabase } from "./env";

// Klien Supabase untuk Server Component, Server Action, dan Route Handler.
// Buat baru di setiap permintaan; jangan disimpan di variabel global.
export async function buatKlienServer() {
  const toko = await cookies();
  const { url, kunci } = envSupabase();

  return createServerClient(url, kunci, {
    cookies: {
      getAll() {
        return toko.getAll();
      },
      setAll(daftar) {
        try {
          daftar.forEach(({ name, value, options }) => toko.set(name, value, options));
        } catch {
          // Server Component tidak boleh menulis cookie. Aman diabaikan:
          // proxy.ts sudah menyegarkan sesi sebelum halaman dirender.
        }
      },
    },
  });
}
