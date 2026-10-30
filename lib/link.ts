"use server";

// Server Action link pendek. Semua input divalidasi ulang di sini, karena data dari browser bisa diubah.
// Pemilik link TIDAK dikirim dari browser: database mengisinya dari login (auth.uid()) dan RLS mengeceknya.

import { refresh } from "next/cache";
import { ambilPengguna } from "./auth";
import { formatIdBenar } from "./dasbor";
import { DOMAIN_UTAMA, alamatSitus } from "./situs";
import { rapikanSlug, slugOtomatis, validasiSlug } from "./slug";
import { buatKlienServer } from "./supabase/server";
import type { HasilLinkPendek, HasilUbahLink, KolomLink } from "./types";
import { normalisasiUrl } from "./validasi";

const COBA_SLUG_OTOMATIS = 5;
const KODE_SUDAH_ADA = "23505"; // kode Postgres: nilai unik sudah ada (slug terpakai)

const PESAN_SESI_HABIS = "Sesi masukmu sudah habis. Masuk lagi, lalu coba sekali lagi.";
const PESAN_TIDAK_ADA = "Link ini tidak ditemukan. Mungkin sudah dihapus; muat ulang halaman ini.";

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

// Aturan link tujuan, sama untuk membuat dan mengubah link.
async function periksaTujuan(
  masukan: string,
): Promise<{ ok: true; url: string; asal: string } | { ok: false; pesan: string }> {
  const hasilUrl = normalisasiUrl(masukan);
  if (!hasilUrl.ok) return { ok: false, pesan: hasilUrl.error ?? "Isi link tujuan dulu." };

  const situs = new URL(await alamatSitus());
  if (linkIqro(new URL(hasilUrl.url).hostname, situs.hostname)) {
    return { ok: false, pesan: "Ini sudah link iQRo. Masukkan link tujuan aslinya." };
  }
  return { ok: true, url: hasilUrl.url, asal: situs.origin };
}

// id link dari form, hanya kalau bentuknya benar-benar uuid.
function ambilId(form: FormData): string | null {
  const id = ambilTeks(form, "id");
  return formatIdBenar(id) ? id : null;
}

export async function buatLinkPendek(
  _sebelum: HasilLinkPendek,
  form: FormData,
): Promise<HasilLinkPendek> {
  const pengguna = await ambilPengguna();
  if (!pengguna) return galat(PESAN_SESI_HABIS, null);

  const tujuan = await periksaTujuan(ambilTeks(form, "tujuan"));
  if (!tujuan.ok) return galat(tujuan.pesan, "tujuan");

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

    const { error } = await supabase.from("links").insert({ slug, tujuan: tujuan.url });
    if (!error) {
      return { status: "berhasil", slug, pendek: `${tujuan.asal}/${slug}`, tujuan: tujuan.url };
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

// Dasbor: ganti link tujuan. Slug tetap, jadi QR yang sudah dicetak langsung menuju tujuan baru.
export async function ubahTujuan(_sebelum: HasilUbahLink, form: FormData): Promise<HasilUbahLink> {
  const pengguna = await ambilPengguna();
  if (!pengguna) return { status: "galat", pesan: PESAN_SESI_HABIS };

  const id = ambilId(form);
  if (!id) return { status: "galat", pesan: PESAN_TIDAK_ADA };

  const tujuan = await periksaTujuan(ambilTeks(form, "tujuan"));
  if (!tujuan.ok) return { status: "galat", pesan: tujuan.pesan };

  const supabase = await buatKlienServer();
  // Filter pemilik_id di sini + RLS di database: link orang lain tidak akan pernah cocok.
  const { data, error } = await supabase
    .from("links")
    .update({ tujuan: tujuan.url })
    .eq("id", id)
    .eq("pemilik_id", pengguna.id)
    .select("id");

  if (error) {
    console.error("ubahTujuan:", error.code, error.message);
    return { status: "galat", pesan: "Link belum bisa diubah karena ada gangguan. Coba lagi." };
  }
  if (data.length === 0) return { status: "galat", pesan: PESAN_TIDAK_ADA };

  refresh(); // muat ulang daftar di dasbor supaya tujuan baru langsung tampil
  return { status: "berhasil" };
}

// Dasbor: hapus link. QR yang memakai link ini akan menampilkan "tidak ditemukan".
export async function hapusLink(_sebelum: HasilUbahLink, form: FormData): Promise<HasilUbahLink> {
  const pengguna = await ambilPengguna();
  if (!pengguna) return { status: "galat", pesan: PESAN_SESI_HABIS };

  const id = ambilId(form);
  if (!id) return { status: "galat", pesan: PESAN_TIDAK_ADA };

  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("links")
    .delete()
    .eq("id", id)
    .eq("pemilik_id", pengguna.id)
    .select("id");

  if (error) {
    console.error("hapusLink:", error.code, error.message);
    return { status: "galat", pesan: "Link belum bisa dihapus karena ada gangguan. Coba lagi." };
  }
  if (data.length === 0) return { status: "galat", pesan: PESAN_TIDAK_ADA };

  refresh();
  return { status: "berhasil" };
}
