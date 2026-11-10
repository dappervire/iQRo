import "server-only";

// Membaca halaman toko dari database (halaman publik /toko/[nama] dan dasbor).
// Menulis (simpan/hapus) ada di lib/toko.ts.

import { cache } from "react";
import { formatSlugBenar, rapikanSlug } from "./slug";
import { buatKlienPublik } from "./supabase/publik";
import { buatKlienServer } from "./supabase/server";
import type { IsiToko, TokoSaya } from "./types";
import { bacaTombol, warnaBenar, WARNA_TOKO_AWAL } from "./validasi-toko";
import { normalisasiUrl } from "./validasi";
import { buatLinkWa } from "./whatsapp";

export type HasilCariToko =
  | { status: "tidak-ada" }
  | { status: "gangguan" }
  | { status: "nonaktif" }
  | { status: "aktif"; id: string; isi: IsiToko };

function teks(nilai: unknown): string {
  return typeof nilai === "string" ? nilai : "";
}

// Link wa.me dari nomor tersimpan (hanya angka). Tetap dicek ulang: hanya http/https.
function linkWa(nomor: unknown, pesan: unknown): string | null {
  const angka = teks(nomor);
  if (!/^[1-9][0-9]{9,14}$/.test(angka)) return null;
  const hasil = normalisasiUrl(buatLinkWa(angka, teks(pesan)));
  return hasil.ok ? hasil.url : null;
}

// cache(): generateMetadata dan isi halaman memanggil ini dengan nama yang sama dalam satu
// permintaan; database cukup ditanya sekali.
export const cariToko = cache(async (masukan: string): Promise<HasilCariToko> => {
  const nama = rapikanSlug(masukan);
  if (!formatSlugBenar(nama)) return { status: "tidak-ada" };

  const { data, error } = await buatKlienPublik().rpc("cari_toko", { p_nama: nama });
  if (error) {
    console.error("cari_toko:", error.code, error.message);
    return { status: "gangguan" };
  }

  const baris: unknown = Array.isArray(data) ? data[0] : null;
  if (typeof baris !== "object" || baris === null) return { status: "tidak-ada" };
  const b = baris as Record<string, unknown>;
  if (typeof b.id !== "string" || typeof b.aktif !== "boolean") return { status: "tidak-ada" };
  if (!b.aktif) return { status: "nonaktif" };

  const warna = teks(b.warna);
  return {
    status: "aktif",
    id: b.id,
    isi: {
      nama: teks(b.nama),
      deskripsi: teks(b.deskripsi),
      warna: warnaBenar(warna) ? warna : WARNA_TOKO_AWAL,
      waUrl: linkWa(b.wa_nomor, b.wa_pesan),
      tombol: bacaTombol(b.tombol),
    },
  };
});

// Toko milik user yang sedang masuk. RLS hanya mengizinkan membaca milik sendiri;
// filter pemilik_id = lapis kedua. toko null = belum punya.
export async function bacaTokoSaya(
  penggunaId: string,
): Promise<{ ok: true; toko: TokoSaya | null } | { ok: false }> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("toko")
    .select(
      "id, nama_url, nama, deskripsi, warna, wa_nomor, wa_pesan, tombol, jumlah_kunjungan, dinonaktifkan, alasan",
    )
    .eq("pemilik_id", penggunaId)
    .maybeSingle();
  if (error) {
    console.error("bacaTokoSaya:", error.code, error.message);
    return { ok: false };
  }
  if (!data) return { ok: true, toko: null };

  const nomor = teks(data.wa_nomor);
  return {
    ok: true,
    toko: {
      id: data.id,
      namaUrl: data.nama_url,
      isian: {
        namaUrl: data.nama_url,
        nama: teks(data.nama),
        deskripsi: teks(data.deskripsi),
        warna: warnaBenar(teks(data.warna)) ? data.warna : WARNA_TOKO_AWAL,
        // Disimpan tanpa "+", ditampilkan dengan "+" supaya jelas itu kode negara.
        waNomor: nomor ? `+${nomor}` : "",
        waPesan: teks(data.wa_pesan),
        tombol: bacaTombol(data.tombol),
      },
      jumlahKunjungan: Number(data.jumlah_kunjungan) || 0,
      aktif: !data.dinonaktifkan,
      alasan: data.alasan ? teks(data.alasan) : null,
    },
  };
}

// Dipanggil lewat after() SETELAH halaman toko terkirim ke pengunjung.
export async function catatKunjungan(tokoId: string): Promise<void> {
  const { error } = await buatKlienPublik().rpc("catat_kunjungan_toko", { p_id: tokoId });
  if (error) console.error("catat_kunjungan_toko:", error.code, error.message);
}
