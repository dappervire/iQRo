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
  | { type: "tukarWarna" };

export type TingkatPeringatan = "kuning" | "merah";

export type CekWarna = {
  rasio: number;
  terlaluMirip: boolean;
  terbalik: boolean;
};

export type HasilUrl =
  | { ok: true; url: string; peringatan: string | null }
  | { ok: false; error: string | null };
