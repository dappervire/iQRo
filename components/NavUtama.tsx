"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { href: "/", label: "Buat QR" },
  { href: "/pendek", label: "Link Pendek" },
] as const;

function apakahAktif(href: string, jalur: string | null): boolean {
  if (jalur === null) return false;
  return href === "/" ? jalur === "/" : jalur === href || jalur.startsWith(`${href}/`);
}

// jalur null = belum diketahui (dipakai sebagai fallback Suspense): tidak ada yang disorot.
export function DaftarMenu({ jalur }: { jalur: string | null }) {
  return (
    <nav aria-label="Menu utama">
      <ul className="flex gap-1">
        {MENU.map(({ href, label }) => {
          const aktif = apakahAktif(href, jalur);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={aktif ? "page" : undefined}
                className={`flex h-10 items-center rounded-md px-3 text-sm font-semibold ${
                  aktif ? "bg-teks text-latar" : "text-teks-redup hover:bg-permukaan hover:text-teks"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function NavUtama() {
  return <DaftarMenu jalur={usePathname()} />;
}
