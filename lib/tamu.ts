import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { headers } from "next/headers";

// Pembantu server untuk tamu (tanpa akun): sidik IP untuk batas harian, dan kode klaim.

// Sidik acak alamat IP pengunjung. Alamat IP aslinya tidak pernah disimpan.
// Pakai HMAC + kunci rahasia: tanpa kunci itu, sidik tidak bisa dicocokkan balik ke IP
// (hash biasa bisa ditebak, karena jumlah alamat IP terbatas).
export async function sidikIp(): Promise<string> {
  const rahasia = process.env.RAHASIA_SIDIK_IP;
  if (!rahasia) throw new Error("RAHASIA_SIDIK_IP belum diisi (cek .env.local atau env Vercel).");

  const h = await headers();
  // Di Vercel kedua header ini diisi Vercel sendiri (tidak bisa dipalsukan pengunjung).
  // Tanpa IP (jarang, mis. di localhost) → semua masuk satu kelompok "tanpa-ip" yang berbagi batas.
  const ip =
    h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "tanpa-ip";
  return createHmac("sha256", rahasia).update(ip).digest("hex");
}

// Kode klaim acak (43 karakter) untuk disimpan di browser tamu. Database hanya menyimpan hash-nya;
// cara hash-nya harus sama dengan klaim_link_tamu() di schema.sql (sha256, hex).
export function buatKodeKlaim(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: createHash("sha256").update(token, "utf8").digest("hex") };
}
