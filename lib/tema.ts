import type { PilihanTema } from "./types";

// Kunci yang sama dipakai public/tema.js (jalan sebelum halaman tampil).
const KUNCI = "iqro-tema";
const EVENT = "iqro-tema";

// Tema yang sedang aktif dibaca dari atribut <html data-tema="...">; tanpa atribut = ikut sistem.
export function bacaTema(): PilihanTema {
  const t = document.documentElement.dataset.tema;
  return t === "terang" || t === "gelap" ? t : "sistem";
}

export function pasangTema(tema: PilihanTema) {
  const html = document.documentElement;
  if (tema === "sistem") delete html.dataset.tema;
  else html.dataset.tema = tema;
  try {
    if (tema === "sistem") localStorage.removeItem(KUNCI);
    else localStorage.setItem(KUNCI, tema);
  } catch {
    // Penyimpanan diblokir (mis. mode privat): tema tetap berganti, hanya tidak diingat.
  }
  window.dispatchEvent(new Event(EVENT));
}

// Untuk useSyncExternalStore: beri tahu komponen setiap kali tema diganti.
export function langgananTema(panggil: () => void) {
  window.addEventListener(EVENT, panggil);
  return () => window.removeEventListener(EVENT, panggil);
}
