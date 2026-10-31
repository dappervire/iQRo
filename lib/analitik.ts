// Logika murni untuk halaman statistik (/dasbor/[id]): membaca hasil statistik_link() dan memberi label.

import type { BarisPeringkat, KlikHarian, Perangkat, StatistikLink } from "./types";

const NAMA_PERANGKAT: Record<Perangkat, string> = {
  hp: "HP",
  tablet: "Tablet",
  komputer: "Komputer",
  lainnya: "Lainnya",
};

const FORMAT_ANGKA = new Intl.NumberFormat("id-ID");
// Tanggal dari database sudah tanggal WIB ("2026-10-30"), jadi dibaca sebagai UTC supaya tidak bergeser.
const FORMAT_HARI = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const FORMAT_HARI_PENDEK = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const NAMA_WILAYAH = new Intl.DisplayNames(["id"], { type: "region" });

// 1234 → "1.234"
export function formatAngka(n: number): string {
  return FORMAT_ANGKA.format(n);
}

// "ID" → "Indonesia"
export function namaNegara(kode: string | null): string {
  if (!kode) return "Tidak diketahui";
  try {
    return NAMA_WILAYAH.of(kode) ?? kode;
  } catch {
    return kode;
  }
}

function bacaAngka(nilai: unknown): number | null {
  return typeof nilai === "number" && Number.isInteger(nilai) && nilai >= 0 ? nilai : null;
}

// Hasil database dibaca sebagai unknown dan dicek satu per satu. Satu baris salah bentuk = semua ditolak.
function bacaDaftar<T>(data: unknown, bacaSatu: (baris: Record<string, unknown>) => T | null): T[] | null {
  if (!Array.isArray(data)) return null;
  const hasil: T[] = [];
  for (const baris of data) {
    if (typeof baris !== "object" || baris === null) return null;
    const satu = bacaSatu(baris as Record<string, unknown>);
    if (satu === null) return null;
    hasil.push(satu);
  }
  return hasil;
}

function bacaHari(baris: Record<string, unknown>): KlikHarian | null {
  const klik = bacaAngka(baris.klik);
  if (typeof baris.tanggal !== "string" || klik === null) return null;
  const tanggal = new Date(`${baris.tanggal}T00:00:00Z`);
  if (Number.isNaN(tanggal.getTime())) return null;
  return {
    tanggal: baris.tanggal,
    klik,
    teks: FORMAT_HARI.format(tanggal),
    teksPendek: FORMAT_HARI_PENDEK.format(tanggal),
  };
}

// Membuat pembaca baris peringkat: "nama" (teks atau null) diubah jadi label lewat beriLabel.
function pembacaPeringkat(beriLabel: (nama: string | null) => string | null) {
  return (baris: Record<string, unknown>): BarisPeringkat | null => {
    const klik = bacaAngka(baris.klik);
    const nama = baris.nama;
    if (klik === null || (nama !== null && typeof nama !== "string")) return null;
    const label = beriLabel(nama);
    return label === null ? null : { label, klik };
  };
}

const bacaPerujuk = pembacaPeringkat((nama) => nama ?? "Langsung / scan QR");
const bacaNegara = pembacaPeringkat(namaNegara);
const bacaPerangkat = pembacaPeringkat((nama) =>
  nama !== null && Object.hasOwn(NAMA_PERANGKAT, nama) ? NAMA_PERANGKAT[nama as Perangkat] : null,
);

export function bacaStatistik(data: unknown): StatistikLink | null {
  if (typeof data !== "object" || data === null) return null;
  const isi = data as Record<string, unknown>;
  const harian = bacaDaftar(isi.harian, bacaHari);
  const perujuk = bacaDaftar(isi.perujuk, bacaPerujuk);
  const perangkat = bacaDaftar(isi.perangkat, bacaPerangkat);
  const negara = bacaDaftar(isi.negara, bacaNegara);
  if (!harian || !perujuk || !perangkat || !negara) return null;
  return { harian, perujuk, perangkat, negara };
}

export function jumlahKlik(harian: KlikHarian[]): number {
  return harian.reduce((total, hari) => total + hari.klik, 0);
}
