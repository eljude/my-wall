# The Wall

A 2008-style wall built with **React 19 + Next.js + Supabase + Tailwind CSS**, deployed on Vercel.

Visitors type a message, press **Share**, and the post is saved in Supabase. The feed shows every post newest first, and posts are still there after a refresh.

## Features

- Message box with a 280-character limit, enforced in the UI and in the database
- Share button that stays disabled while the box is empty
- Feed sorted newest first, loaded from Supabase
- Live updates via Supabase Realtime, so posts from other visitors appear without a refresh
- Photo upload to Supabase Storage (bonus)
- Loading skeletons, error messages, a character counter and a responsive layout
- Ctrl/Cmd + Enter shares a post

## Setup

1. Create a Supabase project, open the **SQL Editor**, and run [`supabase/schema.sql`](supabase/schema.sql).
   It creates the `posts` table, row-level-security policies for anonymous read/insert, the Realtime publication, and the `post-images` storage bucket.
2. Copy `.env.example` to `.env.local` and fill in the values from **Project Settings → API**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
3. Run it:
   ```bash
   npm install
   npm run dev
   ```

## Deploy

Import the GitHub repo into Vercel, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and deploy. Submit the production URL (`https://<project>.vercel.app`), not a preview URL.
