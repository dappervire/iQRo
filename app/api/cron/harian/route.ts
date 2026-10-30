import { NextResponse, type NextRequest } from "next/server";
import { buatKlienAdmin } from "@/lib/supabase/admin";

// Dijalankan Vercel Cron sekali sehari (jadwal di vercel.json, hanya di deploy produksi):
// hapus catatan tamu & sidik IP pelapor yang lebih dari 24 jam, sekaligus "menyapa" Supabase
// supaya project gratisnya tidak di-pause karena sepi.
// Vercel mengirim header "Authorization: Bearer <CRON_SECRET>"; tanpa itu, permintaan ditolak.

export async function GET(request: NextRequest) {
  const rahasia = process.env.CRON_SECRET;
  if (!rahasia) {
    console.error("cron harian: CRON_SECRET belum diisi (cek .env.local atau env Vercel).");
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${rahasia}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { data, error } = await buatKlienAdmin().rpc("bersihkan_harian");
  if (error) {
    console.error("cron harian:", error.code, error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true, hasil: data });
}
