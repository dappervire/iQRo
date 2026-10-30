import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Link tidak aktif — iQRo",
  robots: { index: false },
};

// Tujuan app/[slug]/route.ts kalau link pendek kedaluwarsa atau dinonaktifkan.
export default function HalamanLinkTidakAktif() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-6 lg:pb-10">
      <h1 className="text-2xl font-bold tracking-tight">Link tidak aktif</h1>
      <div className="mt-6 rounded-md bg-permukaan p-5 sm:p-6">
        <p className="text-pretty">
          Link pendek ini sudah kedaluwarsa atau dinonaktifkan, jadi tidak lagi mengarah ke mana
          pun.
        </p>
        <p className="mt-3 text-teks-redup text-pretty">
          Dapat link ini dari toko atau QR? Minta link yang baru ke pemiliknya.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center justify-center rounded-md border border-aksen bg-aksen px-4 py-2.5 font-semibold text-teks-di-aksen hover:opacity-90"
        >
          Buka iQRo
        </Link>
      </div>
    </main>
  );
}
