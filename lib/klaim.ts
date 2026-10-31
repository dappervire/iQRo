import type { KlaimTamu } from "./types";

// Kode klaim link tamu di penyimpanan browser (localStorage). Hanya dipanggil di browser
// (useEffect / handler / useSyncExternalStore). Kode ini bukti bahwa browser inilah pembuat linknya:
// setelah masuk, kodenya dikirim ke server untuk memindahkan link ke akun (KlaimLinkTamu.tsx).

const KUNCI = "iqro-klaim";
const EVENT = "iqro-klaim";
const MAKS = 50; // sama dengan batas di klaim_link_tamu() (schema.sql)
const POLA_TOKEN = /^[A-Za-z0-9_-]{43}$/;

export function tokenBenar(token: unknown): token is string {
  return typeof token === "string" && POLA_TOKEN.test(token);
}

// Teks mentah dari localStorage (untuk useSyncExternalStore: teks yang sama = tidak dirender ulang).
export function bacaKlaimMentah(): string | null {
  try {
    return localStorage.getItem(KUNCI);
  } catch {
    return null; // penyimpanan diblokir (mis. mode privat)
  }
}

// Isi penyimpanan dicek satu per satu (bisa rusak atau diubah orang). Yang kedaluwarsa dibuang.
export function uraiKlaim(mentah: string | null, sekarang: number): KlaimTamu[] {
  if (!mentah) return [];
  let data: unknown;
  try {
    data = JSON.parse(mentah);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  return data.filter((k): k is KlaimTamu => {
    if (typeof k !== "object" || k === null) return false;
    const { slug, token, kedaluwarsa } = k as Record<string, unknown>;
    return (
      typeof slug === "string" &&
      tokenBenar(token) &&
      typeof kedaluwarsa === "string" &&
      Date.parse(kedaluwarsa) > sekarang
    );
  });
}

// Untuk useSyncExternalStore: jumlah kode yang belum kedaluwarsa (angka, jadi aman dibandingkan).
export function jumlahKlaimAktif(): number {
  return uraiKlaim(bacaKlaimMentah(), Date.now()).length;
}

function tulis(daftar: KlaimTamu[]) {
  try {
    if (daftar.length === 0) localStorage.removeItem(KUNCI);
    else localStorage.setItem(KUNCI, JSON.stringify(daftar));
  } catch {
    // Diblokir: link tetap jalan 30 hari, hanya tidak bisa dipindah ke akun dari browser ini.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function tambahKlaim(klaim: KlaimTamu) {
  const lama = uraiKlaim(bacaKlaimMentah(), Date.now()).filter((k) => k.token !== klaim.token);
  tulis([...lama, klaim].slice(-MAKS));
}

export function hapusSemuaKlaim() {
  tulis([]);
}

// Untuk useSyncExternalStore: kabari komponen kalau isi berubah (tab ini atau tab lain).
export function langgananKlaim(panggil: () => void) {
  window.addEventListener(EVENT, panggil);
  window.addEventListener("storage", panggil);
  return () => {
    window.removeEventListener(EVENT, panggil);
    window.removeEventListener("storage", panggil);
  };
}
