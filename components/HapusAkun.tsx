"use client";

import { useActionState, useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { hapusAkun } from "@/lib/akun";
import type { HasilAksiAkun } from "@/lib/types";

type Props = {
  // Email akun yang sedang login, untuk ditampilkan sebagai contoh yang harus diketik ulang.
  email: string;
};

const HASIL_AWAL: HasilAksiAkun = { status: "awal" };

// Zona hapus akun di dasbor. Dua langkah: buka konfirmasi, lalu ketik ulang email.
export default function HapusAkun({ email }: Props) {
  const [buka, setBuka] = useState(false);

  if (!buka) {
    return (
      <button
        type="button"
        onClick={() => setBuka(true)}
        className="inline-flex items-center gap-2 rounded-md border border-garis bg-merah-latar px-4 py-2.5 font-semibold text-merah hover:border-merah"
      >
        <Trash2 aria-hidden="true" className="size-4" />
        Hapus akun
      </button>
    );
  }
  return <FormHapusAkun email={email} onBatal={() => setBuka(false)} />;
}

function FormHapusAkun({ email, onBatal }: Props & { onBatal: () => void }) {
  const [hasil, kirim, sedangKirim] = useActionState(hapusAkun, HASIL_AWAL);
  const [ketikan, setKetikan] = useState("");
  // Hanya kemudahan di browser; server tetap mencocokkan email sendiri.
  const cocok = ketikan.trim().toLowerCase() === email.toLowerCase();
  const galat = hasil.status === "galat" ? hasil.pesan : null;

  return (
    <form action={kirim} noValidate className="rounded-md bg-merah-latar p-4 text-merah sm:p-5">
      <p className="font-semibold">Hapus akun selamanya?</p>
      <p className="mt-1 text-sm">
        Akunmu dan semua link pendekmu langsung dihapus permanen. QR yang memakai link pendekmu akan
        berhenti bekerja. Ini tidak bisa dibatalkan.
      </p>

      <label htmlFor="hapus-email" className="mt-4 block text-sm font-medium">
        Ketik <span className="break-all font-semibold">{email}</span> untuk konfirmasi
      </label>
      <input
        id="hapus-email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="off"
        spellCheck={false}
        autoFocus
        value={ketikan}
        onChange={(e) => setKetikan(e.target.value)}
        aria-invalid={galat !== null}
        aria-describedby="hapus-pesan"
        className="mt-1.5 w-full rounded-md border border-garis bg-permukaan px-3 py-2.5 text-base text-teks focus:border-aksen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aksen/30"
      />
      <div id="hapus-pesan" aria-live="polite">
        {galat && <p className="mt-2 text-sm font-semibold">{galat}</p>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!cocok || sedangKirim}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-merah bg-merah px-4 py-2.5 font-semibold text-merah-latar hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sedangKirim && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
          {sedangKirim ? "Menghapus…" : "Hapus akun selamanya"}
        </button>
        <button
          type="button"
          onClick={onBatal}
          className="inline-flex items-center justify-center rounded-md border border-garis bg-permukaan px-4 py-2.5 font-semibold text-teks hover:border-aksen"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
