"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, Copy, CornerDownRight, LoaderCircle, Pencil, QrCode, Trash2 } from "lucide-react";
import Peringatan from "./Peringatan";
import { hapusLink, ubahTujuan } from "@/lib/link";
import type { HasilUbahLink, LinkDasbor } from "@/lib/types";

type Props = {
  link: LinkDasbor;
  // Alamat situs, mis. "https://iqro-alpha.vercel.app". Link pendek = asal + "/" + slug.
  asal: string;
};

type Mode = "lihat" | "ubah" | "hapus";

const KELAS_AKSI =
  "inline-flex items-center gap-1.5 rounded-md border border-garis bg-latar px-3 py-2 text-sm font-semibold text-teks hover:border-aksen";
const KELAS_INPUT =
  "w-full rounded-md border border-garis bg-permukaan px-3 py-2.5 text-base text-teks placeholder:text-teks-redup focus:border-aksen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aksen/30";
const KELAS_TOMBOL_UTAMA =
  "inline-flex items-center justify-center gap-2 rounded-md border border-aksen bg-aksen px-4 py-2.5 font-semibold text-teks-di-aksen hover:opacity-90 disabled:cursor-wait disabled:opacity-70";
const KELAS_TOMBOL_KEDUA =
  "inline-flex items-center justify-center rounded-md border border-garis bg-permukaan px-4 py-2.5 font-semibold text-teks hover:border-aksen";
const KELAS_TOMBOL_MERAH =
  "inline-flex items-center justify-center gap-2 rounded-md border border-merah bg-merah px-4 py-2.5 font-semibold text-merah-latar hover:opacity-90 disabled:cursor-wait disabled:opacity-70";

const HASIL_AWAL: HasilUbahLink = { status: "awal" };

// Satu link di daftar dasbor: tampil, salin, ubah tujuan, hapus (dengan konfirmasi).
export default function KartuLink({ link, asal }: Props) {
  const [mode, setMode] = useState<Mode>("lihat");
  const pendek = `${asal}/${link.slug}`;
  const domain = new URL(asal).host;

  return (
    <li className="rounded-md bg-permukaan p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <a
          href={pendek}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 break-words text-lg font-bold tracking-tight text-aksen underline-offset-4 hover:underline"
        >
          {domain}
          <wbr />/{link.slug}
        </a>
        {!link.aktif && (
          <span className="rounded bg-kuning-latar px-2 py-0.5 text-xs font-semibold text-kuning">
            Tidak aktif
          </span>
        )}
      </div>
      <p className="mt-1 flex items-start gap-1.5 text-sm text-teks-redup">
        <CornerDownRight aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span className="sr-only">Menuju </span>
        <span className="line-clamp-2 break-all" title={link.tujuan}>
          {link.tujuan}
        </span>
      </p>
      <p className="mt-1 text-sm text-teks-redup">Dibuat {link.dibuatTeks}</p>

      {mode === "lihat" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <TombolSalin teks={pendek} />
          <Link href={`/?url=${encodeURIComponent(pendek)}`} className={KELAS_AKSI}>
            <QrCode aria-hidden="true" className="size-4" />
            Buat QR
          </Link>
          <button type="button" onClick={() => setMode("ubah")} className={KELAS_AKSI}>
            <Pencil aria-hidden="true" className="size-4" />
            Ubah tujuan
          </button>
          <button type="button" onClick={() => setMode("hapus")} className={KELAS_AKSI}>
            <Trash2 aria-hidden="true" className="size-4" />
            Hapus
          </button>
        </div>
      )}
      {mode === "ubah" && <FormUbah link={link} onSelesai={() => setMode("lihat")} />}
      {mode === "hapus" && <FormHapus link={link} onBatal={() => setMode("lihat")} />}
    </li>
  );
}

function TombolSalin({ teks }: { teks: string }) {
  const [status, setStatus] = useState<"siap" | "tersalin" | "gagal">("siap");

  async function salin() {
    try {
      await navigator.clipboard.writeText(teks);
      setStatus("tersalin");
      setTimeout(() => setStatus("siap"), 2000);
    } catch {
      setStatus("gagal");
    }
  }

  return (
    <button
      type="button"
      onClick={salin}
      // Gagal = browser menolak akses papan klip; link di atas tetap bisa ditekan lama lalu disalin.
      title={status === "gagal" ? "Tekan lama link di atas, lalu pilih Salin" : undefined}
      className={KELAS_AKSI}
    >
      {status === "tersalin" ? (
        <Check aria-hidden="true" className="size-4" />
      ) : (
        <Copy aria-hidden="true" className="size-4" />
      )}
      <span aria-live="polite">
        {status === "tersalin" ? "Tersalin" : status === "gagal" ? "Gagal menyalin" : "Salin"}
      </span>
    </button>
  );
}

function FormUbah({ link, onSelesai }: { link: LinkDasbor; onSelesai: () => void }) {
  // Dibungkus supaya form tertutup sendiri begitu tujuan berhasil diubah.
  const [hasil, kirim, sedangKirim] = useActionState(
    async (sebelum: HasilUbahLink, form: FormData) => {
      const baru = await ubahTujuan(sebelum, form);
      if (baru.status === "berhasil") onSelesai();
      return baru;
    },
    HASIL_AWAL,
  );
  const [tujuan, setTujuan] = useState(link.tujuan);
  const idInput = `tujuan-${link.id}`;
  const galat = hasil.status === "galat" ? hasil.pesan : null;

  return (
    <form action={kirim} noValidate className="mt-4 rounded-md bg-latar p-4">
      <input type="hidden" name="id" value={link.id} />
      <label htmlFor={idInput} className="mb-1.5 block text-sm font-medium">
        Link tujuan baru
      </label>
      <input
        id={idInput}
        name="tujuan"
        type="url"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        autoFocus
        value={tujuan}
        onChange={(e) => setTujuan(e.target.value)}
        aria-invalid={galat !== null}
        aria-describedby={`${idInput}-petunjuk ${idInput}-pesan`}
        className={KELAS_INPUT}
      />
      <p id={`${idInput}-petunjuk`} className="mt-1.5 text-sm text-teks-redup">
        Nama link tetap sama, jadi QR yang sudah dicetak langsung menuju link baru ini.
      </p>
      <div id={`${idInput}-pesan`} aria-live="polite">
        {galat && <Peringatan tingkat="merah">{galat}</Peringatan>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" disabled={sedangKirim} className={KELAS_TOMBOL_UTAMA}>
          {sedangKirim && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
          {sedangKirim ? "Menyimpan…" : "Simpan"}
        </button>
        <button type="button" onClick={onSelesai} className={KELAS_TOMBOL_KEDUA}>
          Batal
        </button>
      </div>
    </form>
  );
}

function FormHapus({ link, onBatal }: { link: LinkDasbor; onBatal: () => void }) {
  // Berhasil = daftar dimuat ulang dari server dan kartu ini hilang sendiri.
  const [hasil, kirim, sedangKirim] = useActionState(hapusLink, HASIL_AWAL);
  const galat = hasil.status === "galat" ? hasil.pesan : null;

  return (
    <form action={kirim} className="mt-4 rounded-md bg-merah-latar p-4 text-merah">
      <input type="hidden" name="id" value={link.id} />
      <p className="font-semibold">Hapus link /{link.slug}?</p>
      <p className="mt-1 text-sm">
        QR yang sudah dicetak atau dibagikan dengan link ini akan berhenti bekerja. Ini tidak bisa
        dibatalkan.
      </p>
      <div aria-live="polite">
        {galat && <p className="mt-2 text-sm font-semibold">{galat}</p>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" disabled={sedangKirim} className={KELAS_TOMBOL_MERAH}>
          {sedangKirim && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
          {sedangKirim ? "Menghapus…" : "Ya, hapus"}
        </button>
        <button type="button" onClick={onBatal} autoFocus className={KELAS_TOMBOL_KEDUA}>
          Batal
        </button>
      </div>
    </form>
  );
}
