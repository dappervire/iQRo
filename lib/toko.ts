"use server";

// Server Action halaman toko (M14): simpan (buat/ubah) dan hapus.
// Pemilik TIDAK pernah dikirim dari browser: selalu dari login yang dicek server (getClaims).
// Menyimpan memakai klien admin (pola M11): user tidak punya hak menulis langsung ke tabel toko,
// jadi cek Safe Browsing di sini tidak bisa dilewati lewat Data API.

import { refresh } from "next/cache";
import { ambilPengguna } from "./auth";
import { periksaKeamanan } from "./periksa-link";
import { alamatSitus } from "./situs";
import { buatKlienAdmin } from "./supabase/admin";
import { buatKlienServer } from "./supabase/server";
import type { HasilSimpanToko, HasilUbahLink, IsianToko, KolomToko, TombolToko } from "./types";
import { alamatToko, periksaIsianToko } from "./validasi-toko";

const KODE_SUDAH_ADA = "23505"; // kode Postgres: nilai unik sudah ada (alamat toko terpakai)
const BARIS_TOMBOL_MAKS = 20; // batas baca dari form; aturan 8 tombol dicek di validasi-toko.ts
const TEKS_MAKS = 2000; // potong teks dari form yang tidak wajar panjangnya sebelum diproses

const PESAN_SESI_HABIS = "Sesi masukmu sudah habis. Masuk lagi, lalu coba sekali lagi.";

// Baris baru dari textarea dikirim browser sebagai "\r\n" (2 karakter); disamakan jadi "\n"
// supaya hitungan karakter sama dengan penghitung di form.
function ambilTeks(form: FormData, nama: string): string {
  const nilai = form.get(nama);
  return typeof nilai === "string" ? nilai.replace(/\r\n?/g, "\n").slice(0, TEKS_MAKS) : "";
}

function ambilSemua(form: FormData, nama: string): string[] {
  return form
    .getAll(nama)
    .slice(0, BARIS_TOMBOL_MAKS)
    .map((v) => (typeof v === "string" ? v.slice(0, TEKS_MAKS) : ""));
}

function galat(pesan: string, kolom: KolomToko | null, indeks: number | null = null): HasilSimpanToko {
  return { status: "galat", pesan, kolom, indeks };
}

function isianDariForm(form: FormData): IsianToko {
  const label = ambilSemua(form, "tombolLabel");
  const url = ambilSemua(form, "tombolUrl");
  const tombol: TombolToko[] = label.map((l, i) => ({ label: l, url: url[i] ?? "" }));
  return {
    namaUrl: ambilTeks(form, "namaUrl"),
    nama: ambilTeks(form, "nama"),
    deskripsi: ambilTeks(form, "deskripsi"),
    warna: ambilTeks(form, "warna"),
    waNomor: ambilTeks(form, "waNomor"),
    waPesan: ambilTeks(form, "waPesan"),
    tombol,
  };
}

export async function simpanToko(
  _sebelum: HasilSimpanToko,
  form: FormData,
): Promise<HasilSimpanToko> {
  const pengguna = await ambilPengguna();
  if (!pengguna) return galat(PESAN_SESI_HABIS, null);

  const cek = periksaIsianToko(isianDariForm(form));
  if (!cek.ok) return galat(cek.pesan, cek.kolom, cek.indeks);
  const data = cek.data;

  // Semua link tombol diperiksa bersamaan. Satu saja berbahaya/gagal diperiksa → tidak disimpan.
  const hasilAman = await Promise.all(data.tombol.map((t) => periksaKeamanan(t.url)));
  const salah = hasilAman.findIndex((h) => h !== null);
  if (salah !== -1) return galat(hasilAman[salah] ?? "", "tombol", data.tombolIndeks[salah]);

  // Klien admin melewati RLS, jadi setiap kueri WAJIB dibatasi pemilik_id dari login (bukan form).
  const supabase = buatKlienAdmin();
  const { data: lama, error: galatBaca } = await supabase
    .from("toko")
    .select("id")
    .eq("pemilik_id", pengguna.id)
    .maybeSingle();
  if (galatBaca) {
    console.error("simpanToko baca:", galatBaca.code, galatBaca.message);
    return galat("Halaman belum bisa disimpan karena ada gangguan. Coba lagi.", null);
  }

  // Satu akun = satu halaman: kalau sudah ada, baris yang sama diperbarui.
  // jumlah_kunjungan, dinonaktifkan, dan alasan tidak pernah dikirim dari sini.
  const { error } = await supabase.from("toko").upsert(
    {
      pemilik_id: pengguna.id,
      nama_url: data.namaUrl,
      nama: data.nama,
      deskripsi: data.deskripsi,
      warna: data.warna,
      wa_nomor: data.waNomor,
      wa_pesan: data.waPesan,
      tombol: data.tombol,
    },
    { onConflict: "pemilik_id" },
  );

  if (error?.code === KODE_SUDAH_ADA) {
    return galat(`Alamat "${data.namaUrl}" sudah dipakai toko lain. Coba alamat lain.`, "namaUrl");
  }
  if (error) {
    console.error("simpanToko:", error.code, error.message);
    return galat("Halaman belum bisa disimpan karena ada gangguan. Coba lagi.", null);
  }

  const asal = new URL(await alamatSitus()).origin;
  return { status: "berhasil", alamat: alamatToko(asal, data.namaUrl), baru: !lama };
}

// Dasbor: hapus halaman toko. QR yang menuju halaman ini akan menampilkan "tidak ditemukan".
// Tanpa masukan dari browser sama sekali: yang dihapus selalu halaman milik akun yang sedang masuk.
export async function hapusToko(): Promise<HasilUbahLink> {
  const pengguna = await ambilPengguna();
  if (!pengguna) return { status: "galat", pesan: PESAN_SESI_HABIS };

  // Klien user: RLS hanya mengizinkan menghapus milik sendiri; filter pemilik_id = lapis kedua.
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("toko")
    .delete()
    .eq("pemilik_id", pengguna.id)
    .select("id");

  if (error) {
    console.error("hapusToko:", error.code, error.message);
    return { status: "galat", pesan: "Halaman belum bisa dihapus karena ada gangguan. Coba lagi." };
  }
  if (data.length === 0) {
    return { status: "galat", pesan: "Halaman toko tidak ditemukan. Muat ulang halaman ini." };
  }

  refresh();
  return { status: "berhasil" };
}
