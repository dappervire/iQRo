"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LoaderCircle, MailCheck } from "lucide-react";
import Peringatan from "./Peringatan";
import { SANDI_MIN } from "@/lib/validasi-akun";
import type { HasilAksiAkun } from "@/lib/types";

type Props = {
  // Server Action dari lib/akun.ts (masuk, daftar, lupaSandi, gantiSandi).
  // Harus bernama "action": aturan Next.js untuk prop fungsi di komponen 'use client'.
  action: (sebelum: HasilAksiAkun, form: FormData) => Promise<HasilAksiAkun>;
  pakaiEmail: boolean;
  // "lama" = kata sandi yang sudah ada (masuk), "baru" = membuat kata sandi (daftar, ganti).
  sandi: "lama" | "baru" | null;
  tombol: string;
  // Data tambahan yang ikut terkirim tanpa terlihat, mis. { lanjut: "/dasbor" }.
  tersembunyi?: Record<string, string>;
};

const KELAS_INPUT =
  "w-full rounded-md border border-garis bg-latar py-2.5 pl-3 text-base text-teks placeholder:text-teks-redup focus:border-aksen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aksen/30";

const HASIL_AWAL: HasilAksiAkun = { status: "awal" };

export default function FormAkun({ action, pakaiEmail, sandi, tombol, tersembunyi }: Props) {
  const [hasil, kirim, sedangKirim] = useActionState(action, HASIL_AWAL);
  const [lihatSandi, setLihatSandi] = useState(false);

  if (hasil.status === "terkirim") {
    return (
      <div role="status" className="flex items-start gap-3">
        <MailCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-aksen" />
        <div>
          <p className="font-semibold">{hasil.judul}</p>
          <p className="mt-1 break-words text-teks-redup">{hasil.pesan}</p>
          {hasil.lanjutan && (
            <Link
              href={hasil.lanjutan.href}
              className="mt-4 inline-flex items-center rounded-md border border-garis bg-latar px-4 py-2.5 font-semibold text-teks hover:border-aksen"
            >
              {hasil.lanjutan.label}
            </Link>
          )}
        </div>
      </div>
    );
  }

  const galat = hasil.status === "galat" ? hasil.pesan : null;
  // Email yang sudah diketik tetap terisi setelah galat (form dikosongkan otomatis oleh React).
  const emailTadi = hasil.status === "galat" ? hasil.email : "";
  const sandiBaru = sandi === "baru";

  return (
    // noValidate: pesan galat dari server kita (bahasa awam), bukan pesan bawaan browser.
    <form action={kirim} noValidate>
      {tersembunyi &&
        Object.entries(tersembunyi).map(([nama, nilai]) => (
          <input key={nama} type="hidden" name={nama} value={nilai} />
        ))}

      <div className="space-y-5">
        {pakaiEmail && (
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              placeholder="nama@gmail.com"
              defaultValue={emailTadi}
              aria-invalid={galat !== null}
              aria-describedby="form-pesan"
              className={`${KELAS_INPUT} pr-3`}
            />
          </div>
        )}

        {sandi && (
          <div>
            <label htmlFor="sandi" className="mb-1.5 block text-sm font-medium">
              {sandiBaru ? "Kata sandi baru" : "Kata sandi"}
            </label>
            <div className="relative">
              <input
                id="sandi"
                name="sandi"
                type={lihatSandi ? "text" : "password"}
                autoComplete={sandiBaru ? "new-password" : "current-password"}
                aria-invalid={galat !== null}
                aria-describedby={sandiBaru ? "sandi-petunjuk form-pesan" : "form-pesan"}
                className={`${KELAS_INPUT} pr-12`}
              />
              <button
                type="button"
                onClick={() => setLihatSandi((v) => !v)}
                aria-label={lihatSandi ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                title={lihatSandi ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded text-teks-redup hover:text-teks"
              >
                {lihatSandi ? (
                  <EyeOff aria-hidden="true" className="size-4" />
                ) : (
                  <Eye aria-hidden="true" className="size-4" />
                )}
              </button>
            </div>
            {sandiBaru && (
              <p id="sandi-petunjuk" className="mt-1.5 text-sm text-teks-redup">
                Minimal {SANDI_MIN} karakter.
              </p>
            )}
          </div>
        )}
      </div>

      <div id="form-pesan" aria-live="polite">
        {galat && <Peringatan tingkat="merah">{galat}</Peringatan>}
      </div>

      <button
        type="submit"
        disabled={sedangKirim}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-aksen bg-aksen px-4 py-2.5 font-semibold text-teks-di-aksen hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
      >
        {sedangKirim && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
        {sedangKirim ? "Memproses…" : tombol}
      </button>
    </form>
  );
}
