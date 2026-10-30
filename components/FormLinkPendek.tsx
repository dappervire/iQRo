"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, CircleCheck, Copy, Link2, LoaderCircle, QrCode } from "lucide-react";
import Peringatan from "./Peringatan";
import { KELAS_TAUTAN } from "./KotakAkun";
import { buatLinkPendek } from "@/lib/link";
import { SLUG_MAKS, SLUG_MIN } from "@/lib/slug";
import type { HasilLinkPendek } from "@/lib/types";

type Props = {
  // Domain situs yang sedang dibuka, mis. "iqro-alpha.vercel.app" atau "localhost:3000".
  domain: string;
};

const KELAS_INPUT =
  "w-full rounded-md border border-garis bg-latar py-2.5 pr-3 text-base text-teks placeholder:text-teks-redup focus:border-aksen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aksen/30";
const KELAS_TOMBOL_UTAMA =
  "flex items-center justify-center gap-2 rounded-md border border-aksen bg-aksen px-4 py-2.5 font-semibold text-teks-di-aksen hover:opacity-90";
const KELAS_TOMBOL_KEDUA =
  "flex items-center justify-center gap-2 rounded-md border border-garis bg-latar px-4 py-2.5 font-semibold text-teks hover:border-aksen";

const HASIL_AWAL: HasilLinkPendek = { status: "awal" };

export default function FormLinkPendek({ domain }: Props) {
  // "putaran" baru = form dipasang ulang dari nol (kolom kosong, hasil kembali ke awal).
  const [putaran, setPutaran] = useState(0);
  return <IsiForm key={putaran} domain={domain} onBaru={() => setPutaran((p) => p + 1)} />;
}

function IsiForm({ domain, onBaru }: Props & { onBaru: () => void }) {
  const [hasil, kirim, sedangKirim] = useActionState(buatLinkPendek, HASIL_AWAL);
  const [tujuan, setTujuan] = useState("");
  const [slug, setSlug] = useState("");

  if (hasil.status === "berhasil") return <HasilLink hasil={hasil} onBaru={onBaru} />;

  const galat = hasil.status === "galat" ? hasil : null;
  const galatDi = (kolom: "tujuan" | "slug" | null) => (galat?.kolom === kolom ? galat.pesan : null);

  return (
    // noValidate: pesan galat dari server kita (bahasa awam), bukan pesan bawaan browser.
    <form action={kirim} noValidate className="space-y-6">
      <div>
        <label htmlFor="tujuan" className="mb-1.5 block text-sm font-medium">
          Link tujuan
        </label>
        <div className="relative">
          <Link2
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teks-redup"
          />
          <input
            id="tujuan"
            name="tujuan"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="contoh: tokoku.id/menu-lengkap"
            value={tujuan}
            onChange={(e) => setTujuan(e.target.value)}
            aria-invalid={galatDi("tujuan") !== null}
            aria-describedby="tujuan-pesan"
            className={`${KELAS_INPUT} pl-9`}
          />
        </div>
        <div id="tujuan-pesan" aria-live="polite">
          {galatDi("tujuan") && <Peringatan tingkat="merah">{galatDi("tujuan")}</Peringatan>}
        </div>
      </div>

      <div>
        <label htmlFor="slug" className="mb-1.5 block text-sm font-medium">
          Nama link <span className="font-normal text-teks-redup">(opsional)</span>
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={SLUG_MAKS}
          placeholder="contoh: menu-kopi"
          value={slug}
          // Langsung dirapikan saat mengetik: huruf kecil, spasi jadi tanda minus.
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s/g, "-"))}
          aria-invalid={galatDi("slug") !== null}
          aria-describedby="slug-petunjuk slug-pesan"
          className={`${KELAS_INPUT} pl-3`}
        />
        <div id="slug-petunjuk" className="mt-1.5 space-y-1 text-sm text-teks-redup">
          <p className="break-all">
            Jadinya{" "}
            <span className="font-semibold text-teks">
              {domain}/{slug}
            </span>
            {slug === "" && <span> (7 karakter acak)</span>}
          </p>
          <p>
            Huruf a–z, angka, dan tanda minus, {SLUG_MIN}–{SLUG_MAKS} karakter. Kosongkan untuk nama
            acak.
          </p>
        </div>
        <div id="slug-pesan" aria-live="polite">
          {galatDi("slug") && <Peringatan tingkat="merah">{galatDi("slug")}</Peringatan>}
        </div>
      </div>

      <div>
        <div aria-live="polite">
          {galatDi(null) && <Peringatan tingkat="merah">{galatDi(null)}</Peringatan>}
        </div>
        <button
          type="submit"
          disabled={sedangKirim}
          className={`${KELAS_TOMBOL_UTAMA} mt-4 w-full disabled:cursor-wait disabled:opacity-70 sm:w-auto`}
        >
          {sedangKirim && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
          {sedangKirim ? "Membuat…" : "Buat link pendek"}
        </button>
      </div>
    </form>
  );
}

type HasilProps = {
  hasil: Extract<HasilLinkPendek, { status: "berhasil" }>;
  onBaru: () => void;
};

function HasilLink({ hasil, onBaru }: HasilProps) {
  const [salin, setSalin] = useState<"siap" | "tersalin" | "gagal">("siap");
  // Domain tanpa "https://", mis. "iqro-alpha.vercel.app".
  const domain = hasil.pendek.replace(/^https?:\/\//, "").slice(0, -(hasil.slug.length + 1));

  async function salinLink() {
    try {
      await navigator.clipboard.writeText(hasil.pendek);
      setSalin("tersalin");
      setTimeout(() => setSalin("siap"), 2000);
    } catch {
      setSalin("gagal");
    }
  }

  return (
    <div>
      <div role="status">
        <p className="flex items-center gap-2 font-semibold">
          <CircleCheck aria-hidden="true" className="size-5 shrink-0 text-aksen" />
          Link pendekmu siap
        </p>
        {/* Tab baru, supaya bisa langsung dicoba tanpa meninggalkan halaman ini. */}
        <a
          href={hasil.pendek}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block break-words text-xl font-bold tracking-tight text-aksen underline-offset-4 hover:underline sm:text-2xl"
        >
          {/* <wbr />: kalau tidak muat satu baris, patah sebelum "/nama", bukan di tengah kata. */}
          {domain}
          <wbr />/{hasil.slug}
        </a>
        <p className="mt-2 break-all text-sm text-teks-redup">Menuju {hasil.tujuan}</p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={salinLink} className={KELAS_TOMBOL_KEDUA}>
          {salin === "tersalin" ? (
            <Check aria-hidden="true" className="size-4" />
          ) : (
            <Copy aria-hidden="true" className="size-4" />
          )}
          {salin === "tersalin" ? "Tersalin" : "Salin link"}
        </button>
        <Link href={`/?url=${encodeURIComponent(hasil.pendek)}`} className={KELAS_TOMBOL_UTAMA}>
          <QrCode aria-hidden="true" className="size-4" />
          Buat QR dari link ini
        </Link>
      </div>
      <div aria-live="polite">
        {salin === "gagal" && (
          <Peringatan tingkat="kuning">
            Tidak bisa menyalin otomatis. Tekan lama link di atas, lalu pilih Salin.
          </Peringatan>
        )}
      </div>

      <button type="button" onClick={onBaru} className={`${KELAS_TAUTAN} mt-6 text-sm`}>
        Buat link pendek lain
      </button>
    </div>
  );
}
