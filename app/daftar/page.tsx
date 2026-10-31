import type { Metadata } from "next";
import Link from "next/link";
import FormAkun from "@/components/FormAkun";
import KotakAkun, { KELAS_TAUTAN } from "@/components/KotakAkun";
import { daftar } from "@/lib/akun";

export const metadata: Metadata = { title: "Daftar — iQRo" };

export default function HalamanDaftar() {
  return (
    <KotakAkun
      judul="Buat akun"
      deskripsi="Gratis. Dengan akun, link pendekmu permanen dan bisa diubah kapan saja."
      bawah={
        <>
          <p>
            Sudah punya akun?{" "}
            <Link href="/masuk" className={KELAS_TAUTAN}>
              Masuk
            </Link>
          </p>
          <p className="text-teks-redup">
            Dengan mendaftar, kamu menyetujui{" "}
            <Link href="/privasi" className={KELAS_TAUTAN}>
              Kebijakan Privasi
            </Link>{" "}
            iQRo.
          </p>
        </>
      }
    >
      <FormAkun action={daftar} pakaiEmail sandi="baru" tombol="Daftar" />
    </KotakAkun>
  );
}
