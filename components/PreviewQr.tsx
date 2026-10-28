"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import type QRCodeStyling from "qr-code-styling";
import { unduhBlob, namaFile } from "@/lib/ekspor";
import { buatOpsiQr } from "@/lib/qr";
import type { State } from "@/lib/types";
import TandaPotong from "./TandaPotong";

// Digambar 2x lebih besar dari tampilan supaya tajam di layar HP.
const LEBAR_PREVIEW = 600;
const LEBAR_UNDUH = 1024;
const JEDA_MS = 150;

type Props = {
  state: State;
  data: string | null;
};

export default function PreviewQr({ state, data }: Props) {
  const wadahRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);
  // Format yang sedang disiapkan; null = tidak ada unduhan berjalan.
  const [sedangUnduh, setSedangUnduh] = useState<"png" | "svg" | null>(null);

  useEffect(() => {
    if (!data) return;
    let batal = false;
    const timer = setTimeout(async () => {
      const opsi = buatOpsiQr(state, data, LEBAR_PREVIEW);
      if (qrRef.current) {
        qrRef.current.update(opsi);
        return;
      }
      const { default: QRCodeStyling } = await import("qr-code-styling");
      if (batal || !wadahRef.current) return;
      qrRef.current = new QRCodeStyling(opsi);
      qrRef.current.append(wadahRef.current);
    }, JEDA_MS);
    return () => {
      batal = true;
      clearTimeout(timer);
    };
  }, [state, data]);

  async function unduh(format: "png" | "svg") {
    if (!data) return;
    setSedangUnduh(format);
    try {
      const { default: QRCodeStyling } = await import("qr-code-styling");
      const jenis = format === "svg" ? "svg" : "canvas";
      const qr = new QRCodeStyling(buatOpsiQr(state, data, LEBAR_UNDUH, jenis));
      const blob = await qr.getRawData(format);
      if (blob instanceof Blob) unduhBlob(blob, namaFile("qr", format));
    } finally {
      setSedangUnduh(null);
    }
  }

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold">Preview</h2>
      <div className="relative mx-auto aspect-square w-full max-w-[280px]">
        {/* Kertas selalu putih (warna cetak, tidak ikut tema gelap). */}
        <div className={`absolute inset-0 bg-white ${data ? "" : "invisible"}`}>
          {/* Wadah selalu ada di halaman supaya QR yang sudah digambar tidak hilang. */}
          <div ref={wadahRef} className="[&>canvas]:h-auto [&>canvas]:w-full" />
        </div>
        {!data && (
          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-latar p-6 text-center text-sm text-teks-redup">
            QR muncul di sini setelah kamu menempel link.
          </div>
        )}
        {data && <TandaPotong />}
      </div>

      <p className="mt-5 text-center font-mono text-xs text-teks-redup">
        {LEBAR_UNDUH} × {LEBAR_UNDUH} px
      </p>
      {data && (
        <p className="mt-1 break-all text-center font-mono text-xs text-aksen">{data}</p>
      )}

      {/* Dua kolom kalau muat (tiap tombol min. 9,5rem), kalau sempit otomatis bertumpuk. */}
      <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-2">
        <button
          type="button"
          onClick={() => unduh("png")}
          disabled={!data || sedangUnduh !== null}
          className="flex items-center justify-center gap-2 rounded-md border border-aksen bg-aksen px-4 py-2.5 font-semibold text-teks-di-aksen hover:opacity-90 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-latar disabled:text-teks-redup disabled:hover:opacity-100"
        >
          <Download aria-hidden="true" className="size-4" />
          {sedangUnduh === "png" ? "Menyiapkan…" : "Unduh PNG"}
        </button>
        <button
          type="button"
          onClick={() => unduh("svg")}
          disabled={!data || sedangUnduh !== null}
          className="flex items-center justify-center gap-2 rounded-md border border-garis bg-latar px-4 py-2.5 font-semibold text-teks hover:border-aksen disabled:cursor-not-allowed disabled:border-transparent disabled:text-teks-redup"
        >
          {sedangUnduh === "svg" ? "Menyiapkan…" : "Unduh SVG"}
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-teks-redup">
        SVG tetap tajam di ukuran berapa pun, cocok untuk percetakan.
      </p>
    </div>
  );
}
