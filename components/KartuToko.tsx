"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ExternalLink, LoaderCircle, Pencil, QrCode, Trash2 } from "lucide-react";
import { TombolSalin } from "./KartuLink";
import { formatAngka } from "@/lib/analitik";
import { warnaTeksOtomatis } from "@/lib/kontras";
import { hapusToko } from "@/lib/toko";
import type { HasilUbahLink, TokoSaya } from "@/lib/types";
import { alamatToko, hurufDepan } from "@/lib/validasi-toko";

type Props = {
  toko: TokoSaya;
  // Alamat situs, mis. "https://iqro-alpha.vercel.app".
  asal: string;
};

const KELAS_AKSI =
  "inline-flex items-center gap-1.5 rounded-md border border-garis bg-latar px-3 py-2 text-sm font-semibold text-teks hover:border-aksen";
const KELAS_TOMBOL_KEDUA =
  "inline-flex items-center justify-center rounded-md border border-garis bg-permukaan px-4 py-2.5 font-semibold text-teks hover:border-aksen";
const KELAS_TOMBOL_MERAH =
  "inline-flex items-center justify-center gap-2 rounded-md border border-merah bg-merah px-4 py-2.5 font-semibold text-merah-latar hover:opacity-90 disabled:cursor-wait disabled:opacity-70";

const HASIL_AWAL: HasilUbahLink = { status: "awal" };

// Halaman toko milik user di dasbor: lihat, salin, buat QR, ubah, hapus (dengan konfirmasi).
export default function KartuToko({ toko, asal }: Props) {
  const [konfirmasi, setKonfirmasi] = useState(false);
  const alamat = alamatToko(asal, toko.namaUrl);
  const domain = new URL(asal).host;

  return (
    <div className="rounded-md bg-permukaan p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          style={{ backgroundColor: toko.isian.warna }}
          className="grid size-12 shrink-0 place-items-center rounded-md text-xl font-bold"
        >
          <span style={{ color: warnaTeksOtomatis(toko.isian.warna) }}>{hurufDepan(toko.isian.nama)}</span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="min-w-0 break-words text-lg font-bold tracking-tight">{toko.isian.nama}</p>
            {!toko.aktif && (
              <span className="rounded bg-kuning-latar px-2 py-0.5 text-xs font-semibold text-kuning">
                Tidak aktif
              </span>
            )}
          </div>
          {/* <a> biasa (bukan <Link>): Next.js tidak memuat halaman ini diam-diam, jadi kunjungan tidak bertambah sendiri. */}
          <a
            href={alamat}
            target="_blank"
            rel="noopener noreferrer"
            className="break-words text-sm font-semibold text-aksen underline-offset-4 hover:underline"
          >
            {domain}
            <wbr />
            /toko/{toko.namaUrl}
          </a>
          <p className="mt-1 text-sm text-teks-redup">
            Dibuka <span className="font-mono tabular-nums">{formatAngka(toko.jumlahKunjungan)}</span>{" "}
            kali
          </p>
        </div>
      </div>

      {konfirmasi ? (
        <FormHapus onBatal={() => setKonfirmasi(false)} />
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={alamat} target="_blank" rel="noopener noreferrer" className={KELAS_AKSI}>
            <ExternalLink aria-hidden="true" className="size-4" />
            Lihat
          </a>
          <TombolSalin teks={alamat} />
          <Link href={`/?url=${encodeURIComponent(alamat)}`} className={KELAS_AKSI}>
            <QrCode aria-hidden="true" className="size-4" />
            Buat QR halaman ini
          </Link>
          <Link href="/dasbor/toko" className={KELAS_AKSI}>
            <Pencil aria-hidden="true" className="size-4" />
            Ubah
          </Link>
          <button type="button" onClick={() => setKonfirmasi(true)} className={KELAS_AKSI}>
            <Trash2 aria-hidden="true" className="size-4" />
            Hapus
          </button>
        </div>
      )}
    </div>
  );
}

function FormHapus({ onBatal }: { onBatal: () => void }) {
  // Berhasil = dasbor dimuat ulang dari server dan kartu ini hilang sendiri.
  const [hasil, kirim, sedangKirim] = useActionState(() => hapusToko(), HASIL_AWAL);
  const galat = hasil.status === "galat" ? hasil.pesan : null;

  return (
    <form action={kirim} className="mt-4 rounded-md bg-merah-latar p-4 text-merah">
      <p className="font-semibold">Hapus halaman toko?</p>
      <p className="mt-1 text-sm">
        QR yang sudah dicetak atau dibagikan dengan alamat halaman ini akan berhenti bekerja. Isi
        halaman dan jumlah kunjungannya ikut terhapus. Ini tidak bisa dibatalkan.
      </p>
      <div aria-live="polite">{galat && <p className="mt-2 text-sm font-semibold">{galat}</p>}</div>
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
