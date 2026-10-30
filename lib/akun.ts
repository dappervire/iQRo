"use server";

// Server Action untuk akun. Semua input divalidasi ulang di sini, karena data dari browser bisa diubah.

import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { ambilPengguna } from "./auth";
import { terjemahkanGalatAuth } from "./pesan-auth";
import { alamatSitus } from "./situs";
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
    pesan: `Kami mengirim link verifikasi ke ${email}. Buka link itu (boleh dari HP), lalu masuk. Tidak ada? Cek folder Spam.`,
    lanjutan: { href: "/masuk", label: "Sudah klik link-nya? Masuk" },
  };
}

const JENIS_KONFIRMASI: EmailOtpType[] = ["email", "signup", "recovery"];

// Dipanggil dari tombol di /auth/confirm, BUKAN langsung saat link email dibuka:
// aplikasi email sering membuka link diam-diam lebih dulu, dan link Supabase hanya berlaku sekali.
export async function konfirmasiEmail(
  _sebelum: HasilAksiAkun,
  form: FormData,
): Promise<HasilAksiAkun> {
  const tokenHash = ambilTeks(form, "token_hash");
  const jenisMentah = ambilTeks(form, "type");
  const jenis = JENIS_KONFIRMASI.find((j) => j === jenisMentah);
  if (!jenis || !/^[\w-]{1,200}$/.test(tokenHash)) {
    return { status: "galat", pesan: "Link tidak valid. Buka lagi link dari emailmu.", email: "" };
  }

  const supabase = await buatKlienServer();
  const { error } = await supabase.auth.verifyOtp({ type: jenis, token_hash: tokenHash });
  if (error) {
    const pesan =
      jenis === "recovery"
        ? "Link ini sudah tidak berlaku. Minta link baru di halaman Lupa kata sandi."
        : "Link ini sudah tidak berlaku. Kalau tadi akunmu sudah aktif, langsung masuk saja.";
    return { status: "galat", pesan, email: "" };
  }

  redirect(jenis === "recovery" ? "/sandi-baru" : "/dasbor");
}

// Email bawaan Supabase (paket gratis tanpa SMTP sendiri, template tidak bisa diubah):
// Supabase memverifikasi email lebih dulu, lalu membuka /auth/confirm?code=...
// Kode hanya bisa ditukar jadi sesi login di browser yang tadi mendaftar / meminta ganti sandi.
export async function tukarKodeEmail(
  _sebelum: HasilAksiAkun,
  form: FormData,
): Promise<HasilAksiAkun> {
  const kode = ambilTeks(form, "code");
  if (!/^[\w-]{1,200}$/.test(kode)) {
    return { status: "galat", pesan: "Link tidak valid. Buka lagi link dari emailmu.", email: "" };
  }

  const supabase = await buatKlienServer();
  const { data, error } = await supabase.auth.exchangeCodeForSession(kode);
  if (error) {
    return {
      status: "galat",
      pesan: "Link ini sudah terpakai. Kalau tadi kamu mendaftar, akunmu sudah aktif: langsung masuk saja.",
      email: "",
    };
  }

  // redirectType ada saat berjalan tapi tidak tercantum di tipe TypeScript-nya, jadi dicek dulu dengan "in".
  const gantiSandi = "redirectType" in data && data.redirectType === "recovery";
  redirect(gantiSandi ? "/sandi-baru" : "/dasbor");
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
    pesan: `Kalau ${email} terdaftar, link untuk membuat kata sandi baru sudah dikirim. Buka link itu di browser ini juga. Tidak ada? Cek folder Spam.`,
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
