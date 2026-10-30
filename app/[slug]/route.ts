import { notFound } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { formatSlugBenar } from "@/lib/slug";
import { buatKlienPublik } from "@/lib/supabase/publik";
import { normalisasiUrl } from "@/lib/validasi";

// Pengunjung (mis. yang scan QR) membuka /<slug> → dialihkan ke link tujuan.
// Halaman tetap seperti /masuk dan /pendek selalu didahulukan Next.js daripada [slug].

type LinkDitemukan = { tujuan: string; aktif: boolean };

// Hasil cari_link() dibaca sebagai unknown dan dicek satu per satu (jangan percaya bentuknya begitu saja).
function bacaLink(data: unknown): LinkDitemukan | null {
  const baris: unknown = Array.isArray(data) ? data[0] : null;
  if (typeof baris !== "object" || baris === null) return null;
  const { tujuan, aktif } = baris as Record<string, unknown>;
  if (typeof tujuan !== "string" || typeof aktif !== "boolean") return null;
  return { tujuan, aktif };
}

function alihkan(ke: string | URL): NextResponse {
  // 302 (bukan 301): browser tidak mengingat pengalihan ini selamanya,
  // jadi tujuan link bisa diganti kapan saja dan QR yang sudah dicetak ikut ke tujuan baru.
  const respons = NextResponse.redirect(ke, 302);
  respons.headers.set("Cache-Control", "no-store");
  return respons;
}

export async function GET(request: NextRequest, ctx: RouteContext<"/[slug]">) {
  const { slug } = await ctx.params;
  const bersih = slug.toLowerCase(); // /Menu-Kopi sama dengan /menu-kopi
  if (!formatSlugBenar(bersih)) notFound();

  const { data, error } = await buatKlienPublik().rpc("cari_link", { p_slug: bersih });
  if (error) {
    console.error("redirect cari_link:", error.code, error.message);
    return new Response("Sedang ada gangguan. Coba buka lagi sebentar lagi.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Retry-After": "30" },
    });
  }

  const link = bacaLink(data);
  if (!link) notFound();
  if (!link.aktif) return alihkan(new URL("/link-tidak-aktif", request.url));

  // Lapis kedua: hanya http/https yang boleh dituju, walau database sudah mengeceknya.
  const tujuan = normalisasiUrl(link.tujuan);
  if (!tujuan.ok) notFound();

  // M10: catat klik di sini lewat after(), supaya pengalihan tidak menunggu.
  return alihkan(tujuan.url);
}
