export type TemplateId = "stiker" | "poster" | "kartu";

export type Logo = {
  dataUrl: string;
  nama: string;
};

export type State = {
  url: string;
  urlError: string | null;
  urlPeringatan: string | null;
  warnaQr: string;
  warnaLatar: string;
  logo: Logo | null;
  ukuranLogo: number;
  latarLogo: boolean;
  template: TemplateId;
  judul: string;
  subjudul: string;
  warnaTema: string;
};

export type Aksi =
  | { type: "ubahUrl"; url: string }
  | { type: "ubahWarnaQr"; warna: string }
  | { type: "ubahWarnaLatar"; warna: string }
  | { type: "tukarWarna" }
  | { type: "pasangLogo"; logo: Logo }
  | { type: "hapusLogo" }
  | { type: "ubahUkuranLogo"; ukuran: number }
  | { type: "ubahLatarLogo"; aktif: boolean }
  | { type: "pilihTemplate"; template: TemplateId }
  | { type: "ubahJudul"; judul: string }
  | { type: "ubahSubjudul"; subjudul: string }
  | { type: "ubahWarnaTema"; warna: string };

// Posisi dan ukuran dalam milimeter, diukur dari sudut kiri atas kertas.
export type KotakMm = {
  x: number;
  y: number;
  lebar: number;
  tinggi: number;
};

export type KotakTeks = KotakMm & {
  ukuranMm: number; // ukuran huruf terbesar; diperkecil otomatis kalau teks tidak muat
  rata: "kiri" | "tengah";
  vertikal: "atas" | "tengah" | "bawah";
};

export type DefinisiTemplate = {
  id: TemplateId;
  nama: string;
  lebarMm: number;
  tinggiMm: number;
  qrMm: number;
  panel: KotakMm; // panel putih, QR diletakkan di tengahnya
  judul: KotakTeks;
  subjudul: KotakTeks;
};

export type HasilLogo = { ok: true; logo: Logo } | { ok: false; error: string };

export type TingkatPeringatan = "kuning" | "merah";

// Tema tampilan web (bukan warna cetak). "sistem" = ikut pengaturan perangkat.
export type PilihanTema = "sistem" | "terang" | "gelap";

export type CekWarna = {
  rasio: number;
  terlaluMirip: boolean;
  terbalik: boolean;
};

export type HasilUrl =
  | { ok: true; url: string; peringatan: string | null }
  | { ok: false; error: string | null };

// --- Akun (v2) ---

// Data login yang sudah diverifikasi server (dari getClaims), bukan kiriman browser.
export type Pengguna = {
  id: string;
  email: string;
};

// Hasil Server Action di form akun. "terkirim" = email (verifikasi / ganti sandi) sudah dikirim.
export type HasilAksiAkun =
  | { status: "awal" }
  | { status: "galat"; pesan: string; email: string }
  | { status: "terkirim"; judul: string; pesan: string; lanjutan?: { href: string; label: string } };

// --- Link pendek (v2) ---

// Kolom form yang salah, supaya pesan galat tampil tepat di bawahnya (null = galat umum).
export type KolomLink = "tujuan" | "slug";

// Hasil Server Action buatLinkPendek. "pendek" = link lengkap, mis. "https://iqro-alpha.vercel.app/menu-kopi".
export type HasilLinkPendek =
  | { status: "awal" }
  | { status: "galat"; pesan: string; kolom: KolomLink | null }
  | { status: "berhasil"; slug: string; pendek: string; tujuan: string };

// Satu baris di daftar dasbor. "dibuatTeks" sudah diformat di server, mis. "30 Okt 2026".
export type LinkDasbor = {
  id: string;
  slug: string;
  tujuan: string;
  dibuatTeks: string;
  aktif: boolean;
  jumlahKlik: number;
};

// Hasil Server Action ubahTujuan dan hapusLink di dasbor.
export type HasilUbahLink =
  | { status: "awal" }
  | { status: "galat"; pesan: string }
  | { status: "berhasil" };

// --- Analitik (v2) ---

export type Perangkat = "hp" | "tablet" | "komputer" | "lainnya";

// Data satu klik yang dicatat (lib/klik.ts). Tidak ada alamat IP.
export type DataKlik = {
  perangkat: Perangkat;
  perujukDomain: string | null; // null = langsung / scan QR
  negara: string | null; // kode 2 huruf, mis. "ID"
};

// Satu hari di grafik. "teks" sudah diformat, mis. "Jum, 30 Okt".
export type KlikHarian = {
  tanggal: string; // "2026-10-30"
  klik: number;
  teks: string;
  teksPendek: string; // "30 Okt"
};

// Satu baris daftar peringkat (perujuk, perangkat, negara, link terpopuler).
export type BarisPeringkat = {
  label: string;
  klik: number;
  href?: string;
};

// Hasil fungsi database statistik_link(), sudah dicek bentuknya dan diberi label bahasa Indonesia.
export type StatistikLink = {
  harian: KlikHarian[];
  perujuk: BarisPeringkat[];
  perangkat: BarisPeringkat[];
  negara: BarisPeringkat[];
};
