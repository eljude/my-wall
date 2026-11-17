"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  IMAGE_BUCKET,
  MAX_LENGTH,
  isSupabaseConfigured,
  supabase,
  type Post,
} from "@/lib/supabase";

const AUTHOR_NAME = "Guest";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function timeAgo(iso: string, now: number) {
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes === 1 ? "about a minute ago" : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "about an hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "yesterday" : `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function Avatar({ size = 50 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      aria-hidden="true"
      className="shrink-0 border border-[#ccc] bg-[#f7f7f7]"
    >
      <rect width="50" height="50" fill="#d8dfea" />
      <circle cx="25" cy="19" r="9" fill="#fff" />
      <path d="M8 50c0-11 7.6-18 17-18s17 7 17 18z" fill="#fff" />
    </svg>
  );
}

function mergePost(list: Post[], post: Post) {
  if (list.some((p) => p.id === post.id)) return list;
  return [post, ...list].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export default function Wall() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const trimmed = message.trim();
  const remaining = MAX_LENGTH - message.length;
  const canShare = (trimmed.length > 0 || image !== null) && remaining >= 0 && !sharing;

  const markFresh = useCallback((id: string) => {
    setFreshIds((s) => new Set(s).add(id));
    setTimeout(() => {
      setFreshIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }, 2500);
  }, []);

  // Initial load + realtime subscription
  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let cancelled = false;

    client
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(`Couldn't load the wall: ${error.message}`);
        else setPosts(data ?? []);
        setNow(Date.now());
        setLoading(false);
      });

    const channel = client
      .channel("posts-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          const post = payload.new as Post;
          setNow(Date.now());
          setPosts((current) => mergePost(current, post));
          markFresh(post.id);
        },
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      cancelled = true;
      client.removeChannel(channel);
    };
  }, [markFresh]);

  // Keep "x minutes ago" labels current
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Release object URLs for photo previews
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Photos must be 5 MB or smaller.");
      return;
    }
    setError(null);
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImage(null);
    setPreview(null);
  }

  async function handleShare(e?: React.FormEvent) {
    e?.preventDefault();
    if (!supabase || !canShare) return;
    setSharing(true);
    setError(null);

    try {
      let image_url: string | null = null;
      if (image) {
        const ext = image.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(IMAGE_BUCKET)
          .upload(path, image, { contentType: image.type });
        if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
        image_url = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
      }

      const { data, error: insertError } = await supabase
        .from("posts")
        .insert({ body: trimmed || null, image_url })
        .select()
        .single();
      if (insertError) throw new Error(insertError.message);

      setNow(Date.now());
      setPosts((current) => mergePost(current, data as Post));
      markFresh((data as Post).id);
      setMessage("");
      clearImage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-[13px] text-[#333]">
      {/* Top blue bar */}
      <header className="bg-[#3b5998] border-b border-[#133783]">
        <div className="mx-auto flex h-10 max-w-[980px] items-center justify-between px-4">
          <span className="text-[22px] font-bold tracking-tight text-white">
            thewall
          </span>
          <nav className="hidden gap-5 text-[12px] font-bold text-white sm:flex">
            <span>Home</span>
            <span>Profile</span>
            <span>Friends</span>
            <span>Inbox</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-[980px] flex-col gap-6 px-4 py-5 md:flex-row">
        {/* Left profile column */}
        <aside className="md:w-[200px] md:shrink-0">
          <div className="flex gap-4 md:block">
            <div className="w-[120px] md:w-[200px]">
              <svg viewBox="0 0 200 240" className="w-full border border-[#ccc]" aria-label="Profile picture">
                <rect width="200" height="240" fill="#d8dfea" />
                <circle cx="100" cy="88" r="40" fill="#fff" />
                <path d="M28 240c0-48 32-80 72-80s72 32 72 80z" fill="#fff" />
              </svg>
            </div>
            <div className="md:mt-3">
              <h1 className="text-[18px] font-bold text-[#3b5998] md:hidden">The Wall</h1>
              <ul className="mt-1 space-y-1 text-[11px] text-[#3b5998] md:mt-0">
                <li>View Photos</li>
                <li>Send Message</li>
                <li>Poke!</li>
              </ul>
            </div>
          </div>

          <section className="mt-4 hidden md:block">
            <h2 className="border-t border-[#3b5998] bg-[#d8dfea] px-2 py-1 text-[11px] font-bold text-[#3b5998]">
              Information
            </h2>
            <dl className="px-2 py-2 text-[11px]">
              <dt className="text-[#808080]">Networks:</dt>
              <dd className="mb-2">The Internet</dd>
              <dt className="text-[#808080]">Built with:</dt>
              <dd>Next.js, React &amp; Supabase</dd>
            </dl>
          </section>
        </aside>

        {/* Wall column */}
        <section className="min-w-0 flex-1">
          <h1 className="mb-3 hidden text-[20px] font-bold text-[#333] md:block">The Wall</h1>

          <div className="flex border-b border-[#ccc] text-[12px]">
            <span className="-mb-px border border-b-white border-[#ccc] bg-white px-3 py-1.5 font-bold text-[#333]">
              Wall
            </span>
            <span className="px-3 py-1.5 text-[#3b5998]">Info</span>
            <span className="px-3 py-1.5 text-[#3b5998]">Photos</span>
          </div>

          {!isSupabaseConfigured && (
            <p className="mt-3 border border-[#e2c822] bg-[#fff9d7] p-3 text-[12px]">
              Supabase isn&apos;t configured. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your environment.
            </p>
          )}

          {/* Composer */}
          <form onSubmit={handleShare} className="mt-3 border border-[#bdc7d8] bg-[#f2f2f2] p-2.5">
            <label htmlFor="message" className="sr-only">
              Write something
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleShare();
              }}
              placeholder="What's on your mind?"
              maxLength={MAX_LENGTH}
              rows={3}
              disabled={!isSupabaseConfigured}
              className="block w-full resize-none border border-[#bdc7d8] bg-white p-2 text-[13px] leading-snug outline-none focus:border-[#3b5998]"
            />

            {preview && (
              <div className="relative mt-2 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Selected photo" className="max-h-40 border border-[#ccc]" />
                <button
                  type="button"
                  onClick={clearImage}
                  aria-label="Remove photo"
                  className="absolute right-1 top-1 h-5 w-5 bg-[#333]/80 text-[12px] leading-5 text-white hover:bg-[#333]"
                >
                  ×
                </button>
              </div>
            )}

            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={!isSupabaseConfigured || sharing}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#3b5998] hover:underline disabled:opacity-50"
                >
                  <svg width="14" height="12" viewBox="0 0 14 12" aria-hidden="true">
                    <rect x="0.5" y="2.5" width="13" height="9" fill="none" stroke="currentColor" />
                    <circle cx="7" cy="7" r="2.5" fill="none" stroke="currentColor" />
                    <rect x="4" y="0.5" width="6" height="2" fill="currentColor" />
                  </svg>
                  Photo
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={pickImage}
                  className="hidden"
                />
                <span
                  className={`text-[11px] tabular-nums ${
                    remaining <= 20 ? "font-bold text-[#c00]" : "text-[#808080]"
                  }`}
                  aria-live="polite"
                >
                  {remaining} characters left
                </span>
              </div>

              <button
                type="submit"
                disabled={!canShare}
                className="border border-[#29447e] bg-[#5b74a8] px-4 py-1 text-[12px] font-bold text-white hover:bg-[#4f6aa3] active:bg-[#3b5998] disabled:cursor-not-allowed disabled:border-[#94a2bf] disabled:bg-[#adb9d3]"
              >
                {sharing ? "Sharing…" : "Share"}
              </button>
            </div>
          </form>

          {error && (
            <p role="alert" className="mt-3 border border-[#dd3c10] bg-[#ffebe8] p-2 text-[12px]">
              {error}
            </p>
          )}

          {/* Feed */}
          <div className="mt-4 flex items-center justify-between border-b border-[#ccc] pb-1">
            <h2 className="text-[12px] font-bold text-[#333]">
              Recent posts{posts.length > 0 && ` (${posts.length})`}
            </h2>
            {isSupabaseConfigured && (
              <span className="flex items-center gap-1 text-[11px] text-[#808080]">
                <span
                  className={`h-2 w-2 rounded-full ${live ? "bg-[#42b72a]" : "bg-[#ccc]"}`}
                />
                {live ? "Live" : "Connecting…"}
              </span>
            )}
          </div>

          {loading ? (
            <ul aria-busy="true">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex gap-3 border-b border-[#e9e9e9] py-3">
                  <div className="h-[50px] w-[50px] animate-pulse bg-[#e9e9e9]" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 w-24 animate-pulse bg-[#e9e9e9]" />
                    <div className="h-3 w-3/4 animate-pulse bg-[#e9e9e9]" />
                  </div>
                </li>
              ))}
            </ul>
          ) : posts.length === 0 ? (
            <p className="py-8 text-center text-[12px] text-[#808080]">
              No posts yet. Be the first to write on the wall!
            </p>
          ) : (
            <ul>
              {posts.map((post) => (
                <li
                  key={post.id}
                  className={`flex gap-3 border-b border-[#e9e9e9] px-1 py-3 transition-colors duration-1000 ${
                    freshIds.has(post.id) ? "animate-post-in bg-[#fff9d7]" : "bg-white"
                  }`}
                >
                  <Avatar />
                  <div className="min-w-0 flex-1">
                    <p className="leading-snug">
                      <span className="font-bold text-[#3b5998]">{AUTHOR_NAME}</span>{" "}
                      {post.body && (
                        <span className="whitespace-pre-wrap break-words">{post.body}</span>
                      )}
                    </p>
                    {post.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.image_url}
                        alt="Photo attached to post"
                        loading="lazy"
                        className="mt-2 max-h-80 max-w-full border border-[#ccc]"
                      />
                    )}
                    <p className="mt-1 text-[11px] text-[#808080]">
                      <time dateTime={post.created_at} title={new Date(post.created_at).toLocaleString()}>
                        {timeAgo(post.created_at, now)}
                      </time>
                      {" · "}
                      <span className="text-[#3b5998]">Comment</span>
                      {" · "}
                      <span className="text-[#3b5998]">Like</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="mx-auto max-w-[980px] border-t border-[#ccc] px-4 py-3 text-[11px] text-[#808080]">
        A 2008-style wall · Next.js + Supabase
      </footer>
    </div>
  );
}
