import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — iQRo",
  description: "Data apa yang disimpan iQRo, untuk apa, dan di mana.",
};

// Isi dengan email yang boleh tampil publik untuk permintaan hapus akun. Kosong = kalimat cadangan.
const EMAIL_KONTAK: string = "";

function Bagian({ judul, children }: { judul: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">{judul}</h2>
      <div className="mt-3 space-y-3 text-teks-redup">{children}</div>
    </section>
  );
}

export default function HalamanPrivasi() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 lg:pb-10">
      <article className="max-w-prose rounded-md bg-permukaan p-5 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">Kebijakan Privasi</h1>
        <p className="mt-2 text-sm text-teks-redup">Diperbarui 30 Oktober 2026</p>
        <p className="mt-6 text-pretty">
          iQRo menyimpan data sesedikit mungkin. Halaman ini menjelaskan apa saja yang disimpan,
          untuk apa, dan di mana.
        </p>

        <Bagian judul="Pembuat QR">
          <p>
            Link, warna, logo, dan template yang kamu atur di halaman Buat QR diproses di
            perangkatmu sendiri. Semua itu tidak dikirim ke server iQRo, dan logomu tidak pernah
            diunggah ke mana pun.
          </p>
        </Bagian>

        <Bagian judul="Akun">
          <p>
            Saat mendaftar, kami menyimpan alamat email dan kata sandimu. Kata sandi disimpan dalam
            bentuk acak (hash), jadi kami pun tidak bisa membacanya. Email hanya dipakai untuk
            masuk, verifikasi, dan mengganti kata sandi; tidak untuk iklan.
          </p>
        </Bagian>

        <Bagian judul="Link pendek">
          <ul className="list-disc space-y-2 pl-5">
            <li>Kami menyimpan link tujuan, alamat pendeknya, dan waktu dibuat.</li>
            <li>
              Link yang dibuat tanpa akun berlaku 30 hari. Untuk membatasi penyalahgunaan, kami
              menyimpan sidik acak (hash) dari alamat IP pembuatnya, bukan alamat IP-nya, dan
              menghapusnya setiap hari.
            </li>
            <li>
              Link tujuan diperiksa lewat Google Safe Browsing supaya link berbahaya tidak bisa
              dibuat.
            </li>
          </ul>
        </Bagian>

        <Bagian judul="Saat link pendek diklik">
          <p>
            Untuk statistik pemilik link, kami mencatat waktu klik, nama situs asal klik (mis.
            instagram.com), jenis perangkat (HP, tablet, atau komputer), dan negara. Alamat IP
            pengunjung tidak disimpan.
          </p>
        </Bagian>

        <Bagian judul="Cookie dan penyimpanan di browser">
          <ul className="list-disc space-y-2 pl-5">
            <li>Cookie login, supaya kamu tetap masuk. Hilang saat kamu menekan Keluar.</li>
            <li>Pilihan tema (terang/gelap) di penyimpanan browser.</li>
            <li>
              Untuk link yang dibuat tanpa akun: kode rahasia di penyimpanan browser, supaya link
              itu bisa kamu pindahkan ke akunmu nanti.
            </li>
          </ul>
          <p>Tidak ada iklan dan tidak ada pelacak dari pihak lain.</p>
        </Bagian>

        <Bagian judul="Layanan yang kami pakai">
          <ul className="list-disc space-y-2 pl-5">
            <li>Supabase: database dan sistem login, server di Singapura.</li>
            <li>Vercel: tempat situs ini berjalan.</li>
            <li>Google Safe Browsing: pemeriksa link berbahaya.</li>
          </ul>
        </Bagian>

        <Bagian judul="Menghapus akun">
          {EMAIL_KONTAK ? (
            <p>
              Ingin akun dan semua link-mu dihapus? Kirim email dari alamat akunmu ke{" "}
              <a
                href={`mailto:${EMAIL_KONTAK}`}
                className="break-all font-semibold text-aksen underline underline-offset-4 hover:no-underline"
              >
                {EMAIL_KONTAK}
              </a>
              .
            </p>
          ) : (
            <p>Cara meminta penghapusan akun akan ditambahkan di halaman ini.</p>
          )}
        </Bagian>
      </article>
    </main>
  );
}
