import type { CekWarna } from "./types";

// Di bawah angka ini, kamera HP mulai sulit membedakan titik QR dari latarnya.
export const KONTRAS_MINIMAL = 3;

// "#c2185b" → [194, 24, 91]. Menerima juga bentuk pendek "#fff". Teks rusak dianggap hitam.
function hexKeRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(h)) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-f]{6}$/i.test(h)) return [0, 0, 0];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Mengubah nilai kanal 0–255 ke skala cahaya linear (aturan sRGB).
function linear(kanal: number): number {
  const c = kanal / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

// Seberapa terang sebuah warna: 0 = hitam, 1 = putih (rumus WCAG).
export function luminans(hex: string): number {
  const [r, g, b] = hexKeRgb(hex);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

// 1 = sama persis, 21 = hitam di atas putih. Urutan warna tidak berpengaruh.
export function rasioKontras(a: string, b: string): number {
  const la = luminans(a);
  const lb = luminans(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Dipakai template (M4): pilih teks putih atau hitam yang paling terbaca di atas warna tema.
export function warnaTeksOtomatis(latar: string): "#ffffff" | "#000000" {
  return rasioKontras(latar, "#ffffff") >= rasioKontras(latar, "#000000") ? "#ffffff" : "#000000";
}

export function cekWarnaQr(warnaQr: string, warnaLatar: string): CekWarna {
  const rasio = rasioKontras(warnaQr, warnaLatar);
  return {
    rasio,
    terlaluMirip: rasio < KONTRAS_MINIMAL,
    terbalik: luminans(warnaQr) > luminans(warnaLatar),
  };
}

// 18.95 → "19,0 : 1" (format angka Indonesia).
export function formatRasio(rasio: number): string {
  const angka = rasio.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${angka} : 1`;
}
