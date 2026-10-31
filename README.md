# iQRo — QR siap baca, siap cetak

Buat QR code dari link, dengan logo di tengah dan template siap cetak untuk UMKM. Pembuat QR berjalan 100% di browser: logo tidak diunggah ke mana pun. Ada juga link pendek dengan statistik klik untuk yang punya akun.

**Coba langsung:** [iqro-alpha.vercel.app](https://iqro-alpha.vercel.app)

![Tampilan iQRo](docs/screenshot.png)

## Fitur

### Pembuat QR (tanpa akun, tanpa server)

- Link otomatis dirapikan (`tokoku.id` → `https://tokoku.id`); hanya link http/https yang diterima.
- Warna QR dan latar, dengan peringatan kalau kontras terlalu rendah atau QR terbalik.
- Logo di tengah (PNG, JPG, WebP, SVG, maks. 2 MB), ukuran 15–30%.
- 3 template siap cetak 300 DPI: Stiker meja 100×100 mm, Poster A5 148×210 mm, Kartu kecil 90×55 mm.
- Unduh QR saja (PNG 1024 px, SVG) atau template (PNG 300 DPI, PDF ukuran asli).
- Tema terang dan gelap: ikut pengaturan perangkat, atau pilih sendiri lewat tombol tema.

### Link pendek

- Tanpa akun: buat link pendek otomatis (maks. 5 per hari), berlaku 30 hari.
- Dengan akun: nama link sendiri (mis. `iqro-alpha.vercel.app/warung-bu-sri`), link permanen, ubah tujuan tanpa mengganti QR yang sudah dicetak, hapus link, dan simpan link buatan tanpa akun ke akunmu.
- Statistik klik: total, grafik 30 hari, asal pengunjung, jenis perangkat, dan negara. Alamat IP pengunjung tidak disimpan.
- Setiap tujuan dicek dengan Google Safe Browsing; link mencurigakan bisa dilaporkan lewat halaman Laporkan.
- Akun bisa dihapus sendiri dari Dasbor, beserta semua link dan statistiknya.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router) + TypeScript
- Tailwind CSS
- [Supabase](https://supabase.com) (database Postgres + login), dengan Row Level Security
- [Google Safe Browsing](https://developers.google.com/safe-browsing) untuk mengecek link
- Vercel (hosting + cron harian)
- [qr-code-styling](https://github.com/kozakdenys/qr-code-styling), [jsPDF](https://github.com/parallax/jsPDF), [lucide-react](https://lucide.dev)
- Font: Plus Jakarta Sans, JetBrains Mono (`next/font/google`)

## Menjalankan di komputer

Butuh [Node.js](https://nodejs.org) versi LTS.

Pembuat QR di halaman utama bisa jalan tanpa pengaturan apa pun. Untuk fitur link pendek dan akun:

1. Buat project Supabase, lalu jalankan isi `supabase/schema.sql` di SQL Editor.
2. Buat file `.env.local` (jangan di-commit) berisi:

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   SUPABASE_SECRET_KEY=
   GOOGLE_SAFE_BROWSING_KEY=
   RAHASIA_SIDIK_IP=
   CRON_SECRET=
   ```

Lalu:

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Perintah lain:

```bash
npm run lint    # cek kode
npm run build   # build produksi
```
