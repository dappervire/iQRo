import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import FormToko from "@/components/FormToko";
import { KELAS_TAUTAN } from "@/components/KotakAkun";
import { ambilPengguna } from "@/lib/auth";
import { bacaTokoSaya } from "@/lib/data-toko";
import { alamatSitus } from "@/lib/situs";

export const metadata: Metadata = { title: "Halaman toko — iQRo" };

// Membaca login saat ada pengunjung, jadi dibungkus <Suspense>.
async function IsiForm() {
  // proxy.ts sudah mengalihkan tamu, tapi halaman tetap mengecek sendiri.
  const pengguna = await ambilPengguna();
  if (!pengguna) redirect("/masuk?lanjut=/dasbor/toko");

  const hasil = await bacaTokoSaya(pengguna.id);
  if (!hasil.ok) {
    return (
      <section className="mt-6 rounded-md bg-merah-latar p-5 text-merah">
        <p className="font-semibold">Halaman toko belum bisa dimuat.</p>
        <p className="mt-1 text-sm">Ada gangguan sebentar. Muat ulang halaman ini.</p>
      </section>
    );
  }

  const domain = new URL(await alamatSitus()).host;
  const toko = hasil.toko;
  return (
    <>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        {toko ? "Ubah halaman toko" : "Buat halaman toko"}
      </h1>
      <p className="mt-2 mb-6 max-w-prose text-pretty text-teks-redup">
        Satu halaman berisi semua link tokomu: WhatsApp, menu, katalog, media sosial. Cocok untuk
        bio Instagram atau TikTok, dan bisa dijadikan QR.
      </p>
      {toko && !toko.aktif && (
        <div className="mb-4 rounded-md bg-kuning-latar p-4 text-kuning">
          <p className="font-semibold">Halaman ini sedang dinonaktifkan.</p>
          {toko.alasan && <p className="mt-1 text-sm">Alasan: {toko.alasan}</p>}
        </div>
      )}
      <FormToko awal={toko?.isian ?? null} domain={domain} />
    </>
  );
}

export default function HalamanFormToko() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 lg:pb-10">
      <Link href="/dasbor" className={`${KELAS_TAUTAN} inline-flex items-center gap-1 text-sm`}>
        <ChevronLeft aria-hidden="true" className="size-4" />
        Dasbor
      </Link>
      <Suspense fallback={<div aria-hidden="true" className="mt-4 h-96 rounded-md bg-permukaan" />}>
        <IsiForm />
      </Suspense>
    </main>
  );
}
