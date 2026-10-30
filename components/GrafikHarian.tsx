"use client";

import { useState, type PointerEvent } from "react";
import { formatAngka } from "@/lib/analitik";
import type { KlikHarian } from "@/lib/types";

type Props = {
  hari: KlikHarian[]; // 30 hari, terlama dulu
};

// Grafik batang klik per hari, digambar dengan <div> biasa (tanpa library grafik).
// Arahkan mouse / ketuk batang → angka hari itu tampil di atas grafik.
// Pembaca layar & keyboard memakai tabel "Lihat angka per hari" di bawahnya.
export default function GrafikHarian({ hari }: Props) {
  const [aktif, setAktif] = useState<number | null>(null);
  const tertinggi = Math.max(0, ...hari.map((h) => h.klik));
  const skala = Math.max(1, tertinggi);
  const dipilih = aktif === null ? null : hari[aktif];
  const hariTertinggi = hari.find((h) => h.klik === tertinggi && tertinggi > 0);
  const awal = hari[0];
  const tengah = hari[Math.floor(hari.length / 2)];

  // Di layar sentuh, "pointerleave" langsung terjadi setelah jari diangkat; jangan hapus pilihan.
  function lepas(e: PointerEvent) {
    if (e.pointerType === "mouse") setAktif(null);
  }

  return (
    <div>
      <p aria-live="polite" className="min-h-5 text-sm">
        {dipilih ? (
          <>
            <span className="font-semibold">{dipilih.teks}</span>
            {": "}
            <span className="font-mono tabular-nums">{formatAngka(dipilih.klik)}</span> klik
          </>
        ) : (
          <span className="text-teks-redup">Arahkan atau ketuk batang untuk melihat angka per hari.</span>
        )}
      </p>

      <div
        role="img"
        aria-label={`Grafik klik per hari selama 30 hari terakhir.${
          hariTertinggi ? ` Paling banyak ${tertinggi} klik pada ${hariTertinggi.teks}.` : ""
        }`}
        className="mt-3 flex gap-2"
      >
        {/* Sumbu tegak: hanya angka tertinggi dan nol, supaya tidak ramai. */}
        <div
          aria-hidden="true"
          className="flex h-40 min-w-4 shrink-0 flex-col justify-between text-right font-mono text-xs tabular-nums text-teks-redup"
        >
          <span className="-mt-1.5">{formatAngka(skala)}</span>
          <span className="-mb-1.5">0</span>
        </div>
        <div className="min-w-0 flex-1">
          <div
            aria-hidden="true"
            onPointerLeave={lepas}
            className="relative flex h-40 items-end gap-0.5 border-b border-teks/25"
          >
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-teks/15" />
            {hari.map((h, i) => (
              // Area sentuh = seluruh kolom setinggi grafik, bukan hanya batangnya.
              <div
                key={h.tanggal}
                onPointerEnter={() => setAktif(i)}
                onPointerDown={() => setAktif(i)}
                className="relative flex h-full min-w-0 flex-1 cursor-crosshair items-end"
              >
                {h.klik > 0 && (
                  <div
                    className={`w-full rounded-t-[3px] ${aktif === i ? "bg-teks" : "bg-aksen"}`}
                    style={{ height: `${(h.klik / skala) * 100}%`, minHeight: 2 }}
                  />
                )}
              </div>
            ))}
          </div>
          <div
            aria-hidden="true"
            className="mt-1.5 flex justify-between font-mono text-xs text-teks-redup"
          >
            <span>{awal?.teksPendek}</span>
            <span className="hidden sm:inline">{tengah?.teksPendek}</span>
            <span>Hari ini</span>
          </div>
        </div>
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-semibold text-aksen underline-offset-4 hover:underline">
          Lihat angka per hari
        </summary>
        <table className="mt-3 w-full max-w-sm text-left">
          <caption className="sr-only">Klik per hari, terbaru dulu</caption>
          <thead>
            <tr className="text-teks-redup">
              <th scope="col" className="px-2 py-1 font-medium">
                Tanggal
              </th>
              <th scope="col" className="px-2 py-1 text-right font-medium">
                Klik
              </th>
            </tr>
          </thead>
          <tbody>
            {[...hari].reverse().map((h) => (
              <tr key={h.tanggal} className="even:bg-latar">
                <td className="px-2 py-1">{h.teks}</td>
                <td className="px-2 py-1 text-right font-mono tabular-nums">{formatAngka(h.klik)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
