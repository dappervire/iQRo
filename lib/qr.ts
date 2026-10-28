// Hanya import tipe: tidak ikut terbawa ke server, jadi aman di file biasa.
import type { Options } from "qr-code-styling";
import type { State } from "./types";

// Quiet zone (bingkai kosong di sekeliling QR) minimal 8% lebar gambar.
const RASIO_MARGIN = 0.08;
// Jarak kosong di sekeliling logo, relatif terhadap lebar gambar.
const RASIO_MARGIN_LOGO = 0.01;
// qr-code-styling membatasi luas logo = imageSize × porsi pemulihan error correction (H = 30%).
const PORSI_PEMULIHAN_H = 0.3;
const IMAGE_SIZE_MAKS = 0.5;

// Mengubah "lebar logo dalam % lebar QR" (slider) menjadi koefisien imageSize qr-code-styling.
// Luas logo persegi = (persen/100)², lalu dibagi porsi pemulihan H. Contoh: 22% → 0,161.
export function persenKeImageSize(persen: number): number {
  const luas = (persen / 100) ** 2;
  return Math.min(IMAGE_SIZE_MAKS, luas / PORSI_PEMULIHAN_H);
}

// jenis "canvas" untuk preview & PNG, "svg" untuk unduhan SVG.
export function buatOpsiQr(
  state: State,
  data: string,
  lebar: number,
  jenis: "canvas" | "svg" = "canvas",
): Options {
  return {
    type: jenis,
    width: lebar,
    height: lebar,
    margin: Math.round(lebar * RASIO_MARGIN),
    data,
    // Kunci "image" selalu ada: saat logo dihapus, nilai undefined ikut menghapus logo lama di .update().
    image: state.logo?.dataUrl,
    imageOptions: {
      imageSize: persenKeImageSize(state.ukuranLogo),
      hideBackgroundDots: state.latarLogo,
      margin: Math.round(lebar * RASIO_MARGIN_LOGO),
    },
    qrOptions: { errorCorrectionLevel: state.logo ? "H" : "M" },
    dotsOptions: { type: "square", color: state.warnaQr },
    backgroundOptions: { color: state.warnaLatar },
  };
}

// QR sebagai gambar jadi untuk digambar ke canvas template. Library dimuat dinamis (hanya di browser).
// Pemanggil wajib .close() hasilnya setelah dipakai supaya memori dibebaskan.
export async function buatGambarQr(state: State, data: string, sisiPx: number): Promise<ImageBitmap | null> {
  const { default: QRCodeStyling } = await import("qr-code-styling");
  const blob = await new QRCodeStyling(buatOpsiQr(state, data, sisiPx)).getRawData("png");
  return blob instanceof Blob ? createImageBitmap(blob) : null;
}
