import { headers } from "next/headers";

// Domain produksi. Link ke domain ini tidak boleh dipendekkan lagi (link berputar-putar).
export const DOMAIN_UTAMA = "iqro-alpha.vercel.app";

// Alamat situs yang sedang dibuka (localhost / Preview / produksi), mis. "https://iqro-alpha.vercel.app".
// Dipakai untuk link di email dan untuk menampilkan link pendek. Hanya di server.
export async function alamatSitus(): Promise<string> {
  const h = await headers();
  const asal = h.get("origin");
  if (asal) return asal;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protokol = h.get("x-forwarded-proto") ?? "https";
  return `${protokol}://${host}`;
}
