"use client";

import { Suspense, useEffect, useReducer, type Dispatch, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { reducer, stateAwal } from "@/lib/state";
import type { Aksi } from "@/lib/types";
import { normalisasiUrl } from "@/lib/validasi";
import GayaQr from "./GayaQr";
import LangkahLink from "./LangkahLink";
import PilihTemplate from "./PilihTemplate";
import PreviewQr from "./PreviewQr";
import PreviewTemplate from "./PreviewTemplate";
import TombolUnduh from "./TombolUnduh";
import UnggahLogo from "./UnggahLogo";

type LangkahProps = {
  judul: string;
  children: ReactNode;
};

function Langkah({ judul, children }: LangkahProps) {
  return (
    <section className="rounded-md bg-permukaan p-5 sm:p-6">
      <h2 className="mb-6 text-lg font-semibold">{judul}</h2>
      {children}
    </section>
  );
}

// "Buat QR dari link ini" di /pendek membuka /?url=<link pendek>; isi langkah Link dari situ.
// Hanya membaca alamat di browser (tidak ada server). Divalidasi normalisasiUrl() seperti ketikan biasa.
function IsiDariAlamat({ dispatch }: { dispatch: Dispatch<Aksi> }) {
  const url = useSearchParams().get("url");
  useEffect(() => {
    if (url) dispatch({ type: "ubahUrl", url });
  }, [url, dispatch]);
  return null;
}

export default function Iqro() {
  const [state, dispatch] = useReducer(reducer, stateAwal);
  const hasil = normalisasiUrl(state.url);
  const dataQr = hasil.ok ? hasil.url : null;

  return (
    // Logo, menu, dan tombol tema ada di HeaderSitus (app/layout.tsx).
    <main className="mx-auto max-w-5xl px-4 py-6 lg:pb-10">
      <h1 className="sr-only">iQRo — QR siap baca, siap cetak</h1>
      {/* Suspense: halaman tetap disiapkan lebih awal; ?url= baru dibaca di browser. */}
      <Suspense fallback={null}>
        <IsiDariAlamat dispatch={dispatch} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* Tiap langkah panel sendiri, dipisah jarak (bukan garis). */}
        <div className="space-y-4">
          <Langkah judul="Link">
            <LangkahLink
              url={state.url}
              error={state.urlError}
              peringatan={state.urlPeringatan}
              onUbah={(url) => dispatch({ type: "ubahUrl", url })}
            />
          </Langkah>

          <Langkah judul="Gaya QR">
            <GayaQr
              warnaQr={state.warnaQr}
              warnaLatar={state.warnaLatar}
              onUbahQr={(warna) => dispatch({ type: "ubahWarnaQr", warna })}
              onUbahLatar={(warna) => dispatch({ type: "ubahWarnaLatar", warna })}
              onTukar={() => dispatch({ type: "tukarWarna" })}
            />
            <div className="mt-6 border-t border-garis pt-5">
              <UnggahLogo
                logo={state.logo}
                ukuran={state.ukuranLogo}
                latarLogo={state.latarLogo}
                onPasang={(logo) => dispatch({ type: "pasangLogo", logo })}
                onHapus={() => dispatch({ type: "hapusLogo" })}
                onUbahUkuran={(ukuran) => dispatch({ type: "ubahUkuranLogo", ukuran })}
                onUbahLatar={(aktif) => dispatch({ type: "ubahLatarLogo", aktif })}
              />
            </div>
          </Langkah>

          <Langkah judul="Cetak">
            <div className="grid gap-6 sm:grid-cols-2 sm:items-start">
              <PilihTemplate
                template={state.template}
                judul={state.judul}
                subjudul={state.subjudul}
                warnaTema={state.warnaTema}
                onPilih={(template) => dispatch({ type: "pilihTemplate", template })}
                onUbahJudul={(judul) => dispatch({ type: "ubahJudul", judul })}
                onUbahSubjudul={(subjudul) => dispatch({ type: "ubahSubjudul", subjudul })}
                onUbahWarnaTema={(warna) => dispatch({ type: "ubahWarnaTema", warna })}
              />
              <div className="pt-3">
                <PreviewTemplate state={state} data={dataQr} />
                <TombolUnduh state={state} data={dataQr} />
              </div>
            </div>
          </Langkah>
        </div>

        <aside className="rounded-md border border-garis bg-permukaan p-5 sm:p-6 lg:sticky lg:top-6">
          <PreviewQr state={state} data={dataQr} />
        </aside>
      </div>
    </main>
  );
}
