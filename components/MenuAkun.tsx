import Link from "next/link";
import { keluar } from "@/lib/akun";
import { ambilPengguna } from "@/lib/auth";

const TOMBOL =
  "flex h-10 items-center rounded-md border border-garis bg-permukaan px-3 text-sm font-semibold text-teks hover:border-aksen";

// Server Component: membaca cookie login, jadi selalu dibungkus <Suspense> di HeaderSitus.
export default async function MenuAkun() {
  const pengguna = await ambilPengguna();

  if (!pengguna) {
    return (
      <Link href="/masuk" className={TOMBOL}>
        Masuk
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/dasbor" className={TOMBOL}>
        Dasbor
      </Link>
      <form action={keluar}>
        <button type="submit" className={TOMBOL}>
          Keluar
        </button>
      </form>
    </div>
  );
}
