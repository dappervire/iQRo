"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { ImagePlus, LockKeyhole, RefreshCw, Trash2 } from "lucide-react";
import {
  ACCEPT_LOGO,
  UKURAN_LOGO_BATAS_AMAN,
  UKURAN_LOGO_MAKS,
  UKURAN_LOGO_MIN,
  bacaLogo,
} from "@/lib/logo";
import type { Logo } from "@/lib/types";
import Peringatan from "./Peringatan";

type Props = {
  logo: Logo | null;
  ukuran: number;
  latarLogo: boolean;
  onPasang: (logo: Logo) => void;
  onHapus: () => void;
  onUbahUkuran: (ukuran: number) => void;
  onUbahLatar: (aktif: boolean) => void;
};

export default function UnggahLogo({
  logo,
  ukuran,
  latarLogo,
  onPasang,
  onHapus,
  onUbahUkuran,
  onUbahLatar,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Error file hanya urusan tampilan sesaat, jadi disimpan di komponen ini, bukan di State utama.
  const [error, setError] = useState<string | null>(null);
  const [sedangBaca, setSedangBaca] = useState(false);
  const [sedangSeret, setSedangSeret] = useState(false);

  async function proses(file: File | undefined) {
    if (!file) return;
    setSedangBaca(true);
    const hasil = await bacaLogo(file);
    setSedangBaca(false);
    if (hasil.ok) {
      setError(null);
      onPasang(hasil.logo);
    } else {
      setError(hasil.error);
    }
  }

  function saatPilih(e: ChangeEvent<HTMLInputElement>) {
    void proses(e.target.files?.[0]);
    // Dikosongkan supaya memilih file yang sama lagi tetap terdeteksi.
    e.target.value = "";
  }

  function saatLepas(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setSedangSeret(false);
    void proses(e.dataTransfer.files[0]);
  }

  function hapus() {
    setError(null);
    onHapus();
  }

  return (
    <div>
      <h3 className="mb-1.5 text-sm font-medium">
        Logo di tengah <span className="font-normal text-teks-redup">(opsional)</span>
      </h3>

      {/* Input file selalu ada (tersembunyi) supaya tombol "Ganti" bisa membukanya.
          Diletakkan sebelum kotak pilih supaya kotak itu bisa ikut menyala saat input difokus (peer). */}
      <input
        ref={inputRef}
        id="logo"
        type="file"
        accept={ACCEPT_LOGO}
        onChange={saatPilih}
        aria-label="Pilih logo"
        aria-describedby="logo-pesan"
        tabIndex={logo ? -1 : 0}
        className="peer sr-only"
      />
      {logo ? (
        <div className="flex items-center gap-3 rounded-md border border-garis bg-latar p-2">
          {/* Kotak putih: logo dilihat di atas "kertas", sama seperti di QR. */}
          <div className="flex size-14 shrink-0 items-center justify-center rounded border border-garis bg-white p-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL lokal, next/image tidak cocok */}
            <img src={logo.dataUrl} alt="" className="max-h-full max-w-full object-contain" />
          </div>
          <p className="min-w-0 flex-1 truncate font-mono text-xs text-teks-redup" title={logo.nama}>
            {logo.nama}
          </p>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-md border border-garis px-2.5 py-1.5 text-sm font-medium hover:border-teks-redup"
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              Ganti
            </button>
            <button
              type="button"
              onClick={hapus}
              aria-label="Hapus logo"
              title="Hapus logo"
              className="flex items-center rounded-md border border-garis px-2.5 py-1.5 text-merah hover:border-merah"
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor="logo"
          onDragOver={(e) => {
            e.preventDefault();
            setSedangSeret(true);
          }}
          onDragLeave={() => setSedangSeret(false)}
          onDrop={saatLepas}
          className={`flex cursor-pointer items-center gap-3 rounded-md border border-dashed p-4 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-aksen ${
            sedangSeret ? "border-aksen bg-permukaan" : "border-garis bg-latar hover:border-teks-redup"
          }`}
        >
          <ImagePlus aria-hidden="true" className="size-6 shrink-0 text-biru" />
          <span className="min-w-0">
            <span className="block text-sm font-medium">
              {sedangBaca ? "Membaca logo…" : "Pilih logo atau tarik file ke sini"}
            </span>
            <span className="block text-xs text-teks-redup">
              PNG, JPG, WebP, atau SVG. Maksimal <span className="font-mono">2 MB</span>.
            </span>
          </span>
        </label>
      )}

      <div id="logo-pesan" aria-live="polite">
        {error && <Peringatan tingkat="merah">{error}</Peringatan>}
      </div>

      {logo && (
        <div className="mt-4 space-y-4">
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label htmlFor="ukuran-logo" className="text-sm font-medium">
                Ukuran logo
              </label>
              <span className="font-mono text-sm text-teks">{ukuran}%</span>
            </div>
            <input
              id="ukuran-logo"
              type="range"
              min={UKURAN_LOGO_MIN}
              max={UKURAN_LOGO_MAKS}
              step={1}
              value={ukuran}
              onChange={(e) => onUbahUkuran(Number(e.target.value))}
              aria-valuetext={`${ukuran} persen dari lebar QR`}
              aria-describedby="ukuran-logo-pesan"
              className="w-full cursor-pointer accent-aksen"
            />
            <div className="flex justify-between font-mono text-xs text-teks-redup">
              <span>{UKURAN_LOGO_MIN}%</span>
              <span>{UKURAN_LOGO_MAKS}%</span>
            </div>
            <div id="ukuran-logo-pesan" aria-live="polite">
              {ukuran > UKURAN_LOGO_BATAS_AMAN && (
                <Peringatan tingkat="kuning">
                  Logo besar menutupi banyak titik QR. Uji scan dengan 2 HP sebelum mencetak.
                </Peringatan>
              )}
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={latarLogo}
              onChange={(e) => onUbahLatar(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-aksen"
            />
            <span>
              <span className="block text-sm font-medium">Kosongkan area di belakang logo</span>
              <span className="block text-xs text-teks-redup">
                Logo lebih jelas. Kalau dimatikan, titik QR terlihat di sela logo yang transparan.
              </span>
            </span>
          </label>
        </div>
      )}

      <p className="mt-4 flex items-start gap-2 text-xs text-teks-redup">
        <LockKeyhole aria-hidden="true" className="mt-px size-3.5 shrink-0" />
        Logo diproses di perangkatmu, tidak diunggah ke mana pun.
      </p>
    </div>
  );
}
