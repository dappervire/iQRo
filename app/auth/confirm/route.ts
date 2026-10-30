import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { buatKlienServer } from "@/lib/supabase/server";

// Tujuan link di email Supabase:
//   daftar      → /auth/confirm?token_hash=...&type=email     → /dasbor
//   lupa sandi  → /auth/confirm?token_hash=...&type=recovery  → /sandi-baru
// (format link diatur di Supabase → Authentication → Email Templates)
const JENIS_DITERIMA: EmailOtpType[] = ["email", "signup", "recovery"];

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const jenisMentah = request.nextUrl.searchParams.get("type");
  const jenis = JENIS_DITERIMA.find((j) => j === jenisMentah);

  if (tokenHash && jenis) {
    const supabase = await buatKlienServer();
    const { error } = await supabase.auth.verifyOtp({ type: jenis, token_hash: tokenHash });
    if (!error) redirect(jenis === "recovery" ? "/sandi-baru" : "/dasbor");
  }

  redirect("/masuk?galat=link");
}
