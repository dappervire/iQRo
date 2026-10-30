import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ambilPengguna } from "@/lib/auth";

export const metadata: Metadata = { title: "Dasbor — iQRo" };

// Sementara (M7) hanya menampilkan akun. Daftar link pendek menyusul di M8–M9.
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
          Belum ada link. Membuat dan mengelola link pendek sedang disiapkan; sementara itu kamu
          tetap bisa membuat QR seperti biasa.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center justify-center rounded-md border border-aksen bg-aksen px-4 py-2.5 font-semibold text-teks-di-aksen hover:opacity-90"
        >
          Buat QR
        </Link>
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
