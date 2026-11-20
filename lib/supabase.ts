import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!)
  : null;

export type Post = {
  id: string;
  user_id: string | null;
  body: string | null;
  image_url: string | null;
  author_name?: string | null;
  author_avatar_url?: string | null;
  created_at: string;
};

export const MAX_LENGTH = 280;
export const IMAGE_BUCKET = "post-images";
