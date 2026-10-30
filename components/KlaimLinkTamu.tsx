"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { CircleCheck, LoaderCircle } from "lucide-react";
import Peringatan from "./Peringatan";
import {
  bacaKlaimMentah,
  hapusSemuaKlaim,
  jumlahKlaimAktif,
  langgananKlaim,
  uraiKlaim,
} from "@/lib/klaim";
import { klaimLinkTamu } from "@/lib/link";
import type { HasilKlaim } from "@/lib/types";

// Dasbor: kalau browser ini pernah membuat link sebagai tamu, tawarkan memindahkannya ke akun.
// Sengaja lewat tombol (bukan otomatis): di komputer bersama, link orang lain tidak ikut terambil diam-diam.
export default function KlaimLinkTamu() {
  // Server tidak tahu isi penyimpanan browser → di server dianggap 0 (tidak tampil).
  const jumlah = useSyncExternalStore(langgananKlaim, jumlahKlaimAktif, () => 0);
  const [hasil, setHasil] = useState<HasilKlaim | null>(null);
  const [sedangKirim, mulai] = useTransition();

  function simpan() {
    mulai(async () => {
      const daftar = uraiKlaim(bacaKlaimMentah(), Date.now());
      if (daftar.length === 0) {
        hapusSemuaKlaim();
        return;
      }
      const h = await klaimLinkTamu(daftar.map((k) => k.token));
      // Kode yang tidak cocok sekarang tidak akan pernah cocok lagi (sudah dipindah/kedaluwarsa),
      // jadi semua kode dihapus dari browser setelah berhasil.
      if (h.status === "berhasil") hapusSemuaKlaim();
      setHasil(h);
    });
  }

  if (hasil?.status === "berhasil") {
    return (
      <div role="status" className="mt-8 flex items-start gap-2 rounded-md bg-permukaan p-5">
        <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-aksen" />
        <p>
          {hasil.jumlah > 0
            ? `${hasil.jumlah} link sudah dipindah ke akunmu dan sekarang permanen.`
            : "Tidak ada link yang dipindah: link-nya sudah kedaluwarsa, dinonaktifkan, atau sudah tersimpan di akun."}
        </p>
      </div>
    );
  }
  if (jumlah === 0) return null;

  return (
    <section className="mt-8 rounded-md bg-permukaan p-5 sm:p-6" aria-labelledby="judul-klaim">
      <h2 id="judul-klaim" className="text-lg font-semibold">
        Ada {jumlah} link yang kamu buat sebelum masuk
      </h2>
      <p className="mt-2 max-w-prose text-teks-redup">
        Link itu dibuat di browser ini tanpa akun, jadi akan kedaluwarsa 30 hari setelah dibuat.
        Simpan ke akunmu supaya permanen dan bisa kamu kelola di sini.
      </p>
      <button
        type="button"
        onClick={simpan}
        disabled={sedangKirim}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-md border border-aksen bg-aksen px-4 py-2.5 font-semibold text-teks-di-aksen hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
      >
        {sedangKirim && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
        {sedangKirim ? "Menyimpan…" : "Simpan ke akunku"}
      </button>
      <div aria-live="polite">
        {hasil?.status === "galat" && <Peringatan tingkat="merah">{hasil.pesan}</Peringatan>}
      </div>
    </section>
  );
}
