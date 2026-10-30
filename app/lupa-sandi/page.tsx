import type { Metadata } from "next";
import Link from "next/link";
import FormAkun from "@/components/FormAkun";
import KotakAkun, { KELAS_TAUTAN } from "@/components/KotakAkun";
import { lupaSandi } from "@/lib/akun";

export const metadata: Metadata = { title: "Lupa kata sandi — iQRo" };

export default function HalamanLupaSandi() {
  return (
    <KotakAkun
      judul="Lupa kata sandi"
      deskripsi="Tulis email akunmu. Kami kirim link untuk membuat kata sandi baru."
      bawah={
        <p>
          Sudah ingat?{" "}
          <Link href="/masuk" className={KELAS_TAUTAN}>
            Kembali ke Masuk
          </Link>
        </p>
      }
    >
      <FormAkun action={lupaSandi} pakaiEmail sandi={null} tombol="Kirim link" />
    </KotakAkun>
  );
}
