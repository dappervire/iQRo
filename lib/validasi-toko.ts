// Aturan halaman toko (logika murni). Dipakai form di browser (preview) dan Server Action lib/toko.ts.
// Database punya cek yang sama (supabase/schema.sql, tabel toko), jadi keduanya harus sejalan.

import { rapikanSlug, validasiSlug } from "./slug";
import type { IsiToko, IsianToko, KolomToko, TombolToko } from "./types";
import { normalisasiUrl } from "./validasi";
import { PANJANG_PESAN_WA_MAKS, periksaWa } from "./whatsapp";

export const NAMA_TOKO_MAKS = 40;
export const DESKRIPSI_MAKS = 160;
export const LABEL_MAKS = 40;
export const LINK_TOMBOL_MAKS = 500;
export const TOMBOL_MAKS = 8;
export const WARNA_TOKO_AWAL = "#E8481C";

const POLA_WARNA = /^#[0-9a-f]{6}$/i;

// Data yang sudah lolos semua aturan, siap disimpan. Nomor WA = hanya angka, mis. "6281234567890".
export type DataToko = {
  namaUrl: string;
  nama: string;
  deskripsi: string | null;
  warna: string;
  waNomor: string | null;
  waPesan: string | null;
  tombol: TombolToko[];
  tombolIndeks: number[]; // urutan baris asli di form untuk tiap tombol (baris kosong dibuang)
};

export type HasilPeriksaToko =
  | { ok: true; data: DataToko }
  | { ok: false; pesan: string; kolom: KolomToko; indeks: number | null };

function gagal(pesan: string, kolom: KolomToko, indeks: number | null = null): HasilPeriksaToko {
  return { ok: false, pesan, kolom, indeks };
}

// asal = alamat situs, mis. "https://iqro-alpha.vercel.app" → ".../toko/kopi-senja".
export function alamatToko(asal: string, namaUrl: string): string {
  return `${asal}/toko/${namaUrl}`;
}

// Usulan alamat dari nama toko saat membuat halaman baru: "Kopi Senja!" → "kopi-senja".
export function alamatDariNama(nama: string): string {
  return nama
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // "é" → "e"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, 32)
    .replace(/-+$/, "");
}

export function warnaBenar(warna: string): boolean {
  return POLA_WARNA.test(warna);
}

// Huruf pertama nama toko untuk kotak avatar, mis. "kopi senja" → "K". Emoji tetap utuh.
export function hurufDepan(nama: string): string {
  const pertama = Array.from(nama.trim())[0];
  return pertama ? pertama.toLocaleUpperCase("id-ID") : "?";
}

// Baris tombol yang dua kolomnya kosong dianggap tidak ada (dibuang), bukan galat.
function tombolTerisi(tombol: TombolToko[]): { indeks: number; label: string; url: string }[] {
  return tombol
    .map((t, indeks) => ({ indeks, label: t.label.trim(), url: t.url.trim() }))
    .filter((t) => t.label !== "" || t.url !== "");
}

// Semua aturan kecuali "alamat sudah dipakai" (dicek database) dan Safe Browsing (dicek server).
export function periksaIsianToko(isian: IsianToko): HasilPeriksaToko {
  const nama = isian.nama.trim();
  if (nama === "") return gagal("Isi nama tokomu dulu.", "nama");
  if (nama.length > NAMA_TOKO_MAKS) {
    return gagal(`Nama toko maksimal ${NAMA_TOKO_MAKS} karakter.`, "nama");
  }

  const namaUrl = rapikanSlug(isian.namaUrl);
  if (namaUrl === "") return gagal("Isi alamat halamannya dulu, mis. kopi-senja.", "namaUrl");
  const galatAlamat = validasiSlug(namaUrl, "Alamat halaman");
  if (galatAlamat) return gagal(galatAlamat, "namaUrl");

  const deskripsi = isian.deskripsi.trim();
  if (deskripsi.length > DESKRIPSI_MAKS) {
    return gagal(`Deskripsi maksimal ${DESKRIPSI_MAKS} karakter.`, "deskripsi");
  }

  if (!warnaBenar(isian.warna)) return gagal("Pilih warna tema dari pemilih warna.", "warna");

  let waNomor: string | null = null;
  let waPesan: string | null = null;
  const pesan = isian.waPesan.trim();
  if (isian.waNomor.trim() !== "") {
    if (pesan.length > PANJANG_PESAN_WA_MAKS) {
      return gagal(`Pesan pembuka maksimal ${PANJANG_PESAN_WA_MAKS} karakter.`, "waPesan");
    }
    const wa = periksaWa(isian.waNomor, pesan);
    if (!wa.ok) return gagal(wa.error ?? "Nomor WhatsApp belum benar.", wa.kolom === "nomor" ? "waNomor" : "waPesan");
    waNomor = wa.nomor;
    waPesan = pesan === "" ? null : pesan;
  } else if (pesan !== "") {
    return gagal("Isi nomor WhatsApp-nya, atau kosongkan pesan pembuka.", "waNomor");
  }

  const terisi = tombolTerisi(isian.tombol);
  if (terisi.length > TOMBOL_MAKS) {
    return gagal(`Maksimal ${TOMBOL_MAKS} tombol link.`, "tombol");
  }
  const tombol: TombolToko[] = [];
  for (const t of terisi) {
    if (t.label === "") return gagal("Isi tulisan untuk tombol ini.", "tombol", t.indeks);
    if (t.label.length > LABEL_MAKS) {
      return gagal(`Tulisan tombol maksimal ${LABEL_MAKS} karakter.`, "tombol", t.indeks);
    }
    if (t.url === "") return gagal("Isi link untuk tombol ini.", "tombol", t.indeks);
    const hasil = normalisasiUrl(t.url);
    if (!hasil.ok) return gagal(hasil.error ?? "Link tidak valid.", "tombol", t.indeks);
    if (hasil.url.length > LINK_TOMBOL_MAKS) {
      return gagal(`Link tombol maksimal ${LINK_TOMBOL_MAKS} karakter.`, "tombol", t.indeks);
    }
    tombol.push({ label: t.label, url: hasil.url });
  }

  return {
    ok: true,
    data: {
      namaUrl,
      nama,
      deskripsi: deskripsi === "" ? null : deskripsi,
      warna: isian.warna.toUpperCase(),
      waNomor,
      waPesan,
      tombol,
      tombolIndeks: terisi.map((t) => t.indeks),
    },
  };
}

// Isi kolom tombol dari database (jsonb) dibaca sebagai unknown dan dicek satu per satu.
// Yang rusak dibuang, supaya halaman toko tetap tampil.
export function bacaTombol(data: unknown): TombolToko[] {
  if (!Array.isArray(data)) return [];
  const hasil: TombolToko[] = [];
  for (const baris of data.slice(0, TOMBOL_MAKS)) {
    if (typeof baris !== "object" || baris === null) continue;
    const { label, url } = baris as Record<string, unknown>;
    if (typeof label !== "string" || typeof url !== "string") continue;
    const cek = normalisasiUrl(url);
    if (label.trim() === "" || !cek.ok) continue;
    hasil.push({ label: label.slice(0, LABEL_MAKS), url: cek.url });
  }
  return hasil;
}

// Isian form → yang tampil di preview. Bagian yang belum benar tidak ditampilkan.
export function isiDariIsian(isian: IsianToko): IsiToko {
  const wa = isian.waNomor.trim() === "" ? null : periksaWa(isian.waNomor, isian.waPesan);
  return {
    nama: isian.nama.trim().slice(0, NAMA_TOKO_MAKS),
    deskripsi: isian.deskripsi.trim().slice(0, DESKRIPSI_MAKS),
    warna: warnaBenar(isian.warna) ? isian.warna : WARNA_TOKO_AWAL,
    waUrl: wa?.ok ? wa.url : null,
    tombol: tombolTerisi(isian.tombol)
      .filter((t) => t.label !== "")
      .slice(0, TOMBOL_MAKS)
      .map((t) => ({ label: t.label.slice(0, LABEL_MAKS), url: normalisasiUrl(t.url).ok ? t.url : "" })),
  };
}
