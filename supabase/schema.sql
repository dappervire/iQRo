-- iQRo — skema database link pendek.
-- Cara pakai: Supabase → SQL Editor → New query → tempel SELURUH isi file ini → Run.
-- Aman dijalankan ulang (if not exists / or replace / drop ... if exists).
-- Bagian milestone berikutnya (clicks, reports, guest_creations) ditambahkan di bawah nanti.

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

-- Kolom "diubah" selalu diisi waktu sekarang setiap kali link diubah.
create or replace function public.links_isi_diubah()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.diubah := now();
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
