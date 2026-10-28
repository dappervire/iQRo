import type { Metadata } from "next";
import { jakarta, jetbrains } from "@/lib/font";
import "./globals.css";

export const metadata: Metadata = {
  title: "iQRo — QR siap baca, siap cetak",
  description:
    "Buat QR code dari link, dengan logo di tengah dan template siap cetak. Gratis, semua diproses di perangkatmu.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
