"use server";

// Server Action halaman /laporkan. Siapa pun boleh melapor (tanpa akun), jadi semua input dicek ulang
// dan dibatasi 10 laporan per 24 jam per alamat IP (dihitung di database, kirim_laporan()).

import { DOMAIN_UTAMA, alamatSitus } from "./situs";
import { buatKlienAdmin } from "./supabase/admin";
import { sidikIp } from "./tamu";
import type { HasilLaporan, KolomLaporan } from "./types";
import { KETERANGAN_MAKS, LINK_MAKS, alasanBenar, sasaranDariMasukan } from "./validasi-laporan";

function ambilTeks(form: FormData, nama: string): string {
  const nilai = form.get(nama);
  return typeof nilai === "string" ? nilai : "";
}

function galat(pesan: string, kolom: KolomLaporan | null): HasilLaporan {
  return { status: "galat", pesan, kolom };
}

export async function kirimLaporan(_sebelum: HasilLaporan, form: FormData): Promise<HasilLaporan> {
  const link = ambilTeks(form, "link").slice(0, LINK_MAKS);
  const alasan = ambilTeks(form, "alasan");
  const keterangan = ambilTeks(form, "keterangan").trim();

  if (link.trim() === "") return galat("Isi link yang mau dilaporkan.", "link");
  const hostSitus = new URL(await alamatSitus()).host;
  const sasaran = sasaranDariMasukan(link, [DOMAIN_UTAMA, hostSitus]);
  if (!sasaran) {
    return galat(
      `Ini bukan link iQRo. Contoh yang benar: ${DOMAIN_UTAMA}/abc1234 atau ${DOMAIN_UTAMA}/toko/nama-toko`,
      "link",
    );
  }
  if (!alasanBenar(alasan)) return galat("Pilih alasannya dulu.", "alasan");
  if (keterangan.length > KETERANGAN_MAKS) {
    return galat(`Keterangan maksimal ${KETERANGAN_MAKS} karakter.`, "keterangan");
  }

  const isi = { p_alasan: alasan, p_keterangan: keterangan, p_ip_hash: await sidikIp() };
  const { error } =
    sasaran.jenis === "toko"
      ? await buatKlienAdmin().rpc("kirim_laporan_toko", { p_nama: sasaran.nama, ...isi })
      : await buatKlienAdmin().rpc("kirim_laporan", { p_slug: sasaran.slug, ...isi });
  if (error?.message.includes("tidak_ada")) {
    const apa = sasaran.jenis === "toko" ? "Halaman toko" : "Link pendek";
    return galat(`${apa} ini tidak ditemukan di iQRo. Cek lagi ejaannya.`, "link");
  }
  if (error?.message.includes("batas_laporan")) {
    return galat("Kamu sudah mengirim 10 laporan hari ini. Terima kasih! Coba lagi besok.", null);
  }
  if (error) {
    console.error("kirimLaporan:", error.code, error.message);
    return galat("Laporan belum terkirim karena ada gangguan. Coba lagi sebentar lagi.", null);
  }
  return { status: "terkirim" };
}
