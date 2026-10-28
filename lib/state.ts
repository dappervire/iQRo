import type { Aksi, State } from "./types";
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
    default:
      return state;
  }
}
