import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ambilPengguna } from "@/lib/auth";

export const metadata: Metadata = { title: "Dasbor — iQRo" };

// Sementara hanya menampilkan akun. Daftar link pendek menyusul di M9.
async function IsiDasbor() {
  // proxy.ts sudah mengalihkan tamu, tapi halaman tetap mengecek sendiri (jangan andalkan satu lapis).
  const pengguna = await ambilPengguna();
  if (!pengguna) redirect("/masuk?lanjut=/dasbor");

  return (
    <>
      <p className="mt-2 break-words text-teks-redup">
        Masuk sebagai <span className="font-semibold text-teks">{pengguna.email}</span>
      </p>
      <section className="mt-6 rounded-md bg-permukaan p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Link pendekmu</h2>
        <p className="mt-2 max-w-prose text-teks-redup">
          Daftar dan pengaturan link pendekmu sedang disiapkan. Sementara itu kamu sudah bisa
          membuat link pendek dan QR-nya.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/pendek"
            className="inline-flex items-center justify-center rounded-md border border-aksen bg-aksen px-4 py-2.5 font-semibold text-teks-di-aksen hover:opacity-90"
          >
            Buat link pendek
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-garis bg-latar px-4 py-2.5 font-semibold text-teks hover:border-aksen"
          >
            Buat QR
          </Link>
        </div>
      </section>
    </>
  );
}

export default function HalamanDasbor() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 lg:pb-10">
      <h1 className="text-2xl font-bold tracking-tight">Dasbor</h1>
      <Suspense fallback={<div aria-hidden="true" className="mt-8 h-44 rounded-md bg-permukaan" />}>
        <IsiDasbor />
      </Suspense>
    </main>
  );
}
