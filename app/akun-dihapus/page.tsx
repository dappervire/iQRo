import type { Metadata } from "next";
import Link from "next/link";
import KotakAkun from "@/components/KotakAkun";

export const metadata: Metadata = { title: "Akun dihapus — iQRo" };

// Tujuan setelah hapusAkun (lib/akun.ts) berhasil.
export default function HalamanAkunDihapus() {
  return (
    <KotakAkun
      judul="Akunmu sudah dihapus"
      deskripsi="Akun dan semua link pendekmu sudah dihapus permanen dari iQRo."
    >
      <p className="text-teks-redup">
        Pembuat QR tetap bisa kamu pakai tanpa akun. Kalau suatu saat butuh link pendek lagi,
        daftar saja dengan email yang sama.
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex items-center justify-center rounded-md border border-aksen bg-aksen px-4 py-2.5 font-semibold text-teks-di-aksen hover:opacity-90"
      >
        Buat QR
      </Link>
    </KotakAkun>
  );
}
