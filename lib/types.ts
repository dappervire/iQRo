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
