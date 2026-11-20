-- Only needed if you ran an older schema.sql without the author columns.
-- Lets each post store the poster's display name and profile picture.
alter table public.posts
  add column if not exists author_name text check (char_length(author_name) <= 40),
  add column if not exists author_avatar_url text;

-- Make the API notice the new columns right away.
notify pgrst, 'reload schema';
