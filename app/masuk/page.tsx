import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import FormAkun from "@/components/FormAkun";
import KotakAkun, { KELAS_TAUTAN } from "@/components/KotakAkun";
import Peringatan from "@/components/Peringatan";
import { masuk } from "@/lib/akun";
import { jalurAman } from "@/lib/validasi-akun";

export const metadata: Metadata = { title: "Masuk — iQRo" };

type ParamUrl = PageProps<"/masuk">["searchParams"];

function satuNilai(nilai: string | string[] | undefined): string | undefined {
  return Array.isArray(nilai) ? nilai[0] : nilai;
}

// Membaca ?lanjut= dan ?galat= dari alamat halaman, jadi dibungkus <Suspense>.
async function IsiMasuk({ searchParams }: { searchParams: ParamUrl }) {
  const param = await searchParams;
  const lanjut = jalurAman(satuNilai(param.lanjut));
  const linkGagal = satuNilai(param.galat) === "link";

  return (
    <>
      {linkGagal && (
        <div className="-mt-2 mb-5">
          <Peringatan tingkat="merah">
            Link dari email sudah kedaluwarsa atau sudah dipakai. Coba masuk; kalau email belum
            terverifikasi, daftar lagi dengan email yang sama untuk menerima link baru.
          </Peringatan>
        </div>
      )}
      <FormAkun action={masuk} pakaiEmail sandi="lama" tombol="Masuk" lanjut={lanjut} />
    </>
  );
}

export default function HalamanMasuk({ searchParams }: PageProps<"/masuk">) {
  return (
    <KotakAkun
      judul="Masuk"
      deskripsi="Masuk untuk membuat dan mengelola link pendekmu."
      bawah={
        <>
          <p>
            Belum punya akun?{" "}
            <Link href="/daftar" className={KELAS_TAUTAN}>
              Daftar gratis
            </Link>
          </p>
          <p>
            <Link href="/lupa-sandi" className={KELAS_TAUTAN}>
              Lupa kata sandi?
            </Link>
          </p>
        </>
      }
    >
      <Suspense fallback={<div aria-hidden="true" className="h-64" />}>
        <IsiMasuk searchParams={searchParams} />
      </Suspense>
    </KotakAkun>
  );
}
