import { DPI } from "./satuan";
import type { DefinisiTemplate, TemplateId } from "./types";

export function namaFile(bagian: TemplateId | "qr", ekstensi: "png" | "svg" | "pdf"): string {
  const t = new Date();
  const tanggal = `${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, "0")}${String(t.getDate()).padStart(2, "0")}`;
  return `iqro-${bagian}-${tanggal}.${ekstensi}`;
}

export function unduhBlob(blob: Blob, nama: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nama;
  a.click();
  // Beri jeda supaya browser sempat memulai unduhan sebelum alamatnya dibuang.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function canvasKePng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((selesai, gagal) => {
    canvas.toBlob((blob) => (blob ? selesai(blob) : gagal(new Error("Canvas gagal diubah ke PNG"))), "image/png");
  });
}

// Checksum CRC-32 yang wajib ada di setiap potongan (chunk) file PNG.
function crc32(bytes: Uint8Array): number {
  let c = ~0;
  for (const b of bytes) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

// canvas.toBlob tidak mencatat DPI, jadi aplikasi lain menganggapnya 72/96 DPI dan mencetaknya
// terlalu besar. Kita sisipkan potongan "pHYs" (titik per meter) tepat setelah header IHDR.
export async function tandaiDpiPng(png: Blob, dpi: number): Promise<Blob> {
  const asli = new Uint8Array(await png.arrayBuffer());
  const AKHIR_IHDR = 8 + 25; // tanda tangan PNG 8 byte + potongan IHDR 25 byte
  const titikPerMeter = Math.round(dpi / 0.0254);

  const potongan = new Uint8Array(4 + 4 + 9 + 4);
  const v = new DataView(potongan.buffer);
  v.setUint32(0, 9); // panjang data
  potongan.set([0x70, 0x48, 0x59, 0x73], 4); // "pHYs"
  v.setUint32(8, titikPerMeter); // horizontal
  v.setUint32(12, titikPerMeter); // vertikal
  v.setUint8(16, 1); // satuan: meter
  v.setUint32(17, crc32(potongan.subarray(4, 17)));

  return new Blob([asli.subarray(0, AKHIR_IHDR), potongan, asli.subarray(AKHIR_IHDR)], { type: "image/png" });
}

export async function unduhPng(canvas: HTMLCanvasElement, nama: string): Promise<void> {
  const png = await canvasKePng(canvas);
  unduhBlob(await tandaiDpiPng(png, DPI), nama);
}

// Halaman PDF dibuat persis seukuran kertas template (mm), gambar mengisi penuh halaman.
export async function unduhPdf(canvas: HTMLCanvasElement, def: DefinisiTemplate, nama: string): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    unit: "mm",
    format: [def.lebarMm, def.tinggiMm],
    orientation: def.lebarMm > def.tinggiMm ? "landscape" : "portrait",
  });
  pdf.addImage(canvas, "PNG", 0, 0, def.lebarMm, def.tinggiMm);
  pdf.save(nama);
}
