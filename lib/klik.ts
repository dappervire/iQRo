// Membaca header permintaan saat link pendek dibuka → data klik untuk statistik (app/[slug]/route.ts).
// Sengaja TIDAK membaca alamat IP.

import type { DataKlik, Perangkat } from "./types";

// Pratinjau link (WhatsApp, Facebook, Telegram, Discord, dst.), mesin pencari, dan alat otomatis.
// Tidak dihitung sebagai klik. Hati-hati: "Telegram-Android" dan "LinkedInApp" adalah browser
// di dalam aplikasi (orang sungguhan), jadi yang dicocokkan hanya nama bot-nya.
// (?<!cu): HP merek "CUBOT" bukan bot.
const POLA_BOT =
  /(?<!cu)bot\b|bot\/|crawl|spider|slurp|preview|facebookexternalhit|facebookcatalog|meta-externalagent|whatsapp|skypeuripreview|embedly|iframely|vkshare|headless|lighthouse|pingdom|uptime|monitor|python|curl|wget|httpclient|okhttp|axios|node-fetch|undici|go-http|java\/|libwww|scrapy|postman/i;

const POLA_DOMAIN = /^[a-z0-9.-]{1,253}$/;

export function bukanManusia(ua: string): boolean {
  return ua.trim() === "" || POLA_BOT.test(ua);
}

// Kasar tapi cukup untuk statistik. iPad baru mengaku "Macintosh", jadi terhitung komputer.
export function jenisPerangkat(ua: string): Perangkat {
  if (/ipad|tablet|kindle|silk|playbook|android(?!.*mobile)/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return "hp";
  if (/windows nt|macintosh|linux|cros|x11/i.test(ua)) return "komputer";
  return "lainnya";
}

// "https://www.instagram.com/p/abc" → "instagram.com". Hanya nama situs yang disimpan, bukan halamannya.
export function domainPerujuk(perujuk: string | null): string | null {
  if (!perujuk) return null;
  try {
    const url = new URL(perujuk);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return POLA_DOMAIN.test(host) ? host : null;
  } catch {
    return null;
  }
}

// Header dari Vercel, mis. "ID". Di localhost header ini tidak ada → null.
export function kodeNegara(nilai: string | null): string | null {
  const kode = (nilai ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(kode) ? kode : null;
}

// null = jangan dicatat (bukan GET, atau bot/pratinjau).
// Pick<Headers, "get">: menerima header Route Handler maupun headers() di halaman (M14).
export function bacaKlik(headers: Pick<Headers, "get">, metode: string): DataKlik | null {
  if (metode !== "GET") return null;
  const ua = headers.get("user-agent") ?? "";
  if (bukanManusia(ua)) return null;
  return {
    // Chrome/Edge memberi tahu langsung apakah ini HP lewat header ini.
    perangkat: headers.get("sec-ch-ua-mobile") === "?1" ? "hp" : jenisPerangkat(ua),
    perujukDomain: domainPerujuk(headers.get("referer")),
    negara: kodeNegara(headers.get("x-vercel-ip-country")),
  };
}
