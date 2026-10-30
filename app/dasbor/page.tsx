import { Suspense } from "react";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import DaftarPeringkat from "@/components/DaftarPeringkat";
import HapusAkun from "@/components/HapusAkun";
import KartuLink from "@/components/KartuLink";
import { KELAS_TAUTAN } from "@/components/KotakAkun";
import { ambilPengguna } from "@/lib/auth";
import {
  CARI_MAKS,
  LINK_PER_HALAMAN,
  alamatDasbor,
  formatTanggal,
  linkAktif,
  nomorHalaman,
  rapikanCari,
} from "@/lib/dasbor";
import { alamatSitus } from "@/lib/situs";
import { buatKlienServer } from "@/lib/supabase/server";
import type { BarisPeringkat, LinkDasbor, Pengguna } from "@/lib/types";

export const metadata: Metadata = { title: "Dasbor — iQRo" };

type ParamUrl = PageProps<"/dasbor">["searchParams"];

const KELAS_TOMBOL_UTAMA =
  "inline-flex items-center justify-center gap-2 rounded-md border border-aksen bg-aksen px-4 py-2.5 font-semibold text-teks-di-aksen hover:opacity-90";
const KELAS_TOMBOL_KEDUA =
  "inline-flex items-center justify-center gap-2 rounded-md border border-garis bg-permukaan px-4 py-2.5 font-semibold text-teks hover:border-aksen";
// PostgREST: halaman yang diminta melewati jumlah data (mis. ?hal=99).
const KODE_LEWAT_BATAS = "PGRST103";
const TERPOPULER_MAKS = 3;

function satuNilai(nilai: string | string[] | undefined): string | undefined {
  return Array.isArray(nilai) ? nilai[0] : nilai;
}

// Membaca login, ?q= dan ?hal= saat ada pengunjung, jadi dibungkus <Suspense>.
async function IsiDasbor({ searchParams }: { searchParams: ParamUrl }) {
  // proxy.ts sudah mengalihkan tamu, tapi halaman tetap mengecek sendiri (jangan andalkan satu lapis).
  const pengguna = await ambilPengguna();
  if (!pengguna) redirect("/masuk?lanjut=/dasbor");

  const param = await searchParams;
  const cari = rapikanCari(satuNilai(param.q));
  const hal = nomorHalaman(satuNilai(param.hal));
  const asal = new URL(await alamatSitus()).origin;

  const supabase = await buatKlienServer();
  const dari = (hal - 1) * LINK_PER_HALAMAN;
  // RLS di database sudah membatasi ke link milik sendiri; filter pemilik_id = lapis kedua.
  let kueri = supabase
    .from("links")
    .select("id, slug, tujuan, dibuat, kedaluwarsa, dinonaktifkan, jumlah_klik", { count: "exact" })
    .eq("pemilik_id", pengguna.id);
  if (cari) kueri = kueri.or(`slug.ilike."%${cari}%",tujuan.ilike."%${cari}%"`);
  // Link terpopuler hanya di halaman 1 tanpa pencarian. Kedua kueri berjalan bersamaan.
  const tampilkanTerpopuler = cari === "" && hal === 1;
  const [{ data, count, error }, terpopuler] = await Promise.all([
    kueri.order("dibuat", { ascending: false }).range(dari, dari + LINK_PER_HALAMAN - 1),
    tampilkanTerpopuler
      ? supabase
          .from("links")
          .select("id, slug, jumlah_klik")
          .eq("pemilik_id", pengguna.id)
          .gt("jumlah_klik", 0)
          .order("jumlah_klik", { ascending: false })
          .limit(TERPOPULER_MAKS)
      : null,
  ]);
  if (terpopuler?.error) {
    console.error("dasbor terpopuler:", terpopuler.error.code, terpopuler.error.message);
  }
  const barisTerpopuler: BarisPeringkat[] = (terpopuler?.data ?? []).map((l) => ({
    label: `/${l.slug}`,
    klik: Number(l.jumlah_klik) || 0,
    href: `/dasbor/${l.id}`,
  }));

  if (error?.code === KODE_LEWAT_BATAS) redirect(alamatDasbor(cari, 1));
  if (error) {
    console.error("dasbor:", error.code, error.message);
    return (
      <>
        <section className="mt-8 rounded-md bg-merah-latar p-5 text-merah">
          <p className="font-semibold">Daftar link belum bisa dimuat.</p>
          <p className="mt-1 text-sm">Ada gangguan sebentar. Muat ulang halaman ini.</p>
        </section>
        <BagianAkun pengguna={pengguna} />
      </>
    );
  }

  const links: LinkDasbor[] = data.map((l) => ({
    id: l.id,
    slug: l.slug,
    tujuan: l.tujuan,
    dibuatTeks: formatTanggal(l.dibuat),
    aktif: linkAktif(l.dinonaktifkan, l.kedaluwarsa),
    jumlahKlik: Number(l.jumlah_klik) || 0,
  }));
  const total = count ?? 0;
  const jumlahHal = Math.max(1, Math.ceil(total / LINK_PER_HALAMAN));
  const belumAdaLink = total === 0 && cari === "";

  return (
    <>
      {barisTerpopuler.length > 0 && (
        <div className="mt-8">
          <DaftarPeringkat
            judul="Paling sering dibuka"
            tingkatJudul="h2"
            baris={barisTerpopuler}
            pembanding={barisTerpopuler[0].klik}
            catatan="Jumlah klik sejak link dibuat. Ketuk nama link untuk melihat statistiknya."
          />
        </div>
      )}

      <section className="mt-8" aria-labelledby="judul-link">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="judul-link" className="text-lg font-semibold">
            Link pendekmu
          </h2>
          {!belumAdaLink && (
            <p className="text-sm text-teks-redup">
              {cari ? "Ditemukan " : ""}
              <span className="font-mono tabular-nums">{total}</span> link
            </p>
          )}
        </div>

        {belumAdaLink ? (
          <div className="mt-3 rounded-md bg-permukaan p-5 sm:p-6">
            <p className="font-semibold">Belum ada link pendek</p>
            <p className="mt-1 max-w-prose text-teks-redup">
              Buat link pendek untuk menu, katalog, atau formulir pesananmu. Tujuannya bisa kamu ubah
              kapan saja, tanpa mencetak ulang QR-nya.
            </p>
            <Link href="/pendek" className={`${KELAS_TOMBOL_UTAMA} mt-5`}>
              <Plus aria-hidden="true" className="size-4" />
              Buat link pendek pertamamu
            </Link>
          </div>
        ) : (
          <>
            {/* GET biasa: pencarian masuk ke alamat (?q=), jadi bisa di-bookmark dan tombol Kembali jalan. */}
            <Form action="/dasbor" role="search" className="mt-3 flex gap-2">
              <label htmlFor="cari" className="sr-only">
                Cari link
              </label>
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teks-redup"
                />
                <input
                  id="cari"
                  name="q"
                  type="search"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={CARI_MAKS}
                  placeholder="Cari nama link atau tujuan"
                  defaultValue={cari}
                  className="w-full rounded-md border border-garis bg-permukaan py-2.5 pl-9 pr-3 text-base text-teks placeholder:text-teks-redup focus:border-aksen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aksen/30"
                />
              </div>
              <button type="submit" className={KELAS_TOMBOL_KEDUA}>
                Cari
              </button>
            </Form>

            {links.length === 0 ? (
              <div className="mt-3 rounded-md bg-permukaan p-5">
                <p>
                  Tidak ada link yang cocok dengan{" "}
                  <span className="break-all font-semibold">&ldquo;{cari}&rdquo;</span>.
                </p>
                <Link href="/dasbor" className={`${KELAS_TAUTAN} mt-3 inline-block text-sm`}>
                  Tampilkan semua link
                </Link>
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <KartuLink key={link.id} link={link} asal={asal} />
                ))}
              </ul>
            )}

            {jumlahHal > 1 && (
              <nav
                aria-label="Halaman daftar link"
                className="mt-4 flex items-center justify-between gap-3"
              >
                {hal > 1 ? (
                  <Link href={alamatDasbor(cari, hal - 1)} className={KELAS_TOMBOL_KEDUA}>
                    <ChevronLeft aria-hidden="true" className="size-4" />
                    Sebelumnya
                  </Link>
                ) : (
                  <span />
                )}
                <p className="text-sm text-teks-redup">
                  Halaman{" "}
                  <span className="font-mono tabular-nums">
                    {hal} / {jumlahHal}
                  </span>
                </p>
                {hal < jumlahHal ? (
                  <Link href={alamatDasbor(cari, hal + 1)} className={KELAS_TOMBOL_KEDUA}>
                    Berikutnya
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
      </section>

      <BagianAkun pengguna={pengguna} />
    </>
  );
}

function BagianAkun({ pengguna }: { pengguna: Pengguna }) {
  return (
    <section className="mt-12 rounded-md bg-permukaan p-5 sm:p-6" aria-labelledby="judul-akun">
      <h2 id="judul-akun" className="text-lg font-semibold">
        Akun
      </h2>
      <p className="mt-2 break-words text-teks-redup">
        Masuk sebagai <span className="font-semibold text-teks">{pengguna.email}</span>
      </p>
      <div className="mt-5">
        <HapusAkun email={pengguna.email} />
      </div>
    </section>
  );
}

export default function HalamanDasbor({ searchParams }: PageProps<"/dasbor">) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 lg:pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Dasbor</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/pendek" className={KELAS_TOMBOL_UTAMA}>
            <Plus aria-hidden="true" className="size-4" />
            Buat link pendek
          </Link>
          <Link href="/" className={KELAS_TOMBOL_KEDUA}>
            Buat QR
          </Link>
        </div>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="mt-8 h-72 rounded-md bg-permukaan" />}>
        <IsiDasbor searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
