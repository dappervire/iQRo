import type { CSSProperties, ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { warnaTeksOtomatis } from "@/lib/kontras";
import type { IsiToko } from "@/lib/types";
import { hurufDepan } from "@/lib/validasi-toko";

type Props = {
  isi: IsiToko;
  // true = preview di form /dasbor/toko: tombol tidak bisa ditekan, judul bukan h1.
  pratinjau?: boolean;
};

const KELAS_TOMBOL =
  "flex w-full items-center justify-center gap-2 rounded-md border px-4 py-3.5 text-center font-semibold break-words";
const KELAS_FOKUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aksen";

// Isi halaman toko: kotak huruf depan, nama, deskripsi, tombol WhatsApp, tombol link.
// Tanpa 'use client' dan tanpa hook, jadi bisa dipakai halaman server maupun form di browser.
// Semua teks dirender sebagai teks biasa (React meng-escape-nya), tidak ada HTML dari user.
export default function TampilanToko({ isi, pratinjau = false }: Props) {
  const nama = isi.nama || "Nama tokomu";
  const gaya = {
    "--warna-toko": isi.warna,
    "--teks-toko": warnaTeksOtomatis(isi.warna),
  } as CSSProperties;
  const Judul = pratinjau ? "p" : "h1";
  const adaTombol = isi.waUrl !== null || isi.tombol.length > 0;

  return (
    <div style={gaya} className="w-full">
      <div className="flex flex-col items-center text-center">
        <div
          aria-hidden="true"
          className="grid size-20 place-items-center rounded-md bg-(--warna-toko) text-4xl font-bold text-(--teks-toko)"
        >
          {hurufDepan(nama)}
        </div>
        <Judul className="mt-4 max-w-full text-2xl font-bold tracking-tight text-balance break-words">
          {nama}
        </Judul>
        {isi.deskripsi && (
          <p className="mt-2 max-w-full whitespace-pre-line text-teks-redup text-pretty break-words">
            {isi.deskripsi}
          </p>
        )}
      </div>

      {adaTombol ? (
        <ul className="mt-8 space-y-3">
          {isi.waUrl && (
            <li>
              <TombolAtauTeks
                href={isi.waUrl}
                pratinjau={pratinjau}
                className={`${KELAS_TOMBOL} border-(--warna-toko) bg-(--warna-toko) text-(--teks-toko) hover:opacity-90`}
              >
                <MessageCircle aria-hidden="true" className="size-5 shrink-0" />
                Chat WhatsApp
              </TombolAtauTeks>
            </li>
          )}
          {isi.tombol.map((t, i) => (
            <li key={i}>
              <TombolAtauTeks
                href={t.url}
                pratinjau={pratinjau}
                className={`${KELAS_TOMBOL} border-garis bg-permukaan text-teks hover:border-aksen`}
              >
                <span className="min-w-0">{t.label}</span>
              </TombolAtauTeks>
            </li>
          ))}
        </ul>
      ) : (
        pratinjau && (
          <p className="mt-8 rounded-md bg-permukaan p-4 text-center text-sm text-teks-redup">
            Tombol WhatsApp dan tombol link akan tampil di sini.
          </p>
        )
      )}
    </div>
  );
}

type TombolProps = {
  href: string;
  pratinjau: boolean;
  className: string;
  children: ReactNode;
};

function TombolAtauTeks({ href, pratinjau, className, children }: TombolProps) {
  if (pratinjau || href === "") return <span className={className}>{children}</span>;
  return (
    // nofollow ugc: link buatan pengguna, bukan rekomendasi iQRo.
    <a href={href} rel="nofollow ugc noopener noreferrer" className={`${className} ${KELAS_FOKUS}`}>
      {children}
    </a>
  );
}
