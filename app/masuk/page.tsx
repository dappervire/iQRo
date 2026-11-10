import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import FormAkun from "@/components/FormAkun";
import KotakAkun, { KELAS_TAUTAN } from "@/components/KotakAkun";
import Peringatan from "@/components/Peringatan";
import TombolGoogle from "@/components/TombolGoogle";
import { masuk } from "@/lib/akun";
import { jalurAman } from "@/lib/validasi-akun";

export const metadata: Metadata = { title: "Masuk — iQRo" };

type ParamUrl = PageProps<"/masuk">["searchParams"];

function satuNilai(nilai: string | string[] | undefined): string | undefined {
  return Array.isArray(nilai) ? nilai[0] : nilai;
}

// Pesan dari /auth/callback kalau "Lanjutkan dengan Google" gagal (?galat=...).
const PESAN_GALAT: Record<string, string> = {
  "google-batal": "Masuk dengan Google dibatalkan. Coba lagi, atau pakai email.",
  google:
    "Masuk dengan Google belum berhasil. Coba lagi dari awal di browser ini, atau pakai email.",
};

// Membaca ?lanjut= dan ?galat= dari alamat halaman, jadi dibungkus <Suspense>.
async function IsiMasuk({ searchParams }: { searchParams: ParamUrl }) {
  const param = await searchParams;
  const lanjut = jalurAman(satuNilai(param.lanjut));
  const galat = PESAN_GALAT[satuNilai(param.galat) ?? ""];

  return (
    <>
      {galat && (
        <div className="-mt-2 mb-5">
          <Peringatan tingkat="merah">{galat}</Peringatan>
        </div>
      )}
      <TombolGoogle lanjut={lanjut} />
      <FormAkun action={masuk} pakaiEmail sandi="lama" tombol="Masuk" tersembunyi={{ lanjut }} />
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
      <Suspense fallback={<div aria-hidden="true" className="h-96" />}>
        <IsiMasuk searchParams={searchParams} />
      </Suspense>
    </KotakAkun>
  );
}
