import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { KELAS_TAUTAN } from "@/components/KotakAkun";
import TampilanToko from "@/components/TampilanToko";
import { cariToko, catatKunjungan } from "@/lib/data-toko";
import { bacaKlik } from "@/lib/klik";

type ParamRute = PageProps<"/toko/[nama]">["params"];

// Judul tab = nama toko. cariToko() memakai cache(), jadi database hanya ditanya sekali.
export async function generateMetadata({ params }: PageProps<"/toko/[nama]">): Promise<Metadata> {
  const hasil = await cariToko((await params).nama);
  if (hasil.status === "aktif") {
    return {
      title: hasil.isi.nama,
      description: hasil.isi.deskripsi || `Halaman ${hasil.isi.nama}, dibuat dengan iQRo.`,
    };
  }
  if (hasil.status === "nonaktif") {
    return { title: "Halaman tidak aktif — iQRo", robots: { index: false } };
  }
  return { title: "iQRo", robots: { index: false } };
}

function Pesan({ judul, children }: { judul: string; children: ReactNode }) {
  return (
    <div className="rounded-md bg-permukaan p-5 sm:p-6">
      <h1 className="text-2xl font-bold tracking-tight">{judul}</h1>
      <div className="mt-3 text-pretty text-teks-redup">{children}</div>
    </div>
  );
}

// Membaca alamat dan header pengunjung saat ada permintaan, jadi dibungkus <Suspense>.
async function IsiHalaman({ params }: { params: ParamRute }) {
  const hasil = await cariToko((await params).nama);

  if (hasil.status === "tidak-ada") notFound();
  if (hasil.status === "gangguan") {
    return (
      <Pesan judul="Halaman belum bisa dibuka">
        Sedang ada gangguan sebentar. Muat ulang halaman ini dalam beberapa saat.
      </Pesan>
    );
  }
  if (hasil.status === "nonaktif") {
    return (
      <Pesan judul="Halaman tidak aktif">
        Halaman toko ini sudah dinonaktifkan, jadi isinya tidak ditampilkan lagi.
      </Pesan>
    );
  }

  // Header dibaca sekarang (tidak boleh di dalam after()). Bot & pratinjau link (mis. WhatsApp)
  // → null → tidak dihitung. Yang disimpan hanya +1, tanpa data pengunjung.
  const kunjungan = bacaKlik(await headers(), "GET");
  if (kunjungan) {
    const id = hasil.id;
    after(() => catatKunjungan(id));
  }

  return <TampilanToko isi={hasil.isi} />;
}

export default function HalamanToko({ params }: PageProps<"/toko/[nama]">) {
  return (
    // data-halaman-toko: header & footer situs iQRo disembunyikan (app/globals.css).
    <main data-halaman-toko="" className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-12 pb-6">
      <Suspense fallback={<div aria-hidden="true" className="h-72 rounded-md bg-permukaan" />}>
        <IsiHalaman params={params} />
      </Suspense>
      <footer className="mt-auto flex flex-wrap justify-center gap-x-6 gap-y-2 pt-16 text-sm">
        <Link href="/" className={KELAS_TAUTAN}>
          Dibuat dengan iQRo
        </Link>
        <Link href="/laporkan" className={KELAS_TAUTAN}>
          Laporkan
        </Link>
      </footer>
    </main>
  );
}
