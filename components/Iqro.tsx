"use client";

import { useReducer, type ReactNode } from "react";
import { reducer, stateAwal } from "@/lib/state";
import { normalisasiUrl } from "@/lib/validasi";
import LangkahLink from "./LangkahLink";
import PreviewQr from "./PreviewQr";

type LangkahProps = {
  nomor: string;
  judul: string;
  children: ReactNode;
};

function Langkah({ nomor, judul, children }: LangkahProps) {
  return (
    <section className="p-5 sm:p-6">
      <h2 className="mb-4 flex items-baseline gap-3">
        <span className="font-mono text-3xl font-medium leading-none text-biru">{nomor}</span>
        <span className="text-lg font-semibold">{judul}</span>
      </h2>
      {children}
    </section>
  );
}

export default function Iqro() {
  const [state, dispatch] = useReducer(reducer, stateAwal);
  const hasil = normalisasiUrl(state.url);
  const dataQr = hasil.ok ? hasil.url : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 lg:py-10">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-garis pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight">
          iQRo<span className="sr-only"> — QR siap baca, siap cetak</span>
        </h1>
        <p className="text-sm text-teks-redup">QR siap baca, siap cetak.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="divide-y divide-garis rounded-md border border-garis bg-permukaan">
          <Langkah nomor="01" judul="· Link">
            <LangkahLink
              url={state.url}
              error={state.urlError}
              peringatan={state.urlPeringatan}
              onUbah={(url) => dispatch({ type: "ubahUrl", url })}
            />
          </Langkah>

          <Langkah nomor="02" judul="· Gaya QR">
            <p className="text-sm text-teks-redup">Pilihan warna dan logo segera hadir.</p>
          </Langkah>

          <Langkah nomor="03" judul="· Cetak">
            <p className="text-sm text-teks-redup">Template stiker, poster, dan kartu segera hadir.</p>
          </Langkah>
        </div>

        <aside className="rounded-md border border-garis bg-permukaan p-5 sm:p-6 lg:sticky lg:top-6">
          <PreviewQr state={state} data={dataQr} />
        </aside>
      </div>
    </main>
  );
}
