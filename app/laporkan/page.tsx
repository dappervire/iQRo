import type { Metadata } from "next";
import FormLaporan from "@/components/FormLaporan";
import { DOMAIN_UTAMA } from "@/lib/situs";

export const metadata: Metadata = {
  title: "Laporkan link — iQRo",
  description: "Laporkan link pendek iQRo yang dipakai untuk penipuan, virus, atau spam.",
};

export default function HalamanLaporkan() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 lg:pb-10">
      <h1 className="text-2xl font-bold tracking-tight">Laporkan link</h1>
      <p className="mt-2 max-w-prose text-teks-redup text-pretty">
        Menemukan link pendek atau halaman toko iQRo yang menipu, menyebarkan virus, atau spam?
        Laporkan di sini, tanpa perlu akun. Kami tidak mencatat nama atau emailmu.
      </p>
      <section className="mt-6 max-w-2xl rounded-md bg-permukaan p-5 sm:p-6">
        <FormLaporan domain={DOMAIN_UTAMA} />
      </section>
    </main>
  );
}
