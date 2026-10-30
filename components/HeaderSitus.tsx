import { Suspense } from "react";
import Link from "next/link";
import IqroLogo from "./IqroLogo";
import MenuAkun from "./MenuAkun";
import NavUtama, { DaftarMenu } from "./NavUtama";
import PilihTema from "./PilihTema";

// Header semua halaman. Bagian yang membaca data permintaan (alamat halaman, cookie login)
// dibungkus <Suspense>, supaya sisa halaman tetap bisa disiapkan lebih dulu (cacheComponents).
export default function HeaderSitus() {
  return (
    <header className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-3 px-4 pb-4 pt-6 lg:pt-10">
      <div className="flex items-center gap-4">
        <Link href="/" className="rounded-md">
          <IqroLogo title="iQRo, ke halaman Buat QR" className="size-10 text-teks lg:size-12" />
        </Link>
        <p className="hidden text-sm text-teks-redup lg:block">QR siap baca, siap cetak.</p>
      </div>

      {/* HP: menu turun ke baris kedua; layar lebar: satu baris di samping logo. */}
      <div className="order-last w-full sm:order-none sm:w-auto">
        <Suspense fallback={<DaftarMenu jalur={null} />}>
          <NavUtama />
        </Suspense>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Suspense fallback={<span aria-hidden="true" className="block h-10 w-20" />}>
          <MenuAkun />
        </Suspense>
        <PilihTema />
      </div>
    </header>
  );
}
