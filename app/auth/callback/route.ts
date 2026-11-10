import { NextResponse, type NextRequest } from "next/server";
import { buatKlienServer } from "@/lib/supabase/server";
import { jalurAman } from "@/lib/validasi-akun";

// Tujuan kembali setelah "Lanjutkan dengan Google": Google → Supabase → /auth/callback?code=...
// Kode ditukar jadi sesi login (cookie), lalu pengguna dialihkan ke ?lanjut= (bawaan /dasbor).
// Beda dengan /auth/confirm (link email): alamat ini tidak dibuka diam-diam oleh aplikasi email,
// jadi kodenya aman ditukar langsung tanpa tombol.
export async function GET(request: NextRequest) {
  const param = request.nextUrl.searchParams;
  const lanjut = jalurAman(param.get("lanjut"));
  const kode = param.get("code");

  if (kode && /^[\w-]{1,200}$/.test(kode)) {
    const supabase = await buatKlienServer();
    const { error } = await supabase.auth.exchangeCodeForSession(kode);
    if (!error) return alihkan(new URL(lanjut, request.url));
    console.error("auth/callback:", error.code, error.message);
  } else if (param.has("error")) {
    console.error("auth/callback:", param.get("error"));
  }

  // Gagal atau dibatalkan → kembali ke /masuk dengan pesan.
  const masuk = new URL("/masuk", request.url);
  masuk.searchParams.set("galat", param.get("error") === "access_denied" ? "google-batal" : "google");
  if (lanjut !== "/dasbor") masuk.searchParams.set("lanjut", lanjut);
  return alihkan(masuk);
}

function alihkan(tujuan: URL): NextResponse {
  const respons = NextResponse.redirect(tujuan, 303);
  // Respons ini membawa cookie login, jadi jangan pernah disimpan cache.
  respons.headers.set("Cache-Control", "no-store");
  return respons;
}
