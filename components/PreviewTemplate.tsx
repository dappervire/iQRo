"use client";

import { useEffect, useRef } from "react";
import { jakarta } from "@/lib/font";
import { buatGambarQr } from "@/lib/qr";
import { DPI, mmKePx } from "@/lib/satuan";
import { TEMPLATE, gambarTemplate, muatFontTemplate } from "@/lib/template";
import type { State, TemplateId } from "@/lib/types";
import TandaPotong from "./TandaPotong";

// Canvas digambar penuh 300 DPI, lalu diperkecil dengan CSS ke lebar ini (px layar).
const LEBAR_TAMPIL: Record<TemplateId, number> = { stiker: 240, poster: 200, kartu: 280 };
const JEDA_MS = 200;

type Props = {
  state: State;
  data: string | null;
};

export default function PreviewTemplate({ state, data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const def = TEMPLATE[state.template];
  const font = jakarta.style.fontFamily;

  useEffect(() => {
    let batal = false;
    const timer = setTimeout(async () => {
      const qr = data ? await buatGambarQr(state, data, mmKePx(def.qrMm)) : null;
      await muatFontTemplate(font);
      // Kalau state sudah berubah lagi selama menunggu, gambar ini sudah basi.
      if (!batal && canvasRef.current) gambarTemplate(canvasRef.current, def, state, qr, font);
      qr?.close();
    }, JEDA_MS);
    return () => {
      batal = true;
      clearTimeout(timer);
    };
  }, [state, data, def, font]);

  return (
    <figure>
      <div
        className="relative mx-auto max-w-full bg-white"
        style={{
          width: LEBAR_TAMPIL[def.id],
          aspectRatio: `${def.lebarMm} / ${def.tinggiMm}`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={mmKePx(def.lebarMm)}
          height={mmKePx(def.tinggiMm)}
          role="img"
          aria-label={`Preview ${def.nama}: ${state.judul}, ${state.subjudul}`}
          className="block size-full"
        />
        <TandaPotong />
      </div>
      <figcaption className="mt-5 text-center font-mono text-xs text-teks-redup">
        <span className="block">
          {def.lebarMm} × {def.tinggiMm} mm · {DPI} DPI
        </span>
        <span className="block">
          {mmKePx(def.lebarMm)} × {mmKePx(def.tinggiMm)} px
        </span>
      </figcaption>
      {!data && (
        <p className="mt-2 text-center text-xs text-teks-redup">
          Kotak abu-abu akan terisi QR setelah link diisi.
        </p>
      )}
    </figure>
  );
}
