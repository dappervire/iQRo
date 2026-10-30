import Link from "next/link";
import { formatAngka } from "@/lib/analitik";
import type { BarisPeringkat } from "@/lib/types";

type Props = {
  judul: string;
  baris: BarisPeringkat[];
  // Angka yang dianggap 100% panjang batang (mis. total klik 30 hari).
  pembanding: number;
  catatan?: string;
  tingkatJudul?: "h2" | "h3";
};

// Daftar "nama — jumlah klik" dengan batang tipis di bawahnya. Angka selalu tertulis,
// jadi batang hanya bantuan mata, bukan satu-satunya sumber informasi.
export default function DaftarPeringkat({
  judul,
  baris,
  pembanding,
  catatan,
  tingkatJudul = "h3",
}: Props) {
  const Judul = tingkatJudul;
  const dasar = Math.max(1, pembanding);

  return (
    <section className="rounded-md bg-permukaan p-5">
      <Judul className="font-semibold">{judul}</Judul>
      {baris.length === 0 ? (
        <p className="mt-3 text-sm text-teks-redup">Belum ada data.</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {baris.map((b) => (
            <li key={b.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                {b.href ? (
                  <Link
                    href={b.href}
                    className="min-w-0 truncate font-medium text-aksen underline-offset-4 hover:underline"
                  >
                    {b.label}
                  </Link>
                ) : (
                  <span className="min-w-0 truncate font-medium">{b.label}</span>
                )}
                <span className="shrink-0 font-mono tabular-nums">{formatAngka(b.klik)}</span>
              </div>
              <div aria-hidden="true" className="mt-1.5 h-1.5 rounded-full bg-latar">
                <div
                  className="h-full rounded-full bg-aksen"
                  style={{ width: `${Math.min(100, (b.klik / dasar) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
      {catatan && <p className="mt-4 text-xs text-teks-redup">{catatan}</p>}
    </section>
  );
}
