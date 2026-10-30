// Alamat project + kunci publik Supabase dari .env.local (dan env Vercel).
// Kunci "publishable" memang boleh terlihat di browser; keamanan data dijaga Row Level Security.
export function envSupabase(): { url: string; kunci: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const kunci = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !kunci) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum diisi (cek .env.local atau env Vercel).",
    );
  }
  return { url, kunci };
}
