import type { TemplateId } from "./types";

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
