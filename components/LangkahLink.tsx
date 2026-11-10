import { Link2, MessageCircle, Phone, type LucideIcon } from "lucide-react";
import type { HasilWa, JenisQr } from "@/lib/types";
import { PANJANG_PESAN_WA_MAKS } from "@/lib/whatsapp";
import Peringatan from "./Peringatan";

const KELAS_INPUT =
  "w-full rounded-md border border-garis bg-latar text-base text-teks placeholder:text-teks-redup focus:border-aksen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aksen/30";

const PILIHAN_JENIS: { id: JenisQr; label: string; Ikon: LucideIcon }[] = [
  { id: "link", label: "Link", Ikon: Link2 },
  { id: "wa", label: "WhatsApp", Ikon: MessageCircle },
];

type Props = {
  jenis: JenisQr;
  url: string;
  error: string | null;
  peringatan: string | null;
  waNomor: string;
  waPesan: string;
  hasilWa: HasilWa;
  onPilihJenis: (jenis: JenisQr) => void;
  onUbah: (url: string) => void;
  onUbahWaNomor: (nomor: string) => void;
  onUbahWaPesan: (pesan: string) => void;
};

export default function LangkahLink(props: Props) {
  const { jenis, onPilihJenis } = props;
  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Jenis QR</legend>
        <div className="grid grid-cols-2 gap-2">
          {PILIHAN_JENIS.map(({ id, label, Ikon }) => (
            <label
              key={id}
              className="group flex cursor-pointer items-center justify-center gap-2 rounded-md border border-garis bg-latar px-3 py-2.5 text-sm font-medium hover:border-aksen has-[:checked]:border-aksen has-[:checked]:ring-1 has-[:checked]:ring-aksen has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-aksen"
            >
              <input
                type="radio"
                name="jenis-qr"
                value={id}
                checked={jenis === id}
                onChange={() => onPilihJenis(id)}
                className="sr-only"
              />
              <Ikon
                aria-hidden="true"
                className="size-4 text-teks-redup group-has-[:checked]:text-aksen"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {jenis === "link" ? <IsianLink {...props} /> : <IsianWa {...props} />}
    </div>
  );
}

function IsianLink({ url, error, peringatan, onUbah }: Props) {
  return (
    <div>
      <label htmlFor="link" className="mb-1.5 block text-sm font-medium">
        Link tujuan
      </label>
      <div className="relative">
        <Link2
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teks-redup"
        />
        <input
          id="link"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="contoh: tokoku.id/menu"
          value={url}
          onChange={(e) => onUbah(e.target.value)}
          aria-invalid={error !== null}
          aria-describedby="link-pesan"
          className={`${KELAS_INPUT} py-2.5 pl-9 pr-3`}
        />
      </div>
      <div id="link-pesan" aria-live="polite">
        {error && <Peringatan tingkat="merah">{error}</Peringatan>}
        {peringatan && <Peringatan tingkat="kuning">{peringatan}</Peringatan>}
      </div>
    </div>
  );
}

function IsianWa({ waNomor, waPesan, hasilWa, onUbahWaNomor, onUbahWaPesan }: Props) {
  const galatNomor = !hasilWa.ok && hasilWa.kolom === "nomor" ? hasilWa.error : null;
  const galatPesan = !hasilWa.ok && hasilWa.kolom === "pesan" ? hasilWa.error : null;

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="wa-nomor" className="mb-1.5 block text-sm font-medium">
          Nomor WhatsApp
        </label>
        <div className="relative">
          <Phone
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teks-redup"
          />
          <input
            id="wa-nomor"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="contoh: 0812-3456-7890"
            value={waNomor}
            onChange={(e) => onUbahWaNomor(e.target.value)}
            aria-invalid={galatNomor !== null}
            aria-describedby="wa-nomor-pesan"
            className={`${KELAS_INPUT} py-2.5 pl-9 pr-3`}
          />
        </div>
        <div id="wa-nomor-pesan" aria-live="polite">
          {galatNomor ? (
            <Peringatan tingkat="merah">{galatNomor}</Peringatan>
          ) : hasilWa.ok ? (
            <p className="mt-2 text-xs text-teks-redup">
              Scan membuka chat ke{" "}
              <span className="font-mono text-teks">+{hasilWa.nomor}</span>
            </p>
          ) : (
            <p className="mt-2 text-xs text-teks-redup">
              Nomor luar negeri: tulis dengan kode negara, mis. +60 12-345 6789.
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <label htmlFor="wa-pesan" className="text-sm font-medium">
            Pesan pembuka (opsional)
          </label>
          <span id="wa-pesan-sisa" className="font-mono text-xs text-teks-redup">
            {waPesan.length}/{PANJANG_PESAN_WA_MAKS}
          </span>
        </div>
        <textarea
          id="wa-pesan"
          rows={3}
          maxLength={PANJANG_PESAN_WA_MAKS}
          placeholder="contoh: Halo, saya mau pesan…"
          value={waPesan}
          onChange={(e) => onUbahWaPesan(e.target.value)}
          aria-invalid={galatPesan !== null}
          aria-describedby="wa-pesan-sisa wa-pesan-info"
          className={`${KELAS_INPUT} block resize-y px-3 py-2.5`}
        />
        <div id="wa-pesan-info" aria-live="polite">
          {galatPesan ? (
            <Peringatan tingkat="merah">{galatPesan}</Peringatan>
          ) : hasilWa.ok && hasilWa.peringatan ? (
            <Peringatan tingkat="kuning">{hasilWa.peringatan}</Peringatan>
          ) : (
            <p className="mt-2 text-xs text-teks-redup">
              Sudah terketik di kolom chat pembeli; mereka tinggal menekan Kirim.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
