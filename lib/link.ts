"use server";

// Server Action link pendek. Semua input divalidasi ulang di sini, karena data dari browser bisa diubah.
// Pemilik link TIDAK pernah dikirim dari browser: selalu diambil dari login yang dicek server (getClaims).
// Membuat & mengubah link memakai klien admin (M11): user tidak punya hak menulis langsung ke tabel
// links, jadi cek Safe Browsing di sini tidak bisa dilewati lewat Data API.

import { refresh } from "next/cache";
import { ambilPengguna } from "./auth";
import { formatIdBenar, formatTanggal } from "./dasbor";
import { tokenBenar } from "./klaim";
import { cekSafeBrowsing } from "./safe-browsing";
import { DOMAIN_UTAMA, alamatSitus } from "./situs";
import { rapikanSlug, slugOtomatis, validasiSlug } from "./slug";
import { buatKlienAdmin } from "./supabase/admin";
import { buatKlienServer } from "./supabase/server";
import { buatKodeKlaim, sidikIp } from "./tamu";
import type { HasilKlaim, HasilLinkPendek, HasilUbahLink, KolomLink, Pengguna } from "./types";
import { normalisasiUrl } from "./validasi";

const COBA_SLUG_OTOMATIS = 5;
const KODE_SUDAH_ADA = "23505"; // kode Postgres: nilai unik sudah ada (slug terpakai)
const BATAS_TAMU = 5; // sama dengan buat_link_tamu() di schema.sql
const KLAIM_MAKS = 50;

const PESAN_SESI_HABIS = "Sesi masukmu sudah habis. Masuk lagi, lalu coba sekali lagi.";
const PESAN_TIDAK_ADA = "Link ini tidak ditemukan. Mungkin sudah dihapus; muat ulang halaman ini.";
const PESAN_GANGGUAN = "Link belum bisa dibuat karena ada gangguan. Coba lagi sebentar lagi.";
const PESAN_BATAS_TAMU =
  "Tanpa akun, kamu bisa membuat 5 link per hari, dan jatahmu hari ini sudah habis. Masuk atau daftar (gratis) untuk membuat sampai 50 link per hari.";

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

// Cek Google Safe Browsing. null = aman. Kalau pemeriksaan gagal, link TIDAK dibuat (lebih aman).
async function periksaKeamanan(url: string): Promise<string | null> {
  const hasil = await cekSafeBrowsing(url);
  if (hasil === "berbahaya") {
    return "Link ini ditandai berbahaya oleh Google Safe Browsing (penipuan atau virus), jadi tidak bisa dipakai.";
  }
  if (hasil === "gagal") return "Keamanan link belum bisa diperiksa sekarang. Coba lagi sebentar lagi.";
  return null;
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
  const tujuan = await periksaTujuan(ambilTeks(form, "tujuan"));
  if (!tujuan.ok) return galat(tujuan.pesan, "tujuan");

  const slugPilihan = rapikanSlug(ambilTeks(form, "slug"));
  const pengguna = await ambilPengguna();
  if (!pengguna) {
    // Form tamu tidak punya kolom nama link; kalau tetap terkirim (form diubah), tolak.
    if (slugPilihan !== "") {
      return galat("Nama link sendiri hanya untuk yang sudah masuk. Kosongkan kolom ini.", "slug");
    }
    return buatLinkTamu(tujuan.url, tujuan.asal);
  }

  if (slugPilihan !== "") {
    const galatSlug = validasiSlug(slugPilihan);
    if (galatSlug) return galat(galatSlug, "slug");
  }
  return buatLinkUser(pengguna, tujuan.url, tujuan.asal, slugPilihan);
}

async function buatLinkUser(
  pengguna: Pengguna,
  tujuan: string,
  asal: string,
  slugPilihan: string,
): Promise<HasilLinkPendek> {
  const galatAman = await periksaKeamanan(tujuan);
  if (galatAman) return galat(galatAman, "tujuan");

  const supabase = buatKlienAdmin();
  const jumlahCoba = slugPilihan ? 1 : COBA_SLUG_OTOMATIS;

  for (let i = 0; i < jumlahCoba; i++) {
    const slug = slugPilihan || slugOtomatis();
    if (!slugPilihan && validasiSlug(slug)) continue; // acak kebetulan jadi kata terlarang

    // pemilik_id dari login yang sudah dicek server, bukan dari form.
    const { error } = await supabase
      .from("links")
      .insert({ slug, tujuan, pemilik_id: pengguna.id });
    if (!error) {
      return { status: "berhasil", slug, pendek: `${asal}/${slug}`, tujuan, tamu: null };
    }

    if (error.code === KODE_SUDAH_ADA) {
      if (slugPilihan) return galat(`Nama "${slug}" sudah dipakai. Coba nama lain.`, "slug");
      continue; // slug acak bentrok, coba acak lagi
    }
    if (error.message.includes("batas_harian")) {
      return galat("Kamu sudah membuat 50 link dalam 24 jam terakhir. Coba lagi besok.", null);
    }
    console.error("buatLinkUser:", error.code, error.message);
    return galat(PESAN_GANGGUAN, null);
  }

  return galat("Link belum bisa dibuat. Coba tekan tombolnya sekali lagi.", null);
}

// Tamu: slug selalu acak, berlaku 30 hari, maksimal 5 per 24 jam per alamat IP.
async function buatLinkTamu(tujuan: string, asal: string): Promise<HasilLinkPendek> {
  const supabase = buatKlienAdmin();
  const ip = await sidikIp();

  // Cek jatah dulu, supaya tamu yang sudah habis jatahnya tidak memakai kuota Safe Browsing.
  // (Cek yang menentukan tetap di database, di dalam buat_link_tamu().)
  const { count, error: galatHitung } = await supabase
    .from("guest_creations")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ip)
    .gt("waktu", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  if (galatHitung) {
    console.error("buatLinkTamu hitung:", galatHitung.code, galatHitung.message);
    return galat(PESAN_GANGGUAN, null);
  }
  if ((count ?? 0) >= BATAS_TAMU) return galat(PESAN_BATAS_TAMU, null);

  const galatAman = await periksaKeamanan(tujuan);
  if (galatAman) return galat(galatAman, "tujuan");

  for (let i = 0; i < COBA_SLUG_OTOMATIS; i++) {
    const slug = slugOtomatis();
    if (validasiSlug(slug)) continue;

    const klaim = buatKodeKlaim();
    const { data, error } = await supabase.rpc("buat_link_tamu", {
      p_slug: slug,
      p_tujuan: tujuan,
      p_klaim_hash: klaim.hash,
      p_ip_hash: ip,
    });
    if (!error && typeof data === "string") {
      return {
        status: "berhasil",
        slug,
        pendek: `${asal}/${slug}`,
        tujuan,
        tamu: { token: klaim.token, kedaluwarsa: data, berlakuSampaiTeks: formatTanggal(data) },
      };
    }

    if (error?.code === KODE_SUDAH_ADA) continue;
    if (error?.message.includes("batas_tamu")) return galat(PESAN_BATAS_TAMU, null);
    console.error("buatLinkTamu:", error?.code, error?.message ?? "hasil bukan tanggal");
    return galat(PESAN_GANGGUAN, null);
  }

  return galat("Link belum bisa dibuat. Coba tekan tombolnya sekali lagi.", null);
}

// Setelah masuk: pindahkan link tamu yang dibuat di browser ini ke akun.
// "daftarToken" datang dari penyimpanan browser, jadi dicek bentuknya dulu (unknown, bukan string[]).
export async function klaimLinkTamu(daftarToken: unknown): Promise<HasilKlaim> {
  const pengguna = await ambilPengguna();
  if (!pengguna) return { status: "galat", pesan: PESAN_SESI_HABIS };

  if (
    !Array.isArray(daftarToken) ||
    daftarToken.length === 0 ||
    daftarToken.length > KLAIM_MAKS ||
    !daftarToken.every(tokenBenar)
  ) {
    return { status: "galat", pesan: "Data link di browser ini rusak, jadi tidak bisa dipindah." };
  }

  // Klien user (bukan admin): fungsi klaim_link_tamu() memakai auth.uid() sebagai pemilik baru.
  const supabase = await buatKlienServer();
  const { data, error } = await supabase.rpc("klaim_link_tamu", { p_token: daftarToken });
  if (error) {
    console.error("klaimLinkTamu:", error.code, error.message);
    return { status: "galat", pesan: "Link belum bisa dipindah karena ada gangguan. Coba lagi." };
  }

  refresh(); // daftar di dasbor langsung menampilkan link yang baru dipindah
  return { status: "berhasil", jumlah: Array.isArray(data) ? data.length : 0 };
}

// Dasbor: ganti link tujuan. Slug tetap, jadi QR yang sudah dicetak langsung menuju tujuan baru.
export async function ubahTujuan(_sebelum: HasilUbahLink, form: FormData): Promise<HasilUbahLink> {
  const pengguna = await ambilPengguna();
  if (!pengguna) return { status: "galat", pesan: PESAN_SESI_HABIS };

  const id = ambilId(form);
  if (!id) return { status: "galat", pesan: PESAN_TIDAK_ADA };

  const tujuan = await periksaTujuan(ambilTeks(form, "tujuan"));
  if (!tujuan.ok) return { status: "galat", pesan: tujuan.pesan };
  const galatAman = await periksaKeamanan(tujuan.url);
  if (galatAman) return { status: "galat", pesan: galatAman };

  // Klien admin melewati RLS, jadi filter pemilik_id (dari login, bukan dari form) WAJIB ada:
  // link orang lain tidak akan pernah cocok.
  const supabase = buatKlienAdmin();
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
