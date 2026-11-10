"use client";

import { useActionState, useState } from "react";
import { CircleCheck, LoaderCircle } from "lucide-react";
import Peringatan from "./Peringatan";
import { KELAS_TAUTAN } from "./KotakAkun";
import { kirimLaporan } from "@/lib/laporan";
import type { HasilLaporan, KolomLaporan } from "@/lib/types";
import { ALASAN_LAPORAN, KETERANGAN_MAKS, LINK_MAKS } from "@/lib/validasi-laporan";

type Props = {
  // Contoh link di placeholder, mis. "iqro-alpha.vercel.app".
  domain: string;
};

const KELAS_INPUT =
  "w-full rounded-md border border-garis bg-latar px-3 py-2.5 text-base text-teks placeholder:text-teks-redup focus:border-aksen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aksen/30";

const HASIL_AWAL: HasilLaporan = { status: "awal" };

export default function FormLaporan({ domain }: Props) {
  // "putaran" baru = form dipasang ulang dari nol, untuk melaporkan link lain.
  const [putaran, setPutaran] = useState(0);
  return <IsiForm key={putaran} domain={domain} onBaru={() => setPutaran((p) => p + 1)} />;
}

function IsiForm({ domain, onBaru }: Props & { onBaru: () => void }) {
  const [hasil, kirim, sedangKirim] = useActionState(kirimLaporan, HASIL_AWAL);
  const [link, setLink] = useState("");
  const [alasan, setAlasan] = useState("");
  const [keterangan, setKeterangan] = useState("");

  if (hasil.status === "terkirim") {
    return (
      <div role="status">
        <p className="flex items-center gap-2 font-semibold">
          <CircleCheck aria-hidden="true" className="size-5 shrink-0 text-aksen" />
          Laporan terkirim. Terima kasih!
        </p>
        <p className="mt-2 max-w-prose text-teks-redup">
          Kami periksa secepatnya. Link yang terbukti berbahaya akan dinonaktifkan, jadi tidak bisa
          dibuka lagi oleh siapa pun.
        </p>
        <button type="button" onClick={onBaru} className={`${KELAS_TAUTAN} mt-5 text-sm`}>
          Laporkan link lain
        </button>
      </div>
    );
  }

  const galat = hasil.status === "galat" ? hasil : null;
  const galatDi = (kolom: KolomLaporan | null) => (galat?.kolom === kolom ? galat.pesan : null);

  return (
    // noValidate: pesan galat dari server kita (bahasa awam), bukan pesan bawaan browser.
    <form action={kirim} noValidate className="space-y-6">
      <div>
        <label htmlFor="link" className="mb-1.5 block text-sm font-medium">
          Link pendek atau halaman toko yang mencurigakan
        </label>
        <input
          id="link"
          name="link"
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={LINK_MAKS}
          placeholder={`contoh: ${domain}/abc1234`}
          value={link}
          onChange={(e) => setLink(e.target.value)}
          aria-invalid={galatDi("link") !== null}
          aria-describedby="link-pesan"
          className={KELAS_INPUT}
        />
        <div id="link-pesan" aria-live="polite">
          {galatDi("link") && <Peringatan tingkat="merah">{galatDi("link")}</Peringatan>}
        </div>
      </div>

      <fieldset aria-describedby="alasan-pesan">
        <legend className="mb-1.5 text-sm font-medium">Alasan</legend>
        <div className="space-y-2">
          {ALASAN_LAPORAN.map((a) => (
            <label
              key={a.id}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-garis bg-latar px-3 py-2.5 hover:border-aksen has-checked:border-aksen has-focus-visible:ring-2 has-focus-visible:ring-aksen/30"
            >
              <input
                type="radio"
                name="alasan"
                value={a.id}
                checked={alasan === a.id}
                onChange={() => setAlasan(a.id)}
                className="mt-1 size-4 shrink-0 accent-aksen focus-visible:outline-none"
              />
              <span>{a.label}</span>
            </label>
          ))}
        </div>
        <div id="alasan-pesan" aria-live="polite">
          {galatDi("alasan") && <Peringatan tingkat="merah">{galatDi("alasan")}</Peringatan>}
        </div>
      </fieldset>

      <div>
        <label htmlFor="keterangan" className="mb-1.5 block text-sm font-medium">
          Keterangan <span className="font-normal text-teks-redup">(opsional)</span>
        </label>
        <textarea
          id="keterangan"
          name="keterangan"
          rows={4}
          maxLength={KETERANGAN_MAKS}
          placeholder="mis. di mana kamu menemukan link ini, dan apa yang terjadi saat dibuka"
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          aria-invalid={galatDi("keterangan") !== null}
          aria-describedby="keterangan-hitung keterangan-pesan"
          className={`${KELAS_INPUT} resize-y`}
        />
        <p id="keterangan-hitung" className="mt-1 text-right font-mono text-sm tabular-nums text-teks-redup">
          {keterangan.length}/{KETERANGAN_MAKS}
        </p>
        <div id="keterangan-pesan" aria-live="polite">
          {galatDi("keterangan") && (
            <Peringatan tingkat="merah">{galatDi("keterangan")}</Peringatan>
          )}
        </div>
      </div>

      <div>
        <div aria-live="polite">
          {galatDi(null) && <Peringatan tingkat="merah">{galatDi(null)}</Peringatan>}
        </div>
        <button
          type="submit"
          disabled={sedangKirim}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-aksen bg-aksen px-4 py-2.5 font-semibold text-teks-di-aksen hover:opacity-90 disabled:cursor-wait disabled:opacity-70 sm:w-auto"
        >
          {sedangKirim && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
          {sedangKirim ? "Mengirim…" : "Kirim laporan"}
        </button>
      </div>
    </form>
  );
}
