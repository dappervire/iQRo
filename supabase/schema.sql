-- iQRo — skema database link pendek.
-- Cara pakai: Supabase → SQL Editor → New query → tempel SELURUH isi file ini → Run.
-- Aman dijalankan ulang (if not exists / or replace / drop ... if exists).
-- Bagian milestone berikutnya (reports, guest_creations) ditambahkan di bawah nanti.

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
grant select, delete on public.links to authenticated;
-- Hanya kolom ini yang boleh diisi/diubah user; jumlah_klik, dinonaktifkan, dll. tidak.
grant insert (slug, tujuan) on public.links to authenticated;
grant update (tujuan) on public.links to authenticated;

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
