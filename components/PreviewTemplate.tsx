"use client";

import { useEffect, useRef, useState } from "react";
import { jakarta } from "@/lib/font";
import { buatGambarQr } from "@/lib/qr";
import { DPI, mmKePx } from "@/lib/satuan";
import { TEMPLATE, gambarTemplate, muatFontTemplate } from "@/lib/template";
import type { State, TemplateId } from "@/lib/types";
import TandaPotong from "./TandaPotong";

// Canvas digambar penuh 300 DPI, lalu diperkecil dengan CSS ke lebar ini (px layar).
const LEBAR_TAMPIL: Record<TemplateId, number> = { stiker: 240, poster: 200, kartu: 280 };
const JEDA_MS = 200;
const BATAS_WAKTU_MS = 8000;

function pesanGalat(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// Kalau sebuah langkah tidak pernah selesai (macet), anggap gagal supaya pesan tetap muncul.
function denganBatasWaktu<T>(janji: Promise<T>): Promise<T> {
  return Promise.race([
    janji,
    new Promise<never>((_, tolak) =>
      setTimeout(() => tolak(new Error(`macet lebih dari ${BATAS_WAKTU_MS / 1000} detik`)), BATAS_WAKTU_MS),
    ),
  ]);
}

type Props = {
  state: State;
  data: string | null;
};

export default function PreviewTemplate({ state, data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const def = TEMPLATE[state.template];
  const font = jakarta.style.fontFamily;

  useEffect(() => {
    let batal = false;
    const timer = setTimeout(async () => {
      const masalah: string[] = [];
      // Kalau QR atau font gagal, template tetap digambar (kotak abu-abu / font cadangan).
      const qr = data
        ? await denganBatasWaktu(buatGambarQr(state, data, mmKePx(def.qrMm))).catch((e: unknown) => {
            masalah.push(`QR: ${pesanGalat(e)}`);
            return null;
          })
        : null;
      await denganBatasWaktu(muatFontTemplate(font)).catch((e: unknown) => masalah.push(`Font: ${pesanGalat(e)}`));
      // Kalau state sudah berubah lagi selama menunggu, gambar ini sudah basi.
      if (!batal && canvasRef.current) {
        try {
          gambarTemplate(canvasRef.current, def, state, qr, font);
        } catch (e) {
          masalah.push(`Gambar: ${pesanGalat(e)}`);
        }
        setGalat(masalah.length ? masalah.join(" · ") : null);
      }
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
      {galat && (
        <p role="alert" className="mt-2 text-center text-xs text-teks-redup">
          Preview bermasalah di browser ini ({galat}).
        </p>
      )}
      {!data && (
        <p className="mt-2 text-center text-xs text-teks-redup">
          Kotak abu-abu akan terisi QR setelah link atau nomor WhatsApp diisi.
        </p>
      )}
    </figure>
  );
}
