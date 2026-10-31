// Menerjemahkan galat Supabase Auth (bahasa Inggris, teknis) ke bahasa awam.
// Kode lengkap: https://supabase.com/docs/guides/auth/debugging/error-codes

type GalatAuth = {
  code?: string;
  message: string;
};

const PESAN: Record<string, string> = {
  invalid_credentials: "Email atau kata sandi salah.",
  email_not_confirmed:
    "Email ini belum diverifikasi. Buka link di email dari iQRo (cek juga folder Spam).",
  user_already_exists: "Email ini sudah terdaftar. Silakan masuk.",
  email_exists: "Email ini sudah terdaftar. Silakan masuk.",
  weak_password: "Kata sandi terlalu mudah ditebak. Pakai campuran huruf dan angka.",
  same_password: "Kata sandi baru tidak boleh sama dengan yang lama.",
  email_address_invalid: "Alamat email tidak valid, contoh: nama@gmail.com",
  signup_disabled: "Pendaftaran sedang ditutup.",
  over_email_send_rate_limit:
    "Terlalu banyak email dikirim dalam waktu singkat. Tunggu sekitar satu jam, lalu coba lagi.",
  over_request_rate_limit: "Terlalu banyak percobaan. Tunggu beberapa menit, lalu coba lagi.",
  otp_expired: "Link sudah kedaluwarsa atau sudah dipakai. Minta link baru.",
  session_not_found: "Sesimu sudah berakhir. Silakan masuk lagi.",
  refresh_token_not_found: "Sesimu sudah berakhir. Silakan masuk lagi.",
};

export function terjemahkanGalatAuth(galat: GalatAuth): string {
  const pesan = galat.code ? PESAN[galat.code] : undefined;
  if (pesan) return pesan;
  // Dicatat di log server (terminal / Vercel) supaya bisa dicari penyebabnya.
  console.error("Galat Supabase Auth:", galat.code, galat.message);
  return "Terjadi kesalahan. Periksa internetmu, lalu coba lagi sebentar lagi.";
}
