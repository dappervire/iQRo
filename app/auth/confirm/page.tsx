import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import FormAkun from "@/components/FormAkun";
import KotakAkun, { KELAS_TAUTAN } from "@/components/KotakAkun";
import { konfirmasiEmail } from "@/lib/akun";

export const metadata: Metadata = { title: "Konfirmasi — iQRo" };

// Tujuan link di email Supabase (format diatur di Supabase → Emails → Templates):
//   daftar      → /auth/confirm?token_hash=...&type=email
//   lupa sandi  → /auth/confirm?token_hash=...&type=recovery
// Membuka halaman ini belum memverifikasi apa pun; verifikasi baru terjadi saat tombol ditekan.

type ParamUrl = PageProps<"/auth/confirm">["searchParams"];

function satuNilai(nilai: string | string[] | undefined): string {
  return (Array.isArray(nilai) ? nilai[0] : nilai) ?? "";
}

async function IsiKonfirmasi({ searchParams }: { searchParams: ParamUrl }) {
  const param = await searchParams;
  const tokenHash = satuNilai(param.token_hash);
  const jenis = satuNilai(param.type);

  if (!tokenHash || !["email", "signup", "recovery"].includes(jenis)) {
    return (
      <KotakAkun judul="Link tidak valid" deskripsi="Link ini tidak lengkap atau salah salin.">
        <p>
          Buka lagi link dari emailmu, atau{" "}
          <Link href="/masuk" className={KELAS_TAUTAN}>
            coba masuk
          </Link>
          .
        </p>
      </KotakAkun>
    );
  }

  const gantiSandi = jenis === "recovery";
  return (
    <KotakAkun
      judul={gantiSandi ? "Ganti kata sandi" : "Aktifkan akun"}
      deskripsi={
        gantiSandi
          ? "Tekan tombol di bawah untuk lanjut membuat kata sandi baru."
          : "Satu langkah lagi. Tekan tombol di bawah untuk mengaktifkan akun iQRo-mu."
      }
    >
      <FormAkun
        action={konfirmasiEmail}
        pakaiEmail={false}
        sandi={null}
        tombol={gantiSandi ? "Lanjut ganti kata sandi" : "Aktifkan akun"}
        tersembunyi={{ token_hash: tokenHash, type: jenis }}
      />
    </KotakAkun>
  );
}

export default function HalamanKonfirmasi({ searchParams }: PageProps<"/auth/confirm">) {
  return (
    <Suspense fallback={<main aria-hidden="true" className="min-h-96" />}>
      <IsiKonfirmasi searchParams={searchParams} />
    </Suspense>
  );
}
