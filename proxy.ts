import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { envSupabase } from "@/lib/supabase/env";

// Jalan sebelum halaman dirender: menyegarkan sesi login Supabase (token di cookie)
// dan mengalihkan halaman yang wajib login. Ini hanya lapis pertama; halaman dan
// Server Action tetap mengecek login sendiri lewat ambilPengguna().

const WAJIB_MASUK = ["/dasbor"];
const KHUSUS_TAMU = ["/masuk", "/daftar"];

function cocok(jalur: string, daftar: string[]): boolean {
  return daftar.some((awalan) => jalur === awalan || jalur.startsWith(`${awalan}/`));
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  let sudahMasuk = false;

  // Pengunjung tanpa cookie Supabase (mis. orang yang scan QR) tidak perlu dicek ke Supabase.
  const adaCookieSesi = request.cookies.getAll().some(({ name }) => name.startsWith("sb-"));
  if (adaCookieSesi) {
    const { url, kunci } = envSupabase();
    const supabase = createServerClient(url, kunci, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(daftar, headerTambahan) {
          daftar.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          daftar.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          // Header anti-cache, supaya cookie sesi satu orang tidak tersimpan di CDN.
          Object.entries(headerTambahan).forEach(([nama, nilai]) => response.headers.set(nama, nilai));
        },
      },
    });
    const { data } = await supabase.auth.getClaims();
    sudahMasuk = Boolean(data?.claims);
  }

  const { pathname } = request.nextUrl;
  let tujuan: URL | null = null;
  if (!sudahMasuk && cocok(pathname, WAJIB_MASUK)) {
    tujuan = new URL("/masuk", request.url);
    tujuan.searchParams.set("lanjut", pathname);
  } else if (sudahMasuk && cocok(pathname, KHUSUS_TAMU)) {
    tujuan = new URL("/dasbor", request.url);
  }
  if (!tujuan) return response;

  // Cookie yang baru disegarkan harus ikut dibawa ke respons pengalihan.
  const alih = NextResponse.redirect(tujuan);
  response.cookies.getAll().forEach((cookie) => alih.cookies.set(cookie));
  response.headers.forEach((nilai, nama) => {
    if (["cache-control", "expires", "pragma"].includes(nama)) alih.headers.set(nama, nilai);
  });
  return alih;
}

export const config = {
  // Semua halaman, kecuali file statis (JS/CSS Next.js, gambar, ikon, public/tema.js).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|txt)$).*)",
  ],
};
