import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, CornerDownRight } from "lucide-react";
import DaftarPeringkat from "@/components/DaftarPeringkat";
import GrafikHarian from "@/components/GrafikHarian";
import { bacaStatistik, formatAngka, jumlahKlik } from "@/lib/analitik";
import { ambilPengguna } from "@/lib/auth";
import { formatIdBenar, formatTanggal, linkAktif } from "@/lib/dasbor";
import { alamatSitus } from "@/lib/situs";
import { buatKlienServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Statistik link — iQRo" };

type ParamRute = PageProps<"/dasbor/[id]">["params"];

const KELAS_TOMBOL_KEDUA =
  "inline-flex items-center justify-center gap-2 rounded-md border border-garis bg-permukaan px-4 py-2.5 font-semibold text-teks hover:border-aksen";

// Membaca login dan id dari alamat saat ada pengunjung, jadi dibungkus <Suspense>.
async function IsiStatistik({ params }: { params: ParamRute }) {
  const { id } = await params;
  const pengguna = await ambilPengguna();
  if (!pengguna) redirect(`/masuk?lanjut=/dasbor/${encodeURIComponent(id)}`);
  if (!formatIdBenar(id)) notFound();

  const supabase = await buatKlienServer();
  // Kepemilikan dicek di sini (pemilik_id) DAN oleh RLS di database. Link orang lain = "tidak ditemukan".
  const { data: link, error: galatLink } = await supabase
    .from("links")
    .select("id, slug, tujuan, jumlah_klik, dibuat, kedaluwarsa, dinonaktifkan")
    .eq("id", id)
    .eq("pemilik_id", pengguna.id)
    .maybeSingle();
  if (galatLink) console.error("statistik link:", galatLink.code, galatLink.message);
  if (!link && !galatLink) notFound();

  const hasilStatistik = link ? await supabase.rpc("statistik_link", { p_link_id: link.id }) : null;
  if (hasilStatistik?.error) {
    console.error("statistik_link:", hasilStatistik.error.code, hasilStatistik.error.message);
  }
  const statistik = hasilStatistik?.error ? null : bacaStatistik(hasilStatistik?.data);

  if (!link || !statistik) {
    return (
      <section className="mt-6 rounded-md bg-merah-latar p-5 text-merah">
        <p className="font-semibold">Statistik belum bisa dimuat.</p>
        <p className="mt-1 text-sm">Ada gangguan sebentar. Muat ulang halaman ini.</p>
      </section>
    );
  }

  const situs = new URL(await alamatSitus());
  const domain = situs.host;
  const total = Number(link.jumlah_klik) || 0;
  const klik30 = jumlahKlik(statistik.harian);
  const aktif = linkAktif(link.dinonaktifkan, link.kedaluwarsa);

  return (
    <>
      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="min-w-0 break-words text-2xl font-bold tracking-tight">
            <span className="sr-only">Statistik </span>
            {domain}
            <wbr />/{link.slug}
          </h1>
          {!aktif && (
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
        <p className="mt-1 text-sm text-teks-redup">Dibuat {formatTanggal(link.dibuat)}</p>
      </header>

      {total === 0 ? (
        <section className="mt-6 rounded-md bg-permukaan p-5 sm:p-6">
          <h2 className="font-semibold">Belum ada klik</h2>
          <p className="mt-1 max-w-prose text-teks-redup">
            Klik tercatat setiap kali seseorang membuka link ini atau scan QR-nya. Pratinjau link di
            WhatsApp dan robot mesin pencari tidak dihitung.
          </p>
          <Link
            href={`/?url=${encodeURIComponent(`${situs.origin}/${link.slug}`)}`}
            className={`${KELAS_TOMBOL_KEDUA} mt-5`}
          >
            Buat QR dari link ini
          </Link>
        </section>
      ) : (
        <>
          <section className="mt-6 rounded-md bg-permukaan p-5 sm:p-6" aria-labelledby="judul-harian">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
              <div>
                <h2 id="judul-harian" className="font-semibold">
                  Klik 30 hari terakhir
                </h2>
                <p className="mt-1 font-mono text-4xl font-semibold tabular-nums tracking-tight">
                  {formatAngka(klik30)}
                </p>
              </div>
              <p className="text-sm text-teks-redup">
                Sejak dibuat:{" "}
                <span className="font-mono font-semibold tabular-nums text-teks">
                  {formatAngka(total)}
                </span>{" "}
                klik
              </p>
            </div>
            <div className="mt-6">
              <GrafikHarian hari={statistik.harian} />
            </div>
          </section>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DaftarPeringkat
              judul="Asal klik"
              baris={statistik.perujuk}
              pembanding={klik30}
              catatan="Scan QR dan aplikasi chat biasanya tidak mengirim asal, jadi masuk ke “Langsung / scan QR”."
            />
            <DaftarPeringkat judul="Perangkat" baris={statistik.perangkat} pembanding={klik30} />
            <DaftarPeringkat judul="Negara" baris={statistik.negara} pembanding={klik30} />
          </div>
        </>
      )}

      <p className="mt-6 max-w-prose text-xs text-teks-redup">
        Angka per hari memakai jam WIB. iQRo tidak menyimpan alamat IP pengunjung; yang dicatat hanya
        waktu, nama situs asal, jenis perangkat, dan negara.
      </p>
    </>
  );
}

export default function HalamanStatistik({ params }: PageProps<"/dasbor/[id]">) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 lg:pb-10">
      <Link
        href="/dasbor"
        className="-ml-1 inline-flex items-center gap-1 rounded text-sm font-semibold text-aksen underline-offset-4 hover:underline"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Kembali ke dasbor
      </Link>
      <Suspense fallback={<div aria-hidden="true" className="mt-6 h-96 rounded-md bg-permukaan" />}>
        <IsiStatistik params={params} />
      </Suspense>
    </main>
  );
}
