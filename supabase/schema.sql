-- Run this once in the Supabase SQL Editor.

-- 1. Posts table (280-character limit enforced in the database too)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  body text check (char_length(body) <= 280),
  image_url text,
  created_at timestamptz not null default now(),
  constraint post_not_empty check (
    (body is not null and char_length(trim(body)) > 0) or image_url is not null
  )
);

-- 2. Row Level Security: anyone may read and add posts (no login needed)
grant select, insert on public.posts to anon, authenticated;
alter table public.posts enable row level security;

drop policy if exists "Anyone can read posts" on public.posts;
create policy "Anyone can read posts"
  on public.posts for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can create posts" on public.posts;
create policy "Anyone can create posts"
  on public.posts for insert
  to anon, authenticated
  with check (true);

-- 3. Realtime: broadcast new rows to connected browsers
alter publication supabase_realtime add table public.posts;

-- 4. Photo upload (bonus): public storage bucket, 5 MB images only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Anyone can upload post images" on storage.objects;
create policy "Anyone can upload post images"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'post-images');

drop policy if exists "Anyone can view post images" on storage.objects;
create policy "Anyone can view post images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'post-images');
