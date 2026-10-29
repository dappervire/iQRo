import { warnaTeksOtomatis } from "./kontras";
import { mmKePx } from "./satuan";
import type { DefinisiTemplate, KotakTeks, TemplateId } from "./types";

export const PANJANG_JUDUL_MAKS = 40;
export const PANJANG_SUBJUDUL_MAKS = 60;

// Semua angka dalam mm. Tepi kosong minimal 3 mm supaya aman saat kertas dipotong.
export const TEMPLATE: Record<TemplateId, DefinisiTemplate> = {
  stiker: {
    id: "stiker",
    nama: "Stiker meja",
    lebarMm: 100,
    tinggiMm: 100,
    qrMm: 60,
    panel: { x: 18, y: 23, lebar: 64, tinggi: 64 },
    judul: { x: 5, y: 5, lebar: 90, tinggi: 17, ukuranMm: 7, rata: "tengah", vertikal: "tengah" },
    subjudul: { x: 5, y: 88.5, lebar: 90, tinggi: 8, ukuranMm: 4, rata: "tengah", vertikal: "tengah" },
  },
  poster: {
    id: "poster",
    nama: "Poster A5",
    lebarMm: 148,
    tinggiMm: 210,
    qrMm: 90,
    panel: { x: 25, y: 68, lebar: 98, tinggi: 98 },
    judul: { x: 12, y: 14, lebar: 124, tinggi: 48, ukuranMm: 14, rata: "tengah", vertikal: "tengah" },
    subjudul: { x: 12, y: 174, lebar: 124, tinggi: 24, ukuranMm: 8, rata: "tengah", vertikal: "tengah" },
  },
  kartu: {
    id: "kartu",
    nama: "Kartu kecil",
    lebarMm: 90,
    tinggiMm: 55,
    qrMm: 40,
    panel: { x: 5.5, y: 5.5, lebar: 44, tinggi: 44 },
    judul: { x: 54, y: 5.5, lebar: 31, tinggi: 29, ukuranMm: 4.5, rata: "kiri", vertikal: "bawah" },
    subjudul: { x: 54, y: 36.5, lebar: 31, tinggi: 13, ukuranMm: 3, rata: "kiri", vertikal: "atas" },
  },
};

export const DAFTAR_TEMPLATE: DefinisiTemplate[] = [TEMPLATE.stiker, TEMPLATE.poster, TEMPLATE.kartu];

const BERAT_JUDUL = 800;
const BERAT_SUBJUDUL = 600;
const BARIS_JUDUL = 1.12; // jarak antarbaris, kelipatan ukuran huruf
const BARIS_SUBJUDUL = 1.25;
const SUDUT_PANEL_MM = 2;
// Teks tidak diperkecil di bawah 30% ukuran awalnya.
const UKURAN_MIN_RELATIF = 0.3;

export type IsiTemplate = {
  judul: string;
  subjudul: string;
  warnaTema: string;
};

// Memecah teks menjadi baris-baris yang lebarnya muat. Kata yang terlalu panjang dipotong per huruf.
export function bungkusTeks(ctx: CanvasRenderingContext2D, teks: string, lebarMaks: number): string[] {
  const baris: string[] = [];
  let sekarang = "";
  for (const kata of teks.split(/\s+/).filter(Boolean)) {
    const coba = sekarang ? `${sekarang} ${kata}` : kata;
    if (ctx.measureText(coba).width <= lebarMaks) {
      sekarang = coba;
      continue;
    }
    if (sekarang) baris.push(sekarang);
    sekarang = "";
    // Kata tunggal yang lebih lebar dari kotak: potong per huruf.
    for (const huruf of kata) {
      if (ctx.measureText(sekarang + huruf).width > lebarMaks && sekarang) {
        baris.push(sekarang);
        sekarang = "";
      }
      sekarang += huruf;
    }
  }
  if (sekarang) baris.push(sekarang);
  return baris;
}

function gambarTeks(
  ctx: CanvasRenderingContext2D,
  teks: string,
  kotak: KotakTeks,
  berat: number,
  tinggiBaris: number,
  font: string,
): void {
  if (!teks.trim()) return;
  const x = mmKePx(kotak.x);
  const y = mmKePx(kotak.y);
  const lebar = mmKePx(kotak.lebar);
  const tinggi = mmKePx(kotak.tinggi);
  const ukuranMaks = mmKePx(kotak.ukuranMm);

  // Mulai dari ukuran terbesar, perkecil 6% sampai semua baris muat di tinggi kotak.
  const ukuranMin = ukuranMaks * UKURAN_MIN_RELATIF;
  let ukuran = ukuranMaks;
  ctx.font = `${berat} ${ukuran}px ${font}`;
  let baris = bungkusTeks(ctx, teks, lebar);
  while (baris.length * ukuran * tinggiBaris > tinggi && ukuran * 0.94 >= ukuranMin) {
    ukuran *= 0.94;
    ctx.font = `${berat} ${ukuran}px ${font}`;
    baris = bungkusTeks(ctx, teks, lebar);
  }

  const jarak = ukuran * tinggiBaris;
  const tinggiBlok = baris.length * jarak;
  let atas = y;
  if (kotak.vertikal === "tengah") atas = y + (tinggi - tinggiBlok) / 2;
  if (kotak.vertikal === "bawah") atas = y + tinggi - tinggiBlok;

  ctx.textAlign = kotak.rata === "tengah" ? "center" : "left";
  ctx.textBaseline = "middle";
  const xTeks = kotak.rata === "tengah" ? x + lebar / 2 : x;
  baris.forEach((isi, i) => ctx.fillText(isi, xTeks, atas + (i + 0.5) * jarak));
}

// Tunggu font halaman siap supaya canvas tidak memakai font cadangan.
// Hanya font utama yang dimuat: font cadangan next/font memakai local("Arial"), yang tidak ada
// di Android sehingga document.fonts.load gagal ("A network error occurred").
export async function muatFontTemplate(font: string): Promise<void> {
  const utama = font.split(",")[0].trim();
  await Promise.all([
    document.fonts.load(`${BERAT_JUDUL} 40px ${utama}`),
    document.fonts.load(`${BERAT_SUBJUDUL} 40px ${utama}`),
  ]);
}

// Menggambar template utuh pada 300 DPI. qr = null menggambar kotak kosong sebagai tempat QR.
export function gambarTemplate(
  canvas: HTMLCanvasElement,
  def: DefinisiTemplate,
  isi: IsiTemplate,
  qr: CanvasImageSource | null,
  font: string,
): void {
  const lebar = mmKePx(def.lebarMm);
  const tinggi = mmKePx(def.tinggiMm);
  if (canvas.width !== lebar) canvas.width = lebar;
  if (canvas.height !== tinggi) canvas.height = tinggi;
  const ctx = canvas.getContext("2d");
  // Di HP, canvas besar bisa ditolak kalau memori browser penuh.
  if (!ctx) throw new Error("canvas tidak bisa dibuat (memori browser penuh?)");

  // 1. Latar warna tema.
  ctx.fillStyle = isi.warnaTema;
  ctx.fillRect(0, 0, lebar, tinggi);

  // 2. Panel putih.
  const p = def.panel;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  // roundRect belum ada di browser lama (mis. Safari < 16): pakai kotak biasa.
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(mmKePx(p.x), mmKePx(p.y), mmKePx(p.lebar), mmKePx(p.tinggi), mmKePx(SUDUT_PANEL_MM));
  } else {
    ctx.rect(mmKePx(p.x), mmKePx(p.y), mmKePx(p.lebar), mmKePx(p.tinggi));
  }
  ctx.fill();

  // 3. QR di tengah panel.
  const sisiQr = mmKePx(def.qrMm);
  const xQr = mmKePx(p.x + (p.lebar - def.qrMm) / 2);
  const yQr = mmKePx(p.y + (p.tinggi - def.qrMm) / 2);
  if (qr) {
    ctx.drawImage(qr, xQr, yQr, sisiQr, sisiQr);
  } else {
    ctx.fillStyle = "#f1f3f6";
    ctx.fillRect(xQr, yQr, sisiQr, sisiQr);
  }

  // 4–5. Judul dan subjudul, warna putih/hitam mengikuti kontras dengan warna tema.
  ctx.fillStyle = warnaTeksOtomatis(isi.warnaTema);
  const judul = isi.judul.slice(0, PANJANG_JUDUL_MAKS);
  const subjudul = isi.subjudul.slice(0, PANJANG_SUBJUDUL_MAKS);
  gambarTeks(ctx, judul, def.judul, BERAT_JUDUL, BARIS_JUDUL, font);
  gambarTeks(ctx, subjudul, def.subjudul, BERAT_SUBJUDUL, BARIS_SUBJUDUL, font);
}
