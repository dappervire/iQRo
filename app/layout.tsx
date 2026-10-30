import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import HeaderSitus from "@/components/HeaderSitus";
import { KELAS_TAUTAN } from "@/components/KotakAkun";
import { jakarta, jetbrains } from "@/lib/font";
import "./globals.css";

export const metadata: Metadata = {
  title: "iQRo — QR siap baca, siap cetak",
  description:
    "Buat QR code dari link, dengan logo di tengah dan template siap cetak. Gratis, semua diproses di perangkatmu.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: atribut data-tema dipasang public/tema.js sebelum React jalan.
    <html
      lang="id"
      suppressHydrationWarning
      className={`${jakarta.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <HeaderSitus />
        {children}
        <footer className="mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-2 px-4 pb-8 text-sm">
          <Link href="/privasi" className={KELAS_TAUTAN}>
            Kebijakan Privasi
          </Link>
          <Link href="/laporkan" className={KELAS_TAUTAN}>
            Laporkan link
          </Link>
        </footer>
        <Script src="/tema.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
