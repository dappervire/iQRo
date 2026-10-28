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
  const [sedangUnduh, setSedangUnduh] = useState(false);

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

  async function unduhPng() {
    if (!data) return;
    setSedangUnduh(true);
    try {
      const { default: QRCodeStyling } = await import("qr-code-styling");
      const qr = new QRCodeStyling(buatOpsiQr(state, data, LEBAR_UNDUH));
      const blob = await qr.getRawData("png");
      if (blob instanceof Blob) unduhBlob(blob, namaFile("qr", "png"));
    } finally {
      setSedangUnduh(false);
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
          <div className="absolute inset-0 flex items-center justify-center rounded-md border border-dashed border-garis p-6 text-center text-sm text-teks-redup">
            QR muncul di sini setelah kamu menempel link.
          </div>
        )}
        {data && <TandaPotong />}
      </div>

      <p className="mt-5 text-center font-mono text-xs text-teks-redup">
        {LEBAR_UNDUH} × {LEBAR_UNDUH} px
      </p>
      {data && (
        <p className="mt-1 break-all text-center font-mono text-xs text-biru">{data}</p>
      )}

      <button
        type="button"
        onClick={unduhPng}
        disabled={!data || sedangUnduh}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-aksen px-4 py-2.5 font-semibold text-teks-di-aksen hover:opacity-90 disabled:cursor-not-allowed disabled:bg-garis disabled:text-teks-redup disabled:hover:opacity-100"
      >
        <Download aria-hidden="true" className="size-4" />
        {sedangUnduh ? "Menyiapkan…" : "Unduh PNG"}
      </button>
    </div>
  );
}
