import { notFound } from "next/navigation";
import { NextResponse, after, type NextRequest } from "next/server";
import { bacaKlik } from "@/lib/klik";
import { formatSlugBenar } from "@/lib/slug";
import { buatKlienPublik } from "@/lib/supabase/publik";
import type { DataKlik } from "@/lib/types";
import { normalisasiUrl } from "@/lib/validasi";

// Pengunjung (mis. yang scan QR) membuka /<slug> → dialihkan ke link tujuan.
// Halaman tetap seperti /masuk dan /pendek selalu didahulukan Next.js daripada [slug].

type LinkDitemukan = { id: string; tujuan: string; aktif: boolean };

// Hasil cari_link() dibaca sebagai unknown dan dicek satu per satu (jangan percaya bentuknya begitu saja).
function bacaLink(data: unknown): LinkDitemukan | null {
  const baris: unknown = Array.isArray(data) ? data[0] : null;
  if (typeof baris !== "object" || baris === null) return null;
  const { id, tujuan, aktif } = baris as Record<string, unknown>;
  if (typeof id !== "string" || typeof tujuan !== "string" || typeof aktif !== "boolean") return null;
  return { id, tujuan, aktif };
}

// Berjalan SETELAH pengunjung dialihkan, jadi lambat atau gagal di sini tidak terasa olehnya.
async function catatKlik(linkId: string, klik: DataKlik): Promise<void> {
  const { error } = await buatKlienPublik().rpc("catat_klik", {
    p_link_id: linkId,
    p_perujuk: klik.perujukDomain,
    p_perangkat: klik.perangkat,
    p_negara: klik.negara,
  });
  if (error) console.error("catat_klik:", error.code, error.message);
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

  // Header dibaca sekarang; penyimpanannya dijadwalkan lewat after() supaya pengalihan tidak menunggu.
  // Bot & pratinjau link (mis. WhatsApp) → klik null → tidak dicatat.
  const klik = bacaKlik(request.headers, request.method);
  if (klik) {
    const linkId = link.id;
    after(() => catatKlik(linkId, klik));
  }
  return alihkan(tujuan.url);
}
