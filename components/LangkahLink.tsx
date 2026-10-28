import { Link2 } from "lucide-react";
import Peringatan from "./Peringatan";

type Props = {
  url: string;
  error: string | null;
  peringatan: string | null;
  onUbah: (url: string) => void;
};

export default function LangkahLink({ url, error, peringatan, onUbah }: Props) {
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
          className="w-full rounded-md border border-garis bg-latar py-2.5 pl-9 pr-3 text-base text-teks placeholder:text-teks-redup focus:border-aksen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aksen/30"
        />
      </div>
      <div id="link-pesan" aria-live="polite">
        {error && <Peringatan tingkat="merah">{error}</Peringatan>}
        {peringatan && <Peringatan tingkat="kuning">{peringatan}</Peringatan>}
      </div>
    </div>
  );
}
