import type { Metadata } from "next";
import Script from "next/script";
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
        {children}
        <Script src="/tema.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
