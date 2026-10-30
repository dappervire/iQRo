"use server";

// Server Action link pendek. Semua input divalidasi ulang di sini, karena data dari browser bisa diubah.
// Pemilik link TIDAK dikirim dari browser: database mengisinya dari login (auth.uid()) dan RLS mengeceknya.

import { ambilPengguna } from "./auth";
import { DOMAIN_UTAMA, alamatSitus } from "./situs";
import { rapikanSlug, slugOtomatis, validasiSlug } from "./slug";
import { buatKlienServer } from "./supabase/server";
import type { HasilLinkPendek, KolomLink } from "./types";
import { normalisasiUrl } from "./validasi";

const COBA_SLUG_OTOMATIS = 5;
const KODE_SUDAH_ADA = "23505"; // kode Postgres: nilai unik sudah ada (slug terpakai)

function ambilTeks(form: FormData, nama: string): string {
  const nilai = form.get(nama);
  return typeof nilai === "string" ? nilai : "";
}

function galat(pesan: string, kolom: KolomLink | null): HasilLinkPendek {
  return { status: "galat", pesan, kolom };
}

function linkIqro(hostname: string, hostSitus: string): boolean {
  return (
    hostname === hostSitus || hostname === DOMAIN_UTAMA || hostname.endsWith(`.${DOMAIN_UTAMA}`)
  );
}

export async function buatLinkPendek(
  _sebelum: HasilLinkPendek,
  form: FormData,
): Promise<HasilLinkPendek> {
  const pengguna = await ambilPengguna();
  if (!pengguna) return galat("Sesi masukmu sudah habis. Masuk lagi, lalu coba sekali lagi.", null);

  const hasilUrl = normalisasiUrl(ambilTeks(form, "tujuan"));
  if (!hasilUrl.ok) return galat(hasilUrl.error ?? "Isi link tujuan dulu.", "tujuan");

  const situs = new URL(await alamatSitus());
  if (linkIqro(new URL(hasilUrl.url).hostname, situs.hostname)) {
    return galat("Ini sudah link iQRo. Masukkan link tujuan aslinya.", "tujuan");
  }

  const slugPilihan = rapikanSlug(ambilTeks(form, "slug"));
  if (slugPilihan !== "") {
    const galatSlug = validasiSlug(slugPilihan);
    if (galatSlug) return galat(galatSlug, "slug");
  }

  const supabase = await buatKlienServer();
  const jumlahCoba = slugPilihan ? 1 : COBA_SLUG_OTOMATIS;

  for (let i = 0; i < jumlahCoba; i++) {
    const slug = slugPilihan || slugOtomatis();
    if (!slugPilihan && validasiSlug(slug)) continue; // acak kebetulan jadi kata terlarang

    const { error } = await supabase.from("links").insert({ slug, tujuan: hasilUrl.url });
    if (!error) {
      return { status: "berhasil", slug, pendek: `${situs.origin}/${slug}`, tujuan: hasilUrl.url };
    }

    if (error.code === KODE_SUDAH_ADA) {
      if (slugPilihan) return galat(`Nama "${slug}" sudah dipakai. Coba nama lain.`, "slug");
      continue; // slug acak bentrok, coba acak lagi
    }
    if (error.message.includes("batas_harian")) {
      return galat("Kamu sudah membuat 50 link dalam 24 jam terakhir. Coba lagi besok.", null);
    }
    console.error("buatLinkPendek:", error.code, error.message);
    return galat("Link belum bisa dibuat karena ada gangguan. Coba lagi sebentar lagi.", null);
  }

  return galat("Link belum bisa dibuat. Coba tekan tombolnya sekali lagi.", null);
}
