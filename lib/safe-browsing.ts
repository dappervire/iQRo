import "server-only";

// Cek link tujuan ke Google Safe Browsing (Lookup API v4) sebelum link pendek dibuat/diubah.
// Kunci API hanya di server (env tanpa NEXT_PUBLIC_).
// URL uji dari Google: https://testsafebrowsing.appspot.com/s/malware.html → "berbahaya".

export type HasilCekLink = "aman" | "berbahaya" | "gagal";

const ALAMAT = "https://safebrowsing.googleapis.com/v4/threatMatches:find";
const BATAS_WAKTU_MS = 4000;

export async function cekSafeBrowsing(url: string): Promise<HasilCekLink> {
  const kunci = process.env.GOOGLE_SAFE_BROWSING_KEY;
  if (!kunci) {
    console.error("GOOGLE_SAFE_BROWSING_KEY belum diisi (cek .env.local atau env Vercel).");
    return "gagal";
  }

  try {
    const respons = await fetch(`${ALAMAT}?key=${encodeURIComponent(kunci)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: { clientId: "iqro", clientVersion: "1.0" },
        threatInfo: {
          threatTypes: [
            "MALWARE",
            "SOCIAL_ENGINEERING",
            "UNWANTED_SOFTWARE",
            "POTENTIALLY_HARMFUL_APPLICATION",
          ],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(BATAS_WAKTU_MS),
    });
    if (!respons.ok) {
      console.error("Safe Browsing:", respons.status, await respons.text());
      return "gagal";
    }
    // Aman = {} (kosong). Berbahaya = { matches: [...] }.
    const data: unknown = await respons.json();
    const cocok =
      typeof data === "object" && data !== null ? (data as Record<string, unknown>).matches : null;
    return Array.isArray(cocok) && cocok.length > 0 ? "berbahaya" : "aman";
  } catch (e) {
    console.error("Safe Browsing:", e instanceof Error ? e.message : e);
    return "gagal";
  }
}
