// Hanya import tipe: tidak ikut terbawa ke server, jadi aman di file biasa.
import type { Options } from "qr-code-styling";
import type { State } from "./types";

// Quiet zone (bingkai kosong di sekeliling QR) minimal 8% lebar gambar.
const RASIO_MARGIN = 0.08;

export function buatOpsiQr(state: State, data: string, lebar: number): Options {
  return {
    type: "canvas",
    width: lebar,
    height: lebar,
    margin: Math.round(lebar * RASIO_MARGIN),
    data,
    qrOptions: { errorCorrectionLevel: state.logo ? "H" : "M" },
    dotsOptions: { type: "square", color: state.warnaQr },
    backgroundOptions: { color: state.warnaLatar },
  };
}
