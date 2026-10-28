import { ArrowLeftRight } from "lucide-react";
import { KONTRAS_MINIMAL, cekWarnaQr, formatRasio } from "@/lib/kontras";
import Peringatan from "./Peringatan";

type PemilihWarnaProps = {
  id: string;
  label: string;
  nilai: string;
  onUbah: (warna: string) => void;
};

// Satu "chip tinta": seluruh kotak bisa diklik untuk membuka pemilih warna bawaan browser.
function PemilihWarna({ id, label, nilai, onUbah }: PemilihWarnaProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 rounded-md border border-garis bg-latar p-2 hover:border-teks-redup"
    >
      <input
        id={id}
        type="color"
        value={nilai}
        onChange={(e) => onUbah(e.target.value)}
        aria-describedby="warna-pesan"
        className="h-11 w-14 shrink-0 cursor-pointer rounded border border-garis bg-transparent p-0 [&::-moz-color-swatch]:rounded-sm [&::-moz-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block font-mono text-xs uppercase text-teks-redup">{nilai}</span>
      </span>
    </label>
  );
}

type Props = {
  warnaQr: string;
  warnaLatar: string;
  onUbahQr: (warna: string) => void;
  onUbahLatar: (warna: string) => void;
  onTukar: () => void;
};

export default function GayaQr({ warnaQr, warnaLatar, onUbahQr, onUbahLatar, onTukar }: Props) {
  const cek = cekWarnaQr(warnaQr, warnaLatar);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <PemilihWarna id="warna-qr" label="Warna QR" nilai={warnaQr} onUbah={onUbahQr} />
        <PemilihWarna id="warna-latar" label="Warna latar" nilai={warnaLatar} onUbah={onUbahLatar} />
      </div>

      <p className="mt-3 text-sm text-teks-redup">
        Kontras <span className="font-mono text-teks">{formatRasio(cek.rasio)}</span>. Supaya mudah
        di-scan, usahakan minimal <span className="font-mono">{KONTRAS_MINIMAL} : 1</span>.
      </p>

      <div id="warna-pesan" aria-live="polite">
        {cek.terlaluMirip && (
          <Peringatan tingkat="merah">
            Warna QR dan latar terlalu mirip, kamera HP bisa gagal membacanya. Pilih QR yang lebih
            gelap atau latar yang lebih terang.
          </Peringatan>
        )}
        {cek.terbalik && (
          <Peringatan
            tingkat="kuning"
            aksi={
              <button
                type="button"
                onClick={onTukar}
                className="inline-flex items-center gap-1.5 rounded-md border border-current px-2.5 py-1 font-medium hover:bg-permukaan"
              >
                <ArrowLeftRight aria-hidden="true" className="size-4" />
                Tukar warna
              </button>
            }
          >
            QR lebih terang dari latarnya (QR terbalik). Sebagian kamera HP tidak bisa membacanya.
          </Peringatan>
        )}
      </div>
    </div>
  );
}
