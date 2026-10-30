import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import FormLinkPendek from "@/components/FormLinkPendek";
import { ambilPengguna } from "@/lib/auth";
import { alamatSitus } from "@/lib/situs";

export const metadata: Metadata = { title: "Link Pendek — iQRo" };

const KELAS_PANEL = "mt-6 max-w-2xl rounded-md bg-permukaan p-5 sm:p-6";

// Membaca login dan alamat situs saat ada pengunjung, jadi dibungkus <Suspense>.
async function IsiPendek() {
  // M8: khusus user. Tamu (M11) nanti boleh membuat link otomatis yang berlaku 30 hari.
  const pengguna = await ambilPengguna();
  if (!pengguna) {
    return (
      <section className={KELAS_PANEL}>
        <h2 className="text-lg font-semibold">Masuk dulu, gratis</h2>
        <p className="mt-2 max-w-prose text-teks-redup">
          Link pendek disimpan di akunmu, supaya bisa kamu kelola dan tetap jalan selama QR-nya
          masih tertempel.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/masuk?lanjut=/pendek"
            className="inline-flex items-center justify-center rounded-md border border-aksen bg-aksen px-4 py-2.5 font-semibold text-teks-di-aksen hover:opacity-90"
          >
            Masuk
          </Link>
          <Link
            href="/daftar"
            className="inline-flex items-center justify-center rounded-md border border-garis bg-latar px-4 py-2.5 font-semibold text-teks hover:border-aksen"
          >
            Daftar
          </Link>
        </div>
      </section>
    );
  }

  const domain = new URL(await alamatSitus()).host;
  return (
    <section className={KELAS_PANEL}>
      <FormLinkPendek domain={domain} />
    </section>
  );
}

export default function HalamanPendek() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 lg:pb-10">
      <h1 className="text-2xl font-bold tracking-tight">Link Pendek</h1>
      <p className="mt-2 max-w-prose text-teks-redup text-pretty">
        Ubah link panjang jadi pendek dan mudah diketik. QR dari link pendek juga lebih renggang,
        jadi lebih cepat di-scan.
      </p>
      <Suspense fallback={<div aria-hidden="true" className={`${KELAS_PANEL} h-72`} />}>
        <IsiPendek />
      </Suspense>
    </main>
  );
}
