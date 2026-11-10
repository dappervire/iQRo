import type { Aksi, State } from "./types";
import { UKURAN_LOGO_MAKS, UKURAN_LOGO_MIN } from "./logo";
import { PANJANG_JUDUL_MAKS, PANJANG_SUBJUDUL_MAKS } from "./template";
import { normalisasiUrl } from "./validasi";
import { PANJANG_PESAN_WA_MAKS } from "./whatsapp";

export const stateAwal: State = {
  jenis: "link",
  url: "",
  urlError: null,
  urlPeringatan: null,
  waNomor: "",
  waPesan: "",
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
    // Hanya ganti jenis; isian jenis lain tetap disimpan supaya tidak hilang saat pindah bolak-balik.
    case "pilihJenis":
      return { ...state, jenis: aksi.jenis };
    case "ubahWaNomor":
      return { ...state, waNomor: aksi.nomor };
    case "ubahWaPesan":
      return { ...state, waPesan: aksi.pesan.slice(0, PANJANG_PESAN_WA_MAKS) };
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
    case "pilihTemplate":
      return { ...state, template: aksi.template };
    case "ubahJudul":
      return { ...state, judul: aksi.judul.slice(0, PANJANG_JUDUL_MAKS) };
    case "ubahSubjudul":
      return { ...state, subjudul: aksi.subjudul.slice(0, PANJANG_SUBJUDUL_MAKS) };
    case "ubahWarnaTema":
      return { ...state, warnaTema: aksi.warna };
    default:
      return state;
  }
}
