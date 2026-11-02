import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import FormAkun from "@/components/FormAkun";
import KotakAkun, { KELAS_TAUTAN } from "@/components/KotakAkun";
import { konfirmasiEmail, tukarKodeEmail } from "@/lib/akun";

export const metadata: Metadata = { title: "Konfirmasi — iQRo" };

// Tujuan link di email Supabase. Ada dua bentuk:
// 1. Email BAWAAN Supabase (sekarang; paket gratis tanpa SMTP sendiri tidak bisa mengubah template):
//    Supabase memverifikasi email dulu, lalu membuka /auth/confirm?code=... (atau ?error_code=... kalau gagal).
// 2. Template sendiri (kalau nanti pakai SMTP sendiri):
//    /auth/confirm?token_hash=...&type=email|recovery
// Membuka halaman ini tidak memverifikasi/menukar apa pun; itu baru terjadi saat tombol ditekan.

type ParamUrl = PageProps<"/auth/confirm">["searchParams"];

const KELAS_TOMBOL =
  "mt-5 inline-flex items-center justify-center rounded-md border border-aksen bg-aksen px-4 py-2.5 font-semibold text-teks-di-aksen hover:opacity-90";

function satuNilai(nilai: string | string[] | undefined): string {
  return (Array.isArray(nilai) ? nilai[0] : nilai) ?? "";
}

async function IsiKonfirmasi({ searchParams }: { searchParams: ParamUrl }) {
  const param = await searchParams;
  const tokenHash = satuNilai(param.token_hash);
  const jenis = satuNilai(param.type);
  const kode = satuNilai(param.code);
  const galat = satuNilai(param.error_code) || satuNilai(param.error);
  const untukSandi = satuNilai(param.untuk) === "sandi";

  if (tokenHash && ["email", "signup", "recovery"].includes(jenis)) {
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

  if (kode) {
    // Kunci pasangan kode ini disimpan di cookie browser yang tadi mendaftar / meminta ganti sandi.
    // Tidak ada (mis. daftar di laptop, link dibuka di HP) → email tetap sudah terverifikasi, tinggal masuk.
    const toko = await cookies();
    const browserYangSama = toko
      .getAll()
      .some(({ name }) => name.startsWith("sb-") && name.includes("-code-verifier"));

    if (browserYangSama) {
      return (
        <KotakAkun judul="Email terverifikasi" deskripsi="Satu langkah lagi, tekan tombol di bawah.">
          <FormAkun
            action={tukarKodeEmail}
            pakaiEmail={false}
            sandi={null}
            tombol="Lanjutkan"
            tersembunyi={{ code: kode }}
          />
        </KotakAkun>
      );
    }

    if (untukSandi) {
      // Mis. minta ganti sandi di Chrome, link terbuka di aplikasi Gmail / profil lain / perangkat lain.
      // Link di email sudah terpakai, tapi kode di alamat halaman ini belum: kalau alamat ini dibuka
      // di browser peminta dalam beberapa menit, tombol "Lanjutkan" di atas akan muncul di sana.
      return (
        <KotakAkun
          judul="Buka di browser yang sama"
          deskripsi="Link ganti kata sandi hanya berfungsi di browser tempat kamu memintanya."
        >
          <p>
            Masih di perangkat yang sama? Segera pindahkan halaman ini ke browser tempat kamu
            menekan Kirim:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Di HP (terbuka di dalam aplikasi Gmail): tekan titik tiga (⋮) atau ikon browser di
              pojok, lalu pilih &quot;Buka di Chrome&quot; atau nama browsermu.
            </li>
            <li>
              Di laptop: salin alamat halaman ini, lalu tempel di browser atau profil tempat kamu
              memintanya.
            </li>
          </ul>
          <p className="mt-3">
            Beda perangkat, atau sudah lewat beberapa menit? Minta link baru dari perangkat ini.
          </p>
          <Link href="/lupa-sandi" className={KELAS_TOMBOL}>
            Minta link baru
          </Link>
        </KotakAkun>
      );
    }

    return (
      <KotakAkun judul="Email terverifikasi" deskripsi="Akunmu sudah aktif.">
        <p>Masuk dengan email dan kata sandi yang tadi kamu buat.</p>
        <Link href="/masuk" className={KELAS_TOMBOL}>
          Masuk
        </Link>
        <p className="mt-5 text-sm text-teks-redup">
          Sedang mengganti kata sandi? Buka link dari email di browser tempat kamu memintanya, atau{" "}
          <Link href="/lupa-sandi" className={KELAS_TAUTAN}>
            minta link baru
          </Link>
          .
        </p>
      </KotakAkun>
    );
  }

  if (galat) {
    // Biasanya otp_expired: link sudah terpakai (sering dibuka diam-diam oleh aplikasi email) atau kedaluwarsa.
    return (
      <KotakAkun
        judul="Link sudah terpakai"
        deskripsi="Link di email hanya bisa dipakai sekali dan berlaku sebentar."
      >
        <p>Kalau tadi kamu mendaftar, akunmu kemungkinan besar sudah aktif.</p>
        <Link href="/masuk" className={KELAS_TOMBOL}>
          Coba masuk
        </Link>
        <p className="mt-5 text-sm text-teks-redup">
          Mau ganti kata sandi?{" "}
          <Link href="/lupa-sandi" className={KELAS_TAUTAN}>
            Minta link baru
          </Link>
          .
        </p>
      </KotakAkun>
    );
  }

  return (
    <KotakAkun
      judul="Buka lewat tombol di email"
      deskripsi="Halaman ini hanya berfungsi kalau dibuka dari tombol di email iQRo."
    >
      <p>
        Akunmu sudah aktif?{" "}
        <Link href="/masuk" className={KELAS_TAUTAN}>
          Langsung masuk
        </Link>
        . Belum? Buka email dari iQRo, lalu tekan tombolnya sekali lagi.
      </p>
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
