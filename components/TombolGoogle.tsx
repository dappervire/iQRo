"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import LogoGoogle from "./LogoGoogle";
import Peringatan from "./Peringatan";
import { masukGoogle } from "@/lib/akun";
import type { HasilAksiAkun } from "@/lib/types";

const HASIL_AWAL: HasilAksiAkun = { status: "awal" };

type Props = {
  // Halaman tujuan setelah masuk (dari ?lanjut=); dicek ulang di server.
  lanjut?: string;
};

// Tombol "Lanjutkan dengan Google" di /masuk dan /daftar, ditambah tulisan pemisah "atau dengan email".
export default function TombolGoogle({ lanjut }: Props) {
  const [hasil, kirim, sedangKirim] = useActionState(masukGoogle, HASIL_AWAL);

  return (
    <>
      <form action={kirim}>
        {lanjut && <input type="hidden" name="lanjut" value={lanjut} />}
        <button
          type="submit"
          disabled={sedangKirim}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-garis bg-latar px-4 py-2.5 font-semibold text-teks hover:border-aksen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aksen disabled:cursor-wait disabled:opacity-70"
        >
          {sedangKirim ? (
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
          ) : (
            <LogoGoogle className="size-5" />
          )}
          {sedangKirim ? "Membuka Google…" : "Lanjutkan dengan Google"}
        </button>
        <div aria-live="polite">
          {hasil.status === "galat" && <Peringatan tingkat="merah">{hasil.pesan}</Peringatan>}
        </div>
      </form>
      <p className="my-5 text-center text-sm font-medium text-teks-redup">atau dengan email</p>
    </>
  );
}
