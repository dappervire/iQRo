import type { Metadata } from "next";

export const metadata: Metadata = { title: "Link Pendek — iQRo" };

// Sementara: pengisi supaya menu "Link Pendek" tidak 404. Diganti formulir di M8.
export default function HalamanPendek() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 lg:pb-10">
      <h1 className="text-2xl font-bold tracking-tight">Link Pendek</h1>
      <section className="mt-6 rounded-md bg-permukaan p-5 sm:p-6">
        <p className="max-w-prose text-teks-redup">
          Segera hadir: ubah link panjang jadi pendek dan mudah diketik, lalu buat QR-nya di sini
          juga.
        </p>
      </section>
    </main>
  );
}
