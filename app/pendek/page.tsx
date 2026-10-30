import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import FormLinkPendek from "@/components/FormLinkPendek";
import { KELAS_TAUTAN } from "@/components/KotakAkun";
import { ambilPengguna } from "@/lib/auth";
import { alamatSitus } from "@/lib/situs";

export const metadata: Metadata = { title: "Link Pendek — iQRo" };

const KELAS_PANEL = "mt-6 max-w-2xl rounded-md bg-permukaan p-5 sm:p-6";

// Membaca login dan alamat situs saat ada pengunjung, jadi dibungkus <Suspense>.
async function IsiPendek() {
  // Tamu boleh membuat link acak yang berlaku 30 hari (M11); user dapat link permanen + nama sendiri.
  const pengguna = await ambilPengguna();
  const domain = new URL(await alamatSitus()).host;
  return (
    <>
      <section className={KELAS_PANEL}>
        <FormLinkPendek domain={domain} tamu={!pengguna} />
      </section>
      {!pengguna && (
        <p className="mt-4 max-w-2xl text-sm text-teks-redup">
          Dengan akun (gratis): link permanen, nama link sendiri, tujuan bisa diubah, dan statistik
          klik.{" "}
          <Link href="/daftar" className={KELAS_TAUTAN}>
            Daftar
          </Link>{" "}
          atau{" "}
          <Link href="/masuk?lanjut=/pendek" className={KELAS_TAUTAN}>
            masuk
          </Link>
          .
        </p>
      )}
    </>
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
