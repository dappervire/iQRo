import type { HasilLogo } from "./types";

export const UKURAN_LOGO_MIN = 15;
export const UKURAN_LOGO_MAKS = 30;
// Di atas batas ini muncul peringatan kuning (logo menutupi banyak titik QR).
export const UKURAN_LOGO_BATAS_AMAN = 25;

const BATAS_BYTE = 2 * 1024 * 1024;
const JENIS_DIIZINKAN = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
export const ACCEPT_LOGO = ".png,.jpg,.jpeg,.webp,.svg," + JENIS_DIIZINKAN.join(",");

function formatMb(byte: number): string {
  return (byte / 1024 / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

function bacaDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const pembaca = new FileReader();
    pembaca.onload = () =>
      typeof pembaca.result === "string" ? resolve(pembaca.result) : reject(new Error("kosong"));
    pembaca.onerror = () => reject(pembaca.error);
    pembaca.readAsDataURL(file);
  });
}

// Memastikan browser benar-benar bisa menggambar file ini (mis. bukan file .pdf yang diganti namanya,
// atau SVG tanpa ukuran yang tampil kosong).
function cekBisaDigambar(dataUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const gambar = new Image();
    gambar.onload = () => resolve(gambar.naturalWidth > 0 && gambar.naturalHeight > 0);
    gambar.onerror = () => resolve(false);
    gambar.src = dataUrl;
  });
}

// Semua diproses di perangkat: file hanya dibaca jadi data URL, tidak dikirim ke mana pun.
export async function bacaLogo(file: File): Promise<HasilLogo> {
  if (!JENIS_DIIZINKAN.includes(file.type)) {
    return { ok: false, error: "Format file tidak didukung. Pakai PNG, JPG, WebP, atau SVG." };
  }
  if (file.size > BATAS_BYTE) {
    return {
      ok: false,
      error: `Ukuran file ${formatMb(file.size)} MB, maksimal 2 MB. Perkecil gambarnya dulu.`,
    };
  }

  let dataUrl: string;
  try {
    dataUrl = await bacaDataUrl(file);
  } catch {
    return { ok: false, error: "File gagal dibaca. Coba pilih ulang." };
  }

  if (!(await cekBisaDigambar(dataUrl))) {
    return { ok: false, error: "Gambar tidak bisa ditampilkan. Coba simpan ulang sebagai PNG." };
  }

  return { ok: true, logo: { dataUrl, nama: file.name } };
}
