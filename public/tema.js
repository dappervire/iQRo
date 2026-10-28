// Dijalankan sebelum halaman tampil: pasang tema yang pernah dipilih pengunjung supaya tidak berkedip.
// Kunci "iqro-tema" harus sama dengan lib/tema.ts.
try {
  var tema = localStorage.getItem("iqro-tema");
  if (tema === "terang" || tema === "gelap") document.documentElement.dataset.tema = tema;
} catch {
  // localStorage diblokir (mis. mode privat ketat): biarkan ikut tema perangkat.
}
