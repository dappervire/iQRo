import type { Aksi, State } from "./types";
import { UKURAN_LOGO_MAKS, UKURAN_LOGO_MIN } from "./logo";
import { normalisasiUrl } from "./validasi";

export const stateAwal: State = {
  url: "",
  urlError: null,
  urlPeringatan: null,
  warnaQr: "#111111",
  warnaLatar: "#ffffff",
  logo: null,
  ukuranLogo: 22,
  latarLogo: true,
  template: "stiker",
  judul: "Scan untuk lihat menu",
  subjudul: "Nama Tokomu",
  warnaTema: "#E8481C",
};

export function reducer(state: State, aksi: Aksi): State {
  switch (aksi.type) {
    case "ubahUrl": {
      const hasil = normalisasiUrl(aksi.url);
      return {
        ...state,
        url: aksi.url,
        urlError: hasil.ok ? null : hasil.error,
        urlPeringatan: hasil.ok ? hasil.peringatan : null,
      };
    }
    case "ubahWarnaQr":
      return { ...state, warnaQr: aksi.warna };
    case "ubahWarnaLatar":
      return { ...state, warnaLatar: aksi.warna };
    case "tukarWarna":
      return { ...state, warnaQr: state.warnaLatar, warnaLatar: state.warnaQr };
    case "pasangLogo":
      return { ...state, logo: aksi.logo };
    case "hapusLogo":
      return { ...state, logo: null };
    case "ubahUkuranLogo": {
      const ukuran = Math.min(UKURAN_LOGO_MAKS, Math.max(UKURAN_LOGO_MIN, aksi.ukuran));
      return { ...state, ukuranLogo: ukuran };
    }
    case "ubahLatarLogo":
      return { ...state, latarLogo: aksi.aktif };
    default:
      return state;
  }
}
