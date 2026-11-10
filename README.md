# iQRo — QR siap baca, siap cetak

Buat QR code dari link atau nomor WhatsApp, dengan logo di tengah dan template siap cetak untuk UMKM. Pembuat QR berjalan 100% di browser: logo tidak diunggah ke mana pun. Untuk yang punya akun, ada juga link pendek dengan statistik klik dan halaman toko (link-in-bio).

**Coba langsung:** [iqro-alpha.vercel.app](https://iqro-alpha.vercel.app)

![Tampilan iQRo](docs/screenshot.png)

## Fitur

### Pembuat QR (tanpa akun, tanpa server)

- Link otomatis dirapikan (`tokoku.id` → `https://tokoku.id`); hanya link http/https yang diterima.
- QR WhatsApp: ketik nomor HP (`0812…` atau `+62 812…`) dan pesan pembuka; scan langsung membuka chat WhatsApp.
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

### Halaman toko (link-in-bio)

- Satu halaman per akun di `iqro-alpha.vercel.app/toko/<nama>`: nama toko, deskripsi, warna tema, tombol WhatsApp, dan sampai 8 tombol link.
- Setiap link di halaman toko dicek dengan Google Safe Browsing saat disimpan.
- Jumlah kunjungan tampil di Dasbor (bot pratinjau seperti WhatsApp tidak dihitung, IP tidak disimpan).
- Satu klik untuk membuat QR dari halaman toko.

### Akun

- Daftar dengan email, atau masuk dengan Google.
- Akun bisa dihapus sendiri dari Dasbor, beserta semua link, halaman toko, dan statistiknya.

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

Pembuat QR di halaman utama bisa jalan tanpa pengaturan apa pun. Untuk fitur link pendek, halaman toko, dan akun:

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

3. (Opsional) Untuk "Masuk dengan Google": buat OAuth Client di Google Cloud, lalu isi Client ID dan Secret di Supabase → Authentication → Sign In / Providers → Google. Secret ini hanya disimpan di Supabase, tidak di `.env.local`.

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
