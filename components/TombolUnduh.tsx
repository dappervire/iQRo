"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { namaFile, unduhPdf, unduhPng } from "@/lib/ekspor";
import { jakarta } from "@/lib/font";
import { buatGambarQr } from "@/lib/qr";
import { mmKePx } from "@/lib/satuan";
import { TEMPLATE, gambarTemplate, muatFontTemplate } from "@/lib/template";
import type { State } from "@/lib/types";
import Peringatan from "./Peringatan";

type Props = {
  state: State;
  data: string | null;
};

export default function TombolUnduh({ state, data }: Props) {
  // Format yang sedang disiapkan; null = tidak ada unduhan berjalan.
  const [sedangUnduh, setSedangUnduh] = useState<"png" | "pdf" | null>(null);
  const [gagal, setGagal] = useState(false);
  const def = TEMPLATE[state.template];

  async function unduh(format: "png" | "pdf") {
    if (!data) return;
    setSedangUnduh(format);
    setGagal(false);
    try {
      // Canvas baru di memori (tidak tampil), digambar ulang penuh 300 DPI dari state terbaru.
      const font = jakarta.style.fontFamily;
      const canvas = document.createElement("canvas");
      const [qr] = await Promise.all([buatGambarQr(state, data, mmKePx(def.qrMm)), muatFontTemplate(font)]);
      if (!qr) throw new Error("QR gagal dibuat");
      gambarTemplate(canvas, def, state, qr, font);
      qr.close();
      const nama = namaFile(def.id, format);
      if (format === "png") await unduhPng(canvas, nama);
      else await unduhPdf(canvas, def, nama);
    } catch (e) {
      console.error(e);
      setGagal(true);
    } finally {
      setSedangUnduh(null);
    }
  }

  return (
    <div className="mt-6">
      {/* Dua kolom kalau muat (tiap tombol min. 9,5rem), kalau sempit otomatis bertumpuk. */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-2">
        <button
          type="button"
          onClick={() => unduh("pdf")}
          disabled={!data || sedangUnduh !== null}
          className="flex items-center justify-center gap-2 rounded-md border border-aksen bg-aksen px-4 py-2.5 font-semibold text-teks-di-aksen hover:opacity-90 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-latar disabled:text-teks-redup disabled:hover:opacity-100"
        >
          <Download aria-hidden="true" className="size-4" />
          {sedangUnduh === "pdf" ? "Menyiapkan…" : "Unduh PDF"}
        </button>
        <button
          type="button"
          onClick={() => unduh("png")}
          disabled={!data || sedangUnduh !== null}
          className="flex items-center justify-center gap-2 rounded-md border border-garis bg-latar px-4 py-2.5 font-semibold text-teks hover:border-aksen disabled:cursor-not-allowed disabled:border-transparent disabled:text-teks-redup"
        >
          {sedangUnduh === "png" ? "Menyiapkan…" : "Unduh PNG"}
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-teks-redup">
        PDF tercetak pas <span className="font-mono">{def.lebarMm} × {def.tinggiMm} mm</span>. Saat mencetak, pilih
        skala &ldquo;Ukuran sebenarnya&rdquo; / 100%.
      </p>
      {gagal && <Peringatan tingkat="merah">Gagal menyiapkan file. Coba klik sekali lagi.</Peringatan>}
    </div>
  );
}
