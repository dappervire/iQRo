import type { ReactNode } from "react";
import { CircleAlert, TriangleAlert } from "lucide-react";
import type { TingkatPeringatan } from "@/lib/types";

const GAYA: Record<TingkatPeringatan, string> = {
  kuning: "bg-kuning-latar text-kuning",
  merah: "bg-merah-latar text-merah",
};

type Props = {
  tingkat: TingkatPeringatan;
  children: ReactNode;
  // Tombol perbaikan opsional, mis. "Tukar warna".
  aksi?: ReactNode;
};

// Selalu diletakkan tepat di bawah kontrol yang diperingatkan, jadi sudah membawa jarak atas sendiri.
export default function Peringatan({ tingkat, children, aksi }: Props) {
  const Ikon = tingkat === "merah" ? CircleAlert : TriangleAlert;
  return (
    <div className={`mt-2 flex items-start gap-2 rounded-md px-3 py-2 text-sm ${GAYA[tingkat]}`}>
      <Ikon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div>
        <p>{children}</p>
        {aksi && <div className="mt-2">{aksi}</div>}
      </div>
    </div>
  );
}
