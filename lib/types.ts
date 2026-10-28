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

export type Aksi = { type: "ubahUrl"; url: string };

export type HasilUrl =
  | { ok: true; url: string; peringatan: string | null }
  | { ok: false; error: string | null };
