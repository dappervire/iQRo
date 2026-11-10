"use client";

import { useActionState, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  CircleCheck,
  ExternalLink,
  LoaderCircle,
  Plus,
  QrCode,
  Trash2,
} from "lucide-react";
import { PemilihWarna } from "./GayaQr";
import Peringatan from "./Peringatan";
import TampilanToko from "./TampilanToko";
import { rapikanSlug, SLUG_MAKS, SLUG_MIN } from "@/lib/slug";
import { simpanToko } from "@/lib/toko";
import type { HasilSimpanToko, IsianToko, KolomToko } from "@/lib/types";
import {
  DESKRIPSI_MAKS,
  LABEL_MAKS,
  LINK_TOMBOL_MAKS,
  NAMA_TOKO_MAKS,
  TOMBOL_MAKS,
  WARNA_TOKO_AWAL,
  alamatDariNama,
  isiDariIsian,
} from "@/lib/validasi-toko";
import { PANJANG_PESAN_WA_MAKS } from "@/lib/whatsapp";

type Props = {
  // null = belum punya halaman (membuat baru).
  awal: IsianToko | null;
  // Domain situs, mis. "iqro-alpha.vercel.app" atau "localhost:3000".
  domain: string;
};

// id = kunci tetap untuk React saat baris tombol dipindah/dihapus (bukan id database).
type BarisTombol = { id: number; label: string; url: string };

const KELAS_INPUT =
  "w-full rounded-md border border-garis bg-latar px-3 py-2.5 text-base text-teks placeholder:text-teks-redup focus:border-aksen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aksen/30";
const KELAS_INPUT_BARIS = KELAS_INPUT.replace("bg-latar", "bg-permukaan");
const KELAS_TOMBOL_UTAMA =
  "inline-flex items-center justify-center gap-2 rounded-md border border-aksen bg-aksen px-4 py-2.5 font-semibold text-teks-di-aksen hover:opacity-90 disabled:cursor-wait disabled:opacity-70";
const KELAS_TOMBOL_KEDUA =
  "inline-flex items-center justify-center gap-2 rounded-md border border-garis bg-latar px-4 py-2.5 font-semibold text-teks hover:border-aksen disabled:cursor-not-allowed disabled:text-teks-redup disabled:hover:border-garis";
const KELAS_IKON =
  "inline-flex size-10 items-center justify-center rounded-md border border-garis bg-permukaan text-teks hover:border-aksen disabled:cursor-not-allowed disabled:text-teks-redup disabled:hover:border-garis";

const HASIL_AWAL: HasilSimpanToko = { status: "awal" };

function Panel({ judul, id, children }: { judul: string; id: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-md bg-permukaan p-5 sm:p-6">
      <h2 id={id} className="text-lg font-semibold">
        {judul}
      </h2>
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

function Penghitung({ id, isi, maks }: { id: string; isi: string; maks: number }) {
  return (
    <p id={id} className="mt-1 text-right font-mono text-sm tabular-nums text-teks-redup">
      {isi.length}/{maks}
    </p>
  );
}

export default function FormToko({ awal, domain }: Props) {
  const [alamatTersimpan, setAlamatTersimpan] = useState<string | null>(awal?.namaUrl ?? null);
  const [nama, setNama] = useState(awal?.nama ?? "");
  const [namaUrl, setNamaUrl] = useState(awal?.namaUrl ?? "");
  // Halaman baru: alamat mengikuti nama toko sampai kolom alamat diketik sendiri.
  const [alamatDiketik, setAlamatDiketik] = useState(awal !== null);
  const [deskripsi, setDeskripsi] = useState(awal?.deskripsi ?? "");
  const [warna, setWarna] = useState((awal?.warna ?? WARNA_TOKO_AWAL).toLowerCase());
  const [waNomor, setWaNomor] = useState(awal?.waNomor ?? "");
  const [waPesan, setWaPesan] = useState(awal?.waPesan ?? "");
  const [tombol, setTombol] = useState<BarisTombol[]>(() =>
    (awal?.tombol ?? []).map((t, i) => ({ id: i, ...t })),
  );
  const [idBerikut, setIdBerikut] = useState(awal?.tombol.length ?? 0);

  const [hasil, kirim, sedangKirim] = useActionState(
    async (sebelum: HasilSimpanToko, form: FormData) => {
      const baru = await simpanToko(sebelum, form);
      if (baru.status === "berhasil") {
        const alamat = form.get("namaUrl");
        setAlamatTersimpan(typeof alamat === "string" ? rapikanSlug(alamat) : null);
        setAlamatDiketik(true); // sudah tersimpan: alamat tidak lagi ikut berubah saat nama diubah
      }
      return baru;
    },
    HASIL_AWAL,
  );

  const galat = hasil.status === "galat" ? hasil : null;
  const galatDi = (kolom: KolomToko | null, indeks: number | null = null) =>
    galat?.kolom === kolom && galat.indeks === indeks ? galat.pesan : null;

  const isian: IsianToko = { namaUrl, nama, deskripsi, warna, waNomor, waPesan, tombol };
  const alamatBerubah = alamatTersimpan !== null && rapikanSlug(namaUrl) !== alamatTersimpan;

  function ubahNama(nilai: string) {
    setNama(nilai);
    if (!alamatDiketik) setNamaUrl(alamatDariNama(nilai));
  }

  function ubahTombol(id: number, kolom: "label" | "url", nilai: string) {
    setTombol((daftar) => daftar.map((t) => (t.id === id ? { ...t, [kolom]: nilai } : t)));
  }

  function tambahTombol() {
    setTombol((daftar) => [...daftar, { id: idBerikut, label: "", url: "" }]);
    setIdBerikut((n) => n + 1);
  }

  function pindahTombol(indeks: number, arah: -1 | 1) {
    setTombol((daftar) => {
      const tujuan = indeks + arah;
      if (tujuan < 0 || tujuan >= daftar.length) return daftar;
      const baru = [...daftar];
      [baru[indeks], baru[tujuan]] = [baru[tujuan], baru[indeks]];
      return baru;
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
      {/* noValidate: pesan galat dari server kita (bahasa awam), bukan pesan bawaan browser. */}
      <form action={kirim} noValidate className="min-w-0 space-y-4">
        <Panel judul="Toko" id="judul-toko">
          <div>
            <label htmlFor="nama" className="mb-1.5 block text-sm font-medium">
              Nama toko
            </label>
            <input
              id="nama"
              name="nama"
              type="text"
              autoComplete="organization"
              maxLength={NAMA_TOKO_MAKS}
              placeholder="contoh: Kopi Senja"
              value={nama}
              onChange={(e) => ubahNama(e.target.value)}
              aria-invalid={galatDi("nama") !== null}
              aria-describedby="nama-pesan"
              className={KELAS_INPUT}
            />
            <div id="nama-pesan" aria-live="polite">
              {galatDi("nama") && <Peringatan tingkat="merah">{galatDi("nama")}</Peringatan>}
            </div>
          </div>

          <div>
            <label htmlFor="namaUrl" className="mb-1.5 block text-sm font-medium">
              Alamat halaman
            </label>
            <input
              id="namaUrl"
              name="namaUrl"
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={SLUG_MAKS}
              placeholder="contoh: kopi-senja"
              value={namaUrl}
              // Langsung dirapikan saat mengetik: huruf kecil, spasi jadi tanda minus.
              onChange={(e) => {
                setAlamatDiketik(true);
                setNamaUrl(e.target.value.toLowerCase().replace(/\s/g, "-"));
              }}
              aria-invalid={galatDi("namaUrl") !== null}
              aria-describedby="namaUrl-petunjuk namaUrl-pesan"
              className={KELAS_INPUT}
            />
            <div id="namaUrl-petunjuk" className="mt-1.5 space-y-1 text-sm text-teks-redup">
              <p className="break-all">
                Jadinya{" "}
                <span className="font-semibold text-teks">
                  {domain}/toko/{namaUrl}
                </span>
              </p>
              <p>
                Huruf a–z, angka, dan tanda minus, {SLUG_MIN}–{SLUG_MAKS} karakter.
              </p>
            </div>
            <div id="namaUrl-pesan" aria-live="polite">
              {alamatBerubah && (
                <Peringatan tingkat="kuning">
                  Alamat lama (/toko/{alamatTersimpan}) akan berhenti bekerja. QR yang sudah dicetak
                  dengan alamat lama tidak bisa dibuka lagi.
                </Peringatan>
              )}
              {galatDi("namaUrl") && (
                <Peringatan tingkat="merah">{galatDi("namaUrl")}</Peringatan>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="deskripsi" className="mb-1.5 block text-sm font-medium">
              Deskripsi <span className="font-normal text-teks-redup">(opsional)</span>
            </label>
            <textarea
              id="deskripsi"
              name="deskripsi"
              rows={3}
              maxLength={DESKRIPSI_MAKS}
              placeholder="mis. Kopi susu gula aren. Buka setiap hari 08.00–22.00."
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              aria-invalid={galatDi("deskripsi") !== null}
              aria-describedby="deskripsi-hitung deskripsi-pesan"
              className={`${KELAS_INPUT} resize-y`}
            />
            <Penghitung id="deskripsi-hitung" isi={deskripsi} maks={DESKRIPSI_MAKS} />
            <div id="deskripsi-pesan" aria-live="polite">
              {galatDi("deskripsi") && (
                <Peringatan tingkat="merah">{galatDi("deskripsi")}</Peringatan>
              )}
            </div>
          </div>

          <div className="max-w-xs">
            <input type="hidden" name="warna" value={warna} />
            <PemilihWarna
              id="warna"
              label="Warna tema"
              nilai={warna}
              onUbah={setWarna}
              pesanId="warna-pesan"
            />
            <div id="warna-pesan" aria-live="polite">
              {galatDi("warna") && <Peringatan tingkat="merah">{galatDi("warna")}</Peringatan>}
            </div>
          </div>
        </Panel>

        <Panel judul="Tombol WhatsApp" id="judul-wa">
          <p className="-mt-2 text-sm text-teks-redup">
            Opsional. Kosongkan nomornya kalau tidak mau ada tombol WhatsApp.
          </p>
          <div>
            <label htmlFor="waNomor" className="mb-1.5 block text-sm font-medium">
              Nomor WhatsApp
            </label>
            <input
              id="waNomor"
              name="waNomor"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="contoh: 0812-3456-7890"
              value={waNomor}
              onChange={(e) => setWaNomor(e.target.value)}
              aria-invalid={galatDi("waNomor") !== null}
              aria-describedby="waNomor-pesan"
              className={KELAS_INPUT}
            />
            <div id="waNomor-pesan" aria-live="polite">
              {galatDi("waNomor") && <Peringatan tingkat="merah">{galatDi("waNomor")}</Peringatan>}
            </div>
          </div>
          <div>
            <label htmlFor="waPesan" className="mb-1.5 block text-sm font-medium">
              Pesan pembuka <span className="font-normal text-teks-redup">(opsional)</span>
            </label>
            <textarea
              id="waPesan"
              name="waPesan"
              rows={2}
              maxLength={PANJANG_PESAN_WA_MAKS}
              placeholder="mis. Halo, saya mau pesan…"
              value={waPesan}
              onChange={(e) => setWaPesan(e.target.value)}
              aria-invalid={galatDi("waPesan") !== null}
              aria-describedby="waPesan-hitung waPesan-pesan"
              className={`${KELAS_INPUT} resize-y`}
            />
            <Penghitung id="waPesan-hitung" isi={waPesan} maks={PANJANG_PESAN_WA_MAKS} />
            <div id="waPesan-pesan" aria-live="polite">
              {galatDi("waPesan") && <Peringatan tingkat="merah">{galatDi("waPesan")}</Peringatan>}
            </div>
          </div>
        </Panel>

        <Panel judul="Tombol link" id="judul-tombol">
          <p className="-mt-2 text-sm text-teks-redup">
            Sampai {TOMBOL_MAKS} tombol, mis. menu, katalog, Instagram, atau lokasi di peta. Tampil
            berurutan dari atas.
          </p>
          {tombol.length > 0 && (
            <ol className="space-y-3">
              {tombol.map((t, i) => (
                <li key={t.id} className="rounded-md bg-latar p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Tombol {i + 1}</p>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => pindahTombol(i, -1)}
                        disabled={i === 0}
                        aria-label={`Naikkan tombol ${i + 1}`}
                        className={KELAS_IKON}
                      >
                        <ArrowUp aria-hidden="true" className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => pindahTombol(i, 1)}
                        disabled={i === tombol.length - 1}
                        aria-label={`Turunkan tombol ${i + 1}`}
                        className={KELAS_IKON}
                      >
                        <ArrowDown aria-hidden="true" className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTombol((d) => d.filter((x) => x.id !== t.id))}
                        aria-label={`Hapus tombol ${i + 1}`}
                        className={KELAS_IKON}
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                    <div>
                      <label htmlFor={`label-${t.id}`} className="mb-1 block text-sm font-medium">
                        Tulisan
                      </label>
                      <input
                        id={`label-${t.id}`}
                        name="tombolLabel"
                        type="text"
                        autoComplete="off"
                        maxLength={LABEL_MAKS}
                        placeholder="mis. Lihat menu"
                        value={t.label}
                        onChange={(e) => ubahTombol(t.id, "label", e.target.value)}
                        aria-invalid={galatDi("tombol", i) !== null}
                        aria-describedby={`tombol-${t.id}-pesan`}
                        className={KELAS_INPUT_BARIS}
                      />
                    </div>
                    <div>
                      <label htmlFor={`url-${t.id}`} className="mb-1 block text-sm font-medium">
                        Link
                      </label>
                      <input
                        id={`url-${t.id}`}
                        name="tombolUrl"
                        type="url"
                        inputMode="url"
                        autoComplete="off"
                        spellCheck={false}
                        maxLength={LINK_TOMBOL_MAKS}
                        placeholder="mis. tokoku.id/menu"
                        value={t.url}
                        onChange={(e) => ubahTombol(t.id, "url", e.target.value)}
                        aria-invalid={galatDi("tombol", i) !== null}
                        aria-describedby={`tombol-${t.id}-pesan`}
                        className={KELAS_INPUT_BARIS}
                      />
                    </div>
                  </div>
                  <div id={`tombol-${t.id}-pesan`} aria-live="polite">
                    {galatDi("tombol", i) && (
                      <Peringatan tingkat="merah">{galatDi("tombol", i)}</Peringatan>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
          <div aria-live="polite">
            {galatDi("tombol") && <Peringatan tingkat="merah">{galatDi("tombol")}</Peringatan>}
          </div>
          <button
            type="button"
            onClick={tambahTombol}
            disabled={tombol.length >= TOMBOL_MAKS}
            className={KELAS_TOMBOL_KEDUA}
          >
            <Plus aria-hidden="true" className="size-4" />
            {tombol.length >= TOMBOL_MAKS ? `Sudah ${TOMBOL_MAKS} tombol` : "Tambah tombol"}
          </button>
        </Panel>

        <div className="rounded-md bg-permukaan p-5 sm:p-6">
          <div aria-live="polite">
            {galatDi(null) && <Peringatan tingkat="merah">{galatDi(null)}</Peringatan>}
            {hasil.status === "berhasil" && !sedangKirim && <Tersimpan alamat={hasil.alamat} baru={hasil.baru} />}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" disabled={sedangKirim} className={`${KELAS_TOMBOL_UTAMA} w-full sm:w-auto`}>
              {sedangKirim && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
              {sedangKirim ? "Menyimpan…" : alamatTersimpan === null ? "Buat halaman" : "Simpan perubahan"}
            </button>
            <Link href="/dasbor" className={`${KELAS_TOMBOL_KEDUA} w-full sm:w-auto`}>
              Kembali ke dasbor
            </Link>
          </div>
        </div>
      </form>

      <section
        aria-labelledby="judul-preview"
        className="rounded-md bg-permukaan p-5 sm:p-6 lg:sticky lg:top-6"
      >
        <h2 id="judul-preview" className="text-lg font-semibold">
          Preview
        </h2>
        <div className="mt-4 rounded-md bg-latar px-4 py-8">
          <TampilanToko isi={isiDariIsian(isian)} pratinjau />
        </div>
      </section>
    </div>
  );
}

function Tersimpan({ alamat, baru }: { alamat: string; baru: boolean }) {
  return (
    <div role="status" className="mb-2">
      <p className="flex items-center gap-2 font-semibold">
        <CircleCheck aria-hidden="true" className="size-5 shrink-0 text-aksen" />
        {baru ? "Halaman tokomu sudah jadi" : "Perubahan tersimpan"}
      </p>
      <a
        href={alamat}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block break-all font-semibold text-aksen underline-offset-4 hover:underline"
      >
        {alamat.replace(/^https?:\/\//, "")}
      </a>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={alamat} target="_blank" rel="noopener noreferrer" className={KELAS_TOMBOL_KEDUA}>
          <ExternalLink aria-hidden="true" className="size-4" />
          Lihat halaman
        </a>
        <Link href={`/?url=${encodeURIComponent(alamat)}`} className={KELAS_TOMBOL_KEDUA}>
          <QrCode aria-hidden="true" className="size-4" />
          Buat QR halaman ini
        </Link>
      </div>
    </div>
  );
}
