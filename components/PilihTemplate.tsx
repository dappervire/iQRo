import { DAFTAR_TEMPLATE, PANJANG_JUDUL_MAKS, PANJANG_SUBJUDUL_MAKS } from "@/lib/template";
import type { DefinisiTemplate, TemplateId } from "@/lib/types";
import { PemilihWarna } from "./GayaQr";

// Kertas mini digambar dengan skala yang sama (px per mm), jadi perbandingan ukurannya nyata.
const SKALA_MINI = 0.36;

function KertasMini({ def, warnaTema }: { def: DefinisiTemplate; warnaTema: string }) {
  const p = def.panel;
  return (
    <span
      aria-hidden="true"
      className="relative block ring-1 ring-teks/15"
      style={{
        width: def.lebarMm * SKALA_MINI,
        height: def.tinggiMm * SKALA_MINI,
        backgroundColor: warnaTema,
      }}
    >
      <span
        className="absolute rounded-[1px] bg-white"
        style={{
          left: p.x * SKALA_MINI,
          top: p.y * SKALA_MINI,
          width: p.lebar * SKALA_MINI,
          height: p.tinggi * SKALA_MINI,
        }}
      />
    </span>
  );
}

type IsianTeksProps = {
  id: string;
  label: string;
  nilai: string;
  maks: number;
  onUbah: (teks: string) => void;
};

function IsianTeks({ id, label, nilai, maks, onUbah }: IsianTeksProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <span id={`${id}-sisa`} className="font-mono text-xs text-teks-redup">
          {nilai.length}/{maks}
        </span>
      </div>
      <input
        id={id}
        type="text"
        autoComplete="off"
        maxLength={maks}
        value={nilai}
        onChange={(e) => onUbah(e.target.value)}
        aria-describedby={`${id}-sisa`}
        className="w-full rounded-md border border-garis bg-latar px-3 py-2.5 text-base text-teks placeholder:text-teks-redup focus:border-aksen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aksen/30"
      />
    </div>
  );
}

type Props = {
  template: TemplateId;
  judul: string;
  subjudul: string;
  warnaTema: string;
  onPilih: (template: TemplateId) => void;
  onUbahJudul: (judul: string) => void;
  onUbahSubjudul: (subjudul: string) => void;
  onUbahWarnaTema: (warna: string) => void;
};

export default function PilihTemplate({
  template,
  judul,
  subjudul,
  warnaTema,
  onPilih,
  onUbahJudul,
  onUbahSubjudul,
  onUbahWarnaTema,
}: Props) {
  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Ukuran cetak</legend>
        <div className="grid grid-cols-3 gap-2">
          {DAFTAR_TEMPLATE.map((def) => (
            <label
              key={def.id}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-garis bg-latar px-1 pb-2.5 pt-3 text-center hover:border-teks-redup has-[:checked]:border-aksen has-[:checked]:ring-1 has-[:checked]:ring-aksen has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-aksen"
            >
              <input
                type="radio"
                name="template"
                value={def.id}
                checked={template === def.id}
                onChange={() => onPilih(def.id)}
                className="sr-only"
              />
              {/* Semua kertas mini berdiri di garis dasar yang sama, seperti kertas di atas meja. */}
              <span className="flex h-20 items-end">
                <KertasMini def={def} warnaTema={warnaTema} />
              </span>
              <span className="text-sm font-medium leading-tight">{def.nama}</span>
              <span className="font-mono text-xs text-teks-redup">
                {def.lebarMm}×{def.tinggiMm} mm
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <IsianTeks
        id="judul"
        label="Judul"
        nilai={judul}
        maks={PANJANG_JUDUL_MAKS}
        onUbah={onUbahJudul}
      />
      <IsianTeks
        id="subjudul"
        label="Subjudul"
        nilai={subjudul}
        maks={PANJANG_SUBJUDUL_MAKS}
        onUbah={onUbahSubjudul}
      />

      <div>
        <PemilihWarna
          id="warna-tema"
          label="Warna tema"
          nilai={warnaTema}
          onUbah={onUbahWarnaTema}
          pesanId="warna-tema-pesan"
        />
        <p id="warna-tema-pesan" className="mt-2 text-xs text-teks-redup">
          Warna teks (putih atau hitam) dipilih otomatis supaya tetap terbaca.
        </p>
      </div>
    </div>
  );
}
