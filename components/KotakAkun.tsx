import type { ReactNode } from "react";

export const KELAS_TAUTAN =
  "font-semibold text-aksen underline underline-offset-4 hover:no-underline";

type Props = {
  judul: string;
  deskripsi: string;
  children: ReactNode;
  // Tautan di bawah panel, mis. "Belum punya akun? Daftar".
  bawah?: ReactNode;
};

// Kerangka halaman akun (masuk, daftar, lupa sandi, sandi baru): satu kolom sempit di tengah.
export default function KotakAkun({ judul, deskripsi, children, bawah }: Props) {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-6 lg:pb-10">
      <h1 className="text-2xl font-bold tracking-tight text-balance">{judul}</h1>
      <p className="mt-2 text-teks-redup text-pretty">{deskripsi}</p>
      <div className="mt-6 rounded-md bg-permukaan p-5 sm:p-6">{children}</div>
      {bawah && <div className="mt-5 space-y-2 text-sm">{bawah}</div>}
    </main>
  );
}
