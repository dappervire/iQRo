-- iQRo — skema database link pendek.
-- Cara pakai: Supabase → SQL Editor → New query → tempel SELURUH isi file ini → Run.
-- Aman dijalankan ulang (if not exists / or replace / drop ... if exists).
-- Fungsi yang hanya boleh dipanggil server iQRo diberi hak "service_role" (kunci secret), bukan anon.

-- ============================================================
-- M8: tabel links
-- ============================================================

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  -- Sama dengan lib/slug.ts: 3–32 karakter a-z 0-9 -, tidak diawali/diakhiri "-".
  slug text not null unique
    constraint links_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$'),
  tujuan text not null
    constraint links_tujuan_format check (char_length(tujuan) <= 1000 and tujuan ~* '^https?://'),
  -- Diisi otomatis dari login yang sedang dipakai; browser tidak bisa memilih pemilik lain.
  -- null = link tamu (M11). on delete cascade: akun dihapus → semua link-nya ikut terhapus (M9).
  pemilik_id uuid default auth.uid() references auth.users (id) on delete cascade,
  klaim_hash text,
  jumlah_klik bigint not null default 0,
  dibuat timestamptz not null default now(),
  diubah timestamptz not null default now(),
  kedaluwarsa timestamptz,
  dinonaktifkan boolean not null default false,
  alasan text
);

-- Mempercepat "link milik saya, terbaru dulu" (dasbor) dan hitungan batas harian.
create index if not exists links_pemilik_dibuat on public.links (pemilik_id, dibuat desc);

-- ------------------------------------------------------------
-- Hak akses. Kunci publishable ada di browser, jadi siapa pun bisa memanggil
-- Data API langsung. Karena itu aturan dipasang di database, bukan hanya di kode.
-- ------------------------------------------------------------

alter table public.links enable row level security;

revoke all on public.links from anon, authenticated;
-- User hanya boleh membaca dan menghapus langsung. Membuat & mengubah link (M11) hanya lewat
-- server iQRo (lib/link.ts, kunci secret), supaya cek Google Safe Browsing tidak bisa dilewati.
grant select, delete on public.links to authenticated;
grant select, insert, update, delete on public.links to service_role;

drop policy if exists "links: baca milik sendiri" on public.links;
create policy "links: baca milik sendiri" on public.links
  for select to authenticated
  using ((select auth.uid()) = pemilik_id);

drop policy if exists "links: buat milik sendiri" on public.links;
create policy "links: buat milik sendiri" on public.links
  for insert to authenticated
  with check ((select auth.uid()) = pemilik_id);

-- Ubah & hapus dipakai di M9 (dasbor).
drop policy if exists "links: ubah milik sendiri" on public.links;
create policy "links: ubah milik sendiri" on public.links
  for update to authenticated
  using ((select auth.uid()) = pemilik_id)
  with check ((select auth.uid()) = pemilik_id);

drop policy if exists "links: hapus milik sendiri" on public.links;
create policy "links: hapus milik sendiri" on public.links
  for delete to authenticated
  using ((select auth.uid()) = pemilik_id);

-- ------------------------------------------------------------
-- Trigger
-- ------------------------------------------------------------

-- Kolom "diubah" diisi waktu sekarang setiap kali link diubah.
-- Pengecualian (M10): kalau yang berubah hanya jumlah_klik (ada yang klik), "diubah" tidak disentuh.
create or replace function public.links_isi_diubah()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (to_jsonb(new) - 'jumlah_klik' - 'diubah') is distinct from (to_jsonb(old) - 'jumlah_klik' - 'diubah') then
    new.diubah := now();
  end if;
  return new;
end;
$$;

drop trigger if exists links_diubah on public.links;
create trigger links_diubah
  before update on public.links
  for each row execute function public.links_isi_diubah();

-- Batas 50 link per 24 jam per user. Dicek di database supaya tidak bisa dilewati.
-- Pesan "batas_harian" dibaca oleh lib/link.ts dan diganti kalimat yang ramah.
create or replace function public.links_cek_batas()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.pemilik_id is not null and (
    select count(*) from public.links
    where pemilik_id = new.pemilik_id and dibuat > now() - interval '24 hours'
  ) >= 50 then
    raise exception 'batas_harian' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists links_batas_harian on public.links;
create trigger links_batas_harian
  before insert on public.links
  for each row execute function public.links_cek_batas();

-- ------------------------------------------------------------
-- Fungsi publik untuk redirect (app/[slug]/route.ts).
-- Pengunjung yang scan QR tidak login, jadi tidak bisa membaca tabel links.
-- Fungsi ini hanya menjawab SATU slug yang ditanyakan, tanpa data pemilik.
-- ------------------------------------------------------------

create or replace function public.cari_link(p_slug text)
returns table (id uuid, tujuan text, aktif boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    l.id,
    l.tujuan,
    not l.dinonaktifkan and (l.kedaluwarsa is null or l.kedaluwarsa > now())
  from public.links l
  where l.slug = p_slug;
$$;

revoke execute on function public.cari_link(text) from public, anon, authenticated;
grant execute on function public.cari_link(text) to anon, authenticated;

-- ============================================================
-- M9: hapus akun sendiri (tombol "Hapus akun" di dasbor, lib/akun.ts)
-- ============================================================

-- User biasa tidak boleh menyentuh auth.users. Fungsi ini berjalan dengan hak pemiliknya
-- (security definer), tapi HANYA menghapus akun yang sedang login (auth.uid()), tidak bisa akun lain.
-- Link milik akun itu ikut terhapus lewat "on delete cascade" di tabel links.
create or replace function public.hapus_akun_saya()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'belum_masuk' using errcode = 'P0001';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.hapus_akun_saya() from public, anon, authenticated;
grant execute on function public.hapus_akun_saya() to authenticated;

-- ============================================================
-- M10: analitik klik
-- ============================================================

-- Satu baris = satu kali link dibuka. Sengaja TANPA alamat IP dan tanpa data pribadi lain.
create table if not exists public.clicks (
  id bigint generated always as identity primary key,
  -- Link dihapus (atau akunnya dihapus) → semua kliknya ikut terhapus.
  link_id uuid not null references public.links (id) on delete cascade,
  waktu timestamptz not null default now(),
  -- Hanya nama situs asal (mis. instagram.com), bukan alamat lengkap halamannya. null = langsung / scan QR.
  perujuk_domain text
    constraint clicks_perujuk_format check (perujuk_domain ~ '^[a-z0-9.-]{1,253}$'),
  perangkat text not null default 'lainnya'
    constraint clicks_perangkat_pilihan check (perangkat in ('hp', 'tablet', 'komputer', 'lainnya')),
  -- Kode negara 2 huruf dari Vercel (mis. ID). null = tidak diketahui (mis. saat dicoba di localhost).
  negara text
    constraint clicks_negara_format check (negara ~ '^[A-Z]{2}$')
);

-- Mempercepat "klik link ini dalam 30 hari terakhir".
create index if not exists clicks_link_waktu on public.clicks (link_id, waktu desc);

alter table public.clicks enable row level security;

-- User hanya boleh MEMBACA klik dari link miliknya. Tidak ada yang boleh menulis langsung;
-- klik baru hanya masuk lewat fungsi catat_klik() di bawah.
revoke all on public.clicks from anon, authenticated;
grant select on public.clicks to authenticated;

drop policy if exists "clicks: baca milik sendiri" on public.clicks;
create policy "clicks: baca milik sendiri" on public.clicks
  for select to authenticated
  using (exists (
    select 1 from public.links l
    where l.id = link_id and l.pemilik_id = (select auth.uid())
  ));

-- Dipanggil app/[slug]/route.ts SETELAH pengunjung dialihkan (lewat after()).
-- Pengunjung tidak login, jadi fungsi ini security definer. Semua masukan dicek ulang di sini:
-- link harus ada & aktif, nilai yang aneh dibuang (bukan disimpan).
create or replace function public.catat_klik(
  p_link_id uuid,
  p_perujuk text,
  p_perangkat text,
  p_negara text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.links l
    where l.id = p_link_id
      and not l.dinonaktifkan
      and (l.kedaluwarsa is null or l.kedaluwarsa > now())
  ) then
    return;
  end if;

  insert into public.clicks (link_id, perujuk_domain, perangkat, negara)
  values (
    p_link_id,
    case when p_perujuk ~ '^[a-z0-9.-]{1,253}$' then p_perujuk end,
    case when p_perangkat in ('hp', 'tablet', 'komputer') then p_perangkat else 'lainnya' end,
    case when p_negara ~ '^[A-Z]{2}$' then p_negara end
  );

  update public.links set jumlah_klik = jumlah_klik + 1 where id = p_link_id;
end;
$$;

revoke execute on function public.catat_klik(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.catat_klik(uuid, text, text, text) to anon, authenticated;

-- Ringkasan statistik satu link untuk halaman /dasbor/[id]. Semua hitungan memakai jam WIB.
-- security invoker = berjalan dengan hak user yang memanggil, jadi RLS tetap berlaku:
-- link milik orang lain hasilnya kosong (nol semua).
create or replace function public.statistik_link(p_link_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with
  hari_ini as (
    select (now() at time zone 'Asia/Jakarta')::date as tanggal
  ),
  klik as (
    select c.waktu, c.perujuk_domain, c.perangkat, c.negara
    from public.clicks c, hari_ini
    where c.link_id = p_link_id
      and c.waktu >= ((hari_ini.tanggal - 29)::timestamp at time zone 'Asia/Jakarta')
  ),
  per_hari as (
    select (waktu at time zone 'Asia/Jakarta')::date as tanggal, count(*) as klik
    from klik
    group by 1
  ),
  hari as (
    select d::date as tanggal
    from hari_ini,
      generate_series((hari_ini.tanggal - 29)::timestamp, hari_ini.tanggal::timestamp, interval '1 day') d
  )
  select jsonb_build_object(
    -- 30 baris, dari 29 hari lalu sampai hari ini; hari tanpa klik = 0.
    'harian', (
      select jsonb_agg(jsonb_build_object('tanggal', h.tanggal, 'klik', coalesce(p.klik, 0)) order by h.tanggal)
      from hari h left join per_hari p using (tanggal)
    ),
    -- 5 situs asal terbanyak (nama null = langsung / scan QR).
    'perujuk', coalesce((
      select jsonb_agg(jsonb_build_object('nama', x.nama, 'klik', x.klik) order by x.klik desc, x.nama)
      from (
        select perujuk_domain as nama, count(*) as klik from klik
        group by perujuk_domain order by count(*) desc, perujuk_domain limit 5
      ) x
    ), '[]'::jsonb),
    'perangkat', coalesce((
      select jsonb_agg(jsonb_build_object('nama', x.nama, 'klik', x.klik) order by x.klik desc, x.nama)
      from (select perangkat as nama, count(*) as klik from klik group by perangkat) x
    ), '[]'::jsonb),
    -- 5 negara terbanyak (nama null = tidak diketahui).
    'negara', coalesce((
      select jsonb_agg(jsonb_build_object('nama', x.nama, 'klik', x.klik) order by x.klik desc, x.nama)
      from (
        select negara as nama, count(*) as klik from klik
        group by negara order by count(*) desc, negara limit 5
      ) x
    ), '[]'::jsonb)
  );
$$;

revoke execute on function public.statistik_link(uuid) from public, anon, authenticated;
grant execute on function public.statistik_link(uuid) to authenticated;

-- ============================================================
-- M11: link tamu, klaim, laporan, bersih-bersih harian
-- ============================================================

-- Mempercepat pencocokan kode klaim (hanya link tamu yang punya klaim_hash).
create index if not exists links_klaim_hash on public.links (klaim_hash) where klaim_hash is not null;

-- Catatan pembuatan link tamu, untuk batas 5 link per 24 jam per alamat IP.
-- ip_hash = sidik acak (HMAC) alamat IP dari lib/tamu.ts; alamat IP aslinya tidak pernah disimpan.
-- Dikosongkan setiap hari oleh bersihkan_harian().
create table if not exists public.guest_creations (
  id bigint generated always as identity primary key,
  ip_hash text not null constraint guest_creations_hash_format check (ip_hash ~ '^[0-9a-f]{64}$'),
  waktu timestamptz not null default now()
);

create index if not exists guest_creations_ip_waktu on public.guest_creations (ip_hash, waktu desc);

alter table public.guest_creations enable row level security;
-- Tidak ada policy dan tidak ada hak untuk anon/authenticated: hanya server iQRo yang bisa membaca.
revoke all on public.guest_creations from anon, authenticated;
grant select, insert, delete on public.guest_creations to service_role;

-- Membuat link tamu. Dipanggil lib/link.ts (kunci secret) SETELAH link dicek Safe Browsing.
-- Batas dihitung di sini juga, dalam satu transaksi, supaya 2 permintaan bersamaan tidak lolos berdua.
-- Mengembalikan waktu kedaluwarsa link.
create or replace function public.buat_link_tamu(
  p_slug text,
  p_tujuan text,
  p_klaim_hash text,
  p_ip_hash text
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kedaluwarsa timestamptz := now() + interval '30 days';
begin
  if p_klaim_hash is null or p_klaim_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'klaim_tidak_valid' using errcode = 'P0001';
  end if;

  -- Antrekan permintaan dari IP yang sama (kunci dilepas otomatis di akhir transaksi).
  perform pg_advisory_xact_lock(hashtextextended(p_ip_hash, 0));

  if (
    select count(*) from public.guest_creations
    where ip_hash = p_ip_hash and waktu > now() - interval '24 hours'
  ) >= 5 then
    raise exception 'batas_tamu' using errcode = 'P0001';
  end if;

  -- Slug sudah dipakai → error 23505 dan seluruh fungsi batal (catatan di bawah tidak ikut tersimpan).
  insert into public.links (slug, tujuan, pemilik_id, klaim_hash, kedaluwarsa)
  values (p_slug, p_tujuan, null, p_klaim_hash, v_kedaluwarsa);

  insert into public.guest_creations (ip_hash) values (p_ip_hash);
  return v_kedaluwarsa;
end;
$$;

revoke execute on function public.buat_link_tamu(text, text, text, text) from public, anon, authenticated;
grant execute on function public.buat_link_tamu(text, text, text, text) to service_role;

-- Memindahkan link tamu ke akun yang sedang login. p_token = kode rahasia dari penyimpanan
-- browser pembuatnya; database hanya menyimpan hash-nya, jadi kode ini tidak bisa ditebak dari data.
-- Hanya link tamu (belum punya pemilik), belum kedaluwarsa, dan tidak dinonaktifkan.
-- Mengembalikan slug yang berhasil dipindah.
create or replace function public.klaim_link_tamu(p_token text[])
returns table (slug text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'belum_masuk' using errcode = 'P0001';
  end if;
  if coalesce(cardinality(p_token), 0) > 50 then
    raise exception 'terlalu_banyak' using errcode = 'P0001';
  end if;

  return query
  update public.links l
  set pemilik_id = auth.uid(), klaim_hash = null, kedaluwarsa = null
  where l.pemilik_id is null
    and not l.dinonaktifkan
    and l.kedaluwarsa > now()
    and l.klaim_hash in (
      select encode(sha256(convert_to(t, 'UTF8')), 'hex') from unnest(p_token) t
    )
  returning l.slug;
end;
$$;

revoke execute on function public.klaim_link_tamu(text[]) from public, anon, authenticated;
grant execute on function public.klaim_link_tamu(text[]) to authenticated;

-- Laporan link berbahaya dari halaman /laporkan. Fatih memeriksanya di Table Editor,
-- lalu menonaktifkan link: kolom links.dinonaktifkan = true dan links.alasan diisi.
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  -- Link dihapus → laporannya ikut terhapus.
  link_id uuid not null references public.links (id) on delete cascade,
  alasan text not null
    constraint reports_alasan_pilihan check (alasan in ('penipuan', 'malware', 'spam', 'lainnya')),
  keterangan text constraint reports_keterangan_panjang check (char_length(keterangan) <= 500),
  -- Sidik IP pelapor, hanya untuk batas 10 laporan per 24 jam. Dikosongkan setiap hari.
  ip_hash text constraint reports_hash_format check (ip_hash ~ '^[0-9a-f]{64}$'),
  dibuat timestamptz not null default now(),
  ditangani boolean not null default false
);

create index if not exists reports_ip_dibuat on public.reports (ip_hash, dibuat desc)
  where ip_hash is not null;

alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;
grant select, insert, update, delete on public.reports to service_role;

-- Dipanggil lib/laporan.ts (kunci secret).
create or replace function public.kirim_laporan(
  p_slug text,
  p_alasan text,
  p_keterangan text,
  p_ip_hash text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link_id uuid;
begin
  select l.id into v_link_id from public.links l where l.slug = p_slug;
  if v_link_id is null then
    raise exception 'tidak_ada' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_ip_hash, 1));
  if (
    select count(*) from public.reports
    where ip_hash = p_ip_hash and dibuat > now() - interval '24 hours'
  ) >= 10 then
    raise exception 'batas_laporan' using errcode = 'P0001';
  end if;

  insert into public.reports (link_id, alasan, keterangan, ip_hash)
  values (v_link_id, p_alasan, nullif(p_keterangan, ''), p_ip_hash);
end;
$$;

revoke execute on function public.kirim_laporan(text, text, text, text) from public, anon, authenticated;
grant execute on function public.kirim_laporan(text, text, text, text) to service_role;

-- Dipanggil cron harian Vercel (app/api/cron/harian/route.ts). Sekaligus menjaga project
-- Supabase gratis tetap "aktif" (tidak di-pause karena sepi).
create or replace function public.bersihkan_harian()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tamu bigint;
  v_laporan bigint;
begin
  delete from public.guest_creations where waktu < now() - interval '24 hours';
  get diagnostics v_tamu = row_count;

  update public.reports set ip_hash = null
  where ip_hash is not null and dibuat < now() - interval '24 hours';
  get diagnostics v_laporan = row_count;

  return jsonb_build_object('catatan_tamu_dihapus', v_tamu, 'sidik_laporan_dihapus', v_laporan);
end;
$$;

revoke execute on function public.bersihkan_harian() from public, anon, authenticated;
grant execute on function public.bersihkan_harian() to service_role;

-- ============================================================
-- M14: halaman toko (link-in-bio), alamat /toko/<nama_url>
-- ============================================================

-- Satu akun = satu halaman (pemilik_id unik). Aturan sama dengan lib/validasi-toko.ts.
create table if not exists public.toko (
  id uuid primary key default gen_random_uuid(),
  -- Akun dihapus → halaman tokonya ikut terhapus.
  pemilik_id uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  -- Format sama dengan slug link pendek: 3–32 karakter a-z 0-9 -, tidak diawali/diakhiri "-".
  nama_url text not null unique
    constraint toko_nama_url_format check (nama_url ~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$'),
  nama text not null
    constraint toko_nama_panjang check (char_length(btrim(nama)) between 1 and 40),
  deskripsi text constraint toko_deskripsi_panjang check (char_length(deskripsi) <= 160),
  warna text not null default '#E8481C'
    constraint toko_warna_format check (warna ~ '^#[0-9A-Fa-f]{6}$'),
  -- Nomor WhatsApp hanya angka dengan kode negara, mis. 6281234567890. null = tanpa tombol WhatsApp.
  wa_nomor text constraint toko_wa_nomor_format check (wa_nomor ~ '^[1-9][0-9]{9,14}$'),
  wa_pesan text constraint toko_wa_pesan_panjang check (char_length(wa_pesan) <= 300),
  -- Daftar tombol [{label, url}], maksimal 8. Isi tiap tombol dicek server (lib/toko.ts).
  tombol jsonb not null default '[]'::jsonb
    constraint toko_tombol_format check (
      case when jsonb_typeof(tombol) = 'array'
        then jsonb_array_length(tombol) <= 8 and octet_length(tombol::text) <= 8000
        else false
      end
    ),
  -- Hanya satu angka, tanpa data pengunjung apa pun.
  jumlah_kunjungan bigint not null default 0,
  dibuat timestamptz not null default now(),
  diubah timestamptz not null default now(),
  -- Diisi Fatih lewat Table Editor kalau halaman dilaporkan dan terbukti berbahaya.
  dinonaktifkan boolean not null default false,
  alasan text
);

alter table public.toko enable row level security;

revoke all on public.toko from anon, authenticated;
-- User hanya boleh membaca dan menghapus miliknya sendiri. Membuat & mengubah hanya lewat
-- server iQRo (lib/toko.ts, kunci secret), supaya cek Google Safe Browsing tidak bisa dilewati.
grant select, delete on public.toko to authenticated;
grant select, insert, update, delete on public.toko to service_role;

drop policy if exists "toko: baca milik sendiri" on public.toko;
create policy "toko: baca milik sendiri" on public.toko
  for select to authenticated
  using ((select auth.uid()) = pemilik_id);

drop policy if exists "toko: hapus milik sendiri" on public.toko;
create policy "toko: hapus milik sendiri" on public.toko
  for delete to authenticated
  using ((select auth.uid()) = pemilik_id);

-- Kolom "diubah" diperbarui kalau isi halaman berubah (bukan kalau hanya jumlah kunjungan bertambah).
create or replace function public.toko_isi_diubah()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (to_jsonb(new) - 'jumlah_kunjungan' - 'diubah') is distinct from (to_jsonb(old) - 'jumlah_kunjungan' - 'diubah') then
    new.diubah := now();
  end if;
  return new;
end;
$$;

drop trigger if exists toko_diubah on public.toko;
create trigger toko_diubah
  before update on public.toko
  for each row execute function public.toko_isi_diubah();

-- Fungsi publik untuk halaman /toko/[nama]. Pengunjung tidak login, jadi tidak bisa membaca tabel.
-- Hanya kolom yang tampil di halaman, tanpa data pemilik. Halaman nonaktif: hanya id + aktif = false
-- (isinya tidak dibagikan lagi).
create or replace function public.cari_toko(p_nama text)
returns table (
  id uuid,
  nama text,
  deskripsi text,
  warna text,
  wa_nomor text,
  wa_pesan text,
  tombol jsonb,
  aktif boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    t.id,
    case when not t.dinonaktifkan then t.nama end,
    case when not t.dinonaktifkan then t.deskripsi end,
    case when not t.dinonaktifkan then t.warna end,
    case when not t.dinonaktifkan then t.wa_nomor end,
    case when not t.dinonaktifkan then t.wa_pesan end,
    case when not t.dinonaktifkan then t.tombol end,
    not t.dinonaktifkan
  from public.toko t
  where t.nama_url = p_nama;
$$;

revoke execute on function public.cari_toko(text) from public, anon, authenticated;
grant execute on function public.cari_toko(text) to anon, authenticated;

-- Dipanggil app/toko/[nama]/page.tsx SETELAH halaman terkirim (lewat after()).
-- Bot & pratinjau link (mis. WhatsApp) tidak memanggil ini (lib/klik.ts).
create or replace function public.catat_kunjungan_toko(p_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.toko set jumlah_kunjungan = jumlah_kunjungan + 1
  where id = p_id and not dinonaktifkan;
$$;

revoke execute on function public.catat_kunjungan_toko(uuid) from public, anon, authenticated;
grant execute on function public.catat_kunjungan_toko(uuid) to anon, authenticated;

-- /laporkan juga menerima halaman toko. Satu laporan = SATU sasaran: link pendek ATAU halaman toko.
alter table public.reports alter column link_id drop not null;
alter table public.reports
  add column if not exists toko_id uuid references public.toko (id) on delete cascade;
alter table public.reports drop constraint if exists reports_satu_sasaran;
alter table public.reports
  add constraint reports_satu_sasaran check (num_nonnulls(link_id, toko_id) = 1);

-- Dipanggil lib/laporan.ts (kunci secret). Batas 10 laporan per 24 jam per IP dihitung bersama
-- laporan link pendek (kunci antrean yang sama dengan kirim_laporan()).
create or replace function public.kirim_laporan_toko(
  p_nama text,
  p_alasan text,
  p_keterangan text,
  p_ip_hash text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_toko_id uuid;
begin
  select t.id into v_toko_id from public.toko t where t.nama_url = p_nama;
  if v_toko_id is null then
    raise exception 'tidak_ada' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_ip_hash, 1));
  if (
    select count(*) from public.reports
    where ip_hash = p_ip_hash and dibuat > now() - interval '24 hours'
  ) >= 10 then
    raise exception 'batas_laporan' using errcode = 'P0001';
  end if;

  insert into public.reports (toko_id, alasan, keterangan, ip_hash)
  values (v_toko_id, p_alasan, nullif(p_keterangan, ''), p_ip_hash);
end;
$$;

revoke execute on function public.kirim_laporan_toko(text, text, text, text) from public, anon, authenticated;
grant execute on function public.kirim_laporan_toko(text, text, text, text) to service_role;
