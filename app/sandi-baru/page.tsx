import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import FormAkun from "@/components/FormAkun";
import KotakAkun, { KELAS_TAUTAN } from "@/components/KotakAkun";
import { gantiSandi } from "@/lib/akun";
import { ambilPengguna } from "@/lib/auth";

export const metadata: Metadata = { title: "Kata sandi baru — iQRo" };

// Halaman ini dibuka dari link "lupa sandi" di email: /auth/confirm sudah memasukkan pengguna.
async function IsiSandiBaru() {
  const pengguna = await ambilPengguna();

  if (!pengguna) {
    return (
      <p>
        Link untuk mengganti kata sandi sudah kedaluwarsa atau belum dibuka dari email.{" "}
        <Link href="/lupa-sandi" className={KELAS_TAUTAN}>
          Minta link baru
        </Link>
      </p>
    );
  }

  return (
    <>
      <p className="mb-5 break-words text-sm text-teks-redup">
        Untuk akun <span className="font-semibold text-teks">{pengguna.email}</span>
      </p>
      <FormAkun action={gantiSandi} pakaiEmail={false} sandi="baru" tombol="Simpan kata sandi" />
    </>
  );
}

export default function HalamanSandiBaru() {
  return (
    <KotakAkun
      judul="Buat kata sandi baru"
      deskripsi="Pakai kata sandi yang tidak kamu pakai di situs lain."
    >
      <Suspense fallback={<div aria-hidden="true" className="h-40" />}>
        <IsiSandiBaru />
      </Suspense>
    </KotakAkun>
  );
}
