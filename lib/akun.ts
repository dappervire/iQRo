"use server";

// Server Action untuk akun. Semua input divalidasi ulang di sini, karena data dari browser bisa diubah.

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ambilPengguna } from "./auth";
import { terjemahkanGalatAuth } from "./pesan-auth";
import { buatKlienServer } from "./supabase/server";
import type { HasilAksiAkun } from "./types";
import { SANDI_MAKS, jalurAman, validasiEmail, validasiSandiBaru } from "./validasi-akun";

function ambilTeks(form: FormData, nama: string): string {
  const nilai = form.get(nama);
  return typeof nilai === "string" ? nilai : "";
}

function ambilEmail(form: FormData): string {
  return ambilTeks(form, "email").trim().toLowerCase();
}

// Alamat situs yang sedang dibuka (localhost / Preview / produksi), untuk link di email.
// Supabase tetap menolak alamat yang tidak ada di daftar Redirect URLs.
async function alamatSitus(): Promise<string> {
  const h = await headers();
  const asal = h.get("origin");
  if (asal) return asal;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protokol = h.get("x-forwarded-proto") ?? "https";
  return `${protokol}://${host}`;
}

export async function masuk(_sebelum: HasilAksiAkun, form: FormData): Promise<HasilAksiAkun> {
  const email = ambilEmail(form);
  const sandi = ambilTeks(form, "sandi");

  const galatEmail = validasiEmail(email);
  if (galatEmail) return { status: "galat", pesan: galatEmail, email };
  if (sandi === "") return { status: "galat", pesan: "Isi kata sandi.", email };
  if (sandi.length > SANDI_MAKS) {
    return { status: "galat", pesan: "Email atau kata sandi salah.", email };
  }

  const supabase = await buatKlienServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password: sandi });
  if (error) return { status: "galat", pesan: terjemahkanGalatAuth(error), email };

  redirect(jalurAman(ambilTeks(form, "lanjut")));
}

export async function daftar(_sebelum: HasilAksiAkun, form: FormData): Promise<HasilAksiAkun> {
  const email = ambilEmail(form);
  const sandi = ambilTeks(form, "sandi");

  const galat = validasiEmail(email) ?? validasiSandiBaru(sandi);
  if (galat) return { status: "galat", pesan: galat, email };

  const supabase = await buatKlienServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: sandi,
    options: { emailRedirectTo: `${await alamatSitus()}/auth/confirm` },
  });
  if (error) return { status: "galat", pesan: terjemahkanGalatAuth(error), email };

  // Supabase tidak memberi galat untuk email yang sudah terverifikasi; tandanya identities kosong.
  if (data.user && data.user.identities?.length === 0) {
    return {
      status: "galat",
      pesan: "Email ini sudah terdaftar. Silakan masuk, atau pakai \"Lupa kata sandi\".",
      email,
    };
  }
  // Kalau "Confirm email" dimatikan di Supabase, pengguna langsung masuk.
  if (data.session) redirect("/dasbor");

  return {
    status: "terkirim",
    judul: "Cek emailmu",
    pesan: `Kami mengirim link verifikasi ke ${email}. Buka link itu untuk mengaktifkan akun. Tidak ada? Cek folder Spam.`,
  };
}

export async function lupaSandi(_sebelum: HasilAksiAkun, form: FormData): Promise<HasilAksiAkun> {
  const email = ambilEmail(form);
  const galatEmail = validasiEmail(email);
  if (galatEmail) return { status: "galat", pesan: galatEmail, email };

  const supabase = await buatKlienServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await alamatSitus()}/auth/confirm`,
  });
  if (error) return { status: "galat", pesan: terjemahkanGalatAuth(error), email };

  // Pesan sama untuk email terdaftar maupun tidak, supaya orang lain tidak bisa menebak siapa yang punya akun.
  return {
    status: "terkirim",
    judul: "Cek emailmu",
    pesan: `Kalau ${email} terdaftar, link untuk membuat kata sandi baru sudah dikirim. Tidak ada? Cek folder Spam.`,
  };
}

export async function gantiSandi(_sebelum: HasilAksiAkun, form: FormData): Promise<HasilAksiAkun> {
  const sandi = ambilTeks(form, "sandi");

  const pengguna = await ambilPengguna();
  if (!pengguna) {
    return {
      status: "galat",
      pesan: "Waktu untuk mengganti kata sandi sudah habis. Minta link baru di halaman Lupa kata sandi.",
      email: "",
    };
  }

  const galat = validasiSandiBaru(sandi);
  if (galat) return { status: "galat", pesan: galat, email: "" };

  const supabase = await buatKlienServer();
  const { error } = await supabase.auth.updateUser({ password: sandi });
  if (error) return { status: "galat", pesan: terjemahkanGalatAuth(error), email: "" };

  redirect("/dasbor");
}

export async function keluar(): Promise<void> {
  const supabase = await buatKlienServer();
  // "local" = keluar di perangkat ini saja, perangkat lain tetap masuk.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}
