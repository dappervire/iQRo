import Link from "next/link";

// Halaman 404 untuk seluruh situs, termasuk link pendek yang tidak ada.
export default function TidakDitemukan() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-6 lg:pb-10">
      <h1 className="text-2xl font-bold tracking-tight">Halaman tidak ditemukan</h1>
      <div className="mt-6 rounded-md bg-permukaan p-5 sm:p-6">
        <p className="text-pretty">
          Alamat ini tidak ada. Mungkin salah ketik, atau link pendeknya sudah dihapus pemiliknya.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center justify-center rounded-md border border-aksen bg-aksen px-4 py-2.5 font-semibold text-teks-di-aksen hover:opacity-90"
        >
          Buka iQRo
        </Link>
      </div>
    </main>
  );
}
