"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  IMAGE_BUCKET,
  MAX_LENGTH,
  isSupabaseConfigured,
  supabase,
  type Post,
} from "@/lib/supabase";
import {
  PRESETS,
  PRESET_PREFIX,
  PresetFace,
  isPreset,
} from "@/components/PresetAvatars";

const OWNER_NAME = "Ela";
const OWNER_PHOTO = "/ela.jpg";
const DEFAULT_AUTHOR = "Guest";
const MAX_NAME_LENGTH = 40;
const NAME_STORAGE_KEY = "wall-author-name";
const AVATAR_STORAGE_KEY = "wall-author-avatar";

const AVATAR_GRADIENTS = [
  "from-sky-400 to-indigo-500",
  "from-rose-400 to-orange-400",
  "from-emerald-400 to-teal-500",
  "from-violet-400 to-fuchsia-500",
  "from-amber-400 to-pink-500",
  "from-cyan-400 to-blue-500",
];

// Same name, same colour: makes each visitor recognisable in the feed.
function gradientFor(name: string) {
  let h = 0;
  for (const ch of name.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Shown only when Supabase keys are missing, so the layout can be previewed locally.
const SAMPLE_POSTS: Post[] = [
  {
    id: "sample-1",
    user_id: null,
    body: "Just got a new digital camera, expect way too many photos of my cat 📷",
    image_url: null,
    created_at: new Date(Date.UTC(2026, 0, 1, 12, 0)).toISOString(),
  },
  {
    id: "sample-2",
    user_id: null,
    body: "is listening to the new Coldplay album on repeat",
    image_url: null,
    created_at: new Date(Date.UTC(2026, 0, 1, 10, 30)).toISOString(),
  },
  {
    id: "sample-3",
    user_id: null,
    body: "Happy birthday!! Hope it's a great one 🎉",
    image_url: null,
    created_at: new Date(Date.UTC(2025, 11, 30, 9, 0)).toISOString(),
  },
];

function timeAgo(iso: string, now: number) {
  if (!now) return "";
  const seconds = Math.max(
    0,
    Math.floor((now - new Date(iso).getTime()) / 1000),
  );
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "yesterday" : `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Avatar({ name, avatar }: { name: string; avatar?: string | null }) {
  // Only built-in faces are rendered, never arbitrary URLs from the database.
  if (
    isPreset(avatar) &&
    PRESETS.some((p) => PRESET_PREFIX + p.id === avatar)
  ) {
    return (
      <div
        className="h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white"
        aria-hidden="true"
      >
        <PresetFace id={avatar} className="h-full w-full" />
      </div>
    );
  }
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <div
      className={`grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br ${gradientFor(name)} text-lg font-bold text-white ring-2 ring-white`}
      aria-hidden="true"
    >
      {name === DEFAULT_AUTHOR || !initial ? (
        <svg viewBox="0 0 40 40" className="h-full w-full">
          <circle cx="20" cy="16" r="7" fill="white" fillOpacity="0.9" />
          <path
            d="M6 40c0-9 6.3-14.5 14-14.5S34 31 34 40z"
            fill="white"
            fillOpacity="0.9"
          />
        </svg>
      ) : (
        initial
      )}
    </div>
  );
}

function AvatarPicker({
  name,
  value,
  onChange,
  disabled,
}: {
  name: string;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(next: string | null) {
    onChange(next);
    setOpen(false);
  }

  const optionClass = (selected: boolean) =>
    `aspect-square overflow-hidden rounded-full transition hover:scale-105 ${
      selected
        ? "ring-[3px] ring-indigo-500 ring-offset-2"
        : "ring-1 ring-slate-200 hover:ring-indigo-300"
    }`;

  return (
    <div ref={wrapper} className="relative h-11 shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-label="Choose your avatar"
        aria-expanded={open}
        title="Choose your avatar"
        className="group relative block rounded-full transition hover:opacity-90 disabled:pointer-events-none"
      >
        <Avatar name={name} avatar={value} />
        <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-white text-slate-500 shadow ring-1 ring-slate-200 transition group-hover:text-indigo-500">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose your avatar"
          className="absolute left-0 top-14 z-30 w-64 animate-post-in rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-200"
        >
          <p className="px-1 pb-2 text-xs font-semibold text-slate-500">
            Pick your avatar
          </p>
          <div className="grid grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => pick(null)}
              aria-label="Use my initial"
              aria-pressed={value === null}
              title="Your initial"
              className={optionClass(value === null)}
            >
              <span className="pointer-events-none block scale-[0.82] [&>div]:ring-0">
                <Avatar name={name} />
              </span>
            </button>
            {PRESETS.map((p) => {
              const id = PRESET_PREFIX + p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pick(id)}
                  aria-label={p.label}
                  aria-pressed={value === id}
                  title={p.label}
                  className={optionClass(value === id)}
                >
                  <PresetFace id={p.id} className="h-full w-full" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CharRing({ count }: { count: number }) {
  const remaining = MAX_LENGTH - count;
  const pct = Math.min(count / MAX_LENGTH, 1);
  const r = 9;
  const c = 2 * Math.PI * r;
  const color =
    remaining < 0 ? "#e11d48" : remaining <= 20 ? "#f59e0b" : "#4f46e5";
  return (
    <div className="flex items-center gap-2" aria-live="polite">
      <svg width="24" height="24" viewBox="0 0 24 24" className="-rotate-90">
        <circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="2.5"
        />
        <circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-200"
        />
      </svg>
      <span
        className={`text-xs tabular-nums ${
          remaining <= 20 ? "font-semibold text-amber-600" : "text-slate-400"
        }`}
      >
        {remaining}
      </span>
    </div>
  );
}

function mergePost(list: Post[], post: Post) {
  if (list.some((p) => p.id === post.id)) return list;
  return [post, ...list].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export default function Wall() {
  const [posts, setPosts] = useState<Post[]>(
    isSupabaseConfigured ? [] : SAMPLE_POSTS,
  );
  const [message, setMessage] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  const trimmed = message.trim();
  const remaining = MAX_LENGTH - message.length;
  const canShare =
    isSupabaseConfigured &&
    (trimmed.length > 0 || image !== null) &&
    remaining >= 0 &&
    !sharing;

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

  // Remember the visitor's name between visits (this browser only)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        setAuthorName(localStorage.getItem(NAME_STORAGE_KEY) ?? "");
        const saved = localStorage.getItem(AVATAR_STORAGE_KEY);
        if (isPreset(saved)) setAuthorAvatar(saved);
      } catch {
        // storage blocked: start blank
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  function changeAuthorName(value: string) {
    setAuthorName(value);
    try {
      localStorage.setItem(NAME_STORAGE_KEY, value);
    } catch {
      // storage blocked: name just won't be remembered
    }
  }

  function changeAuthorAvatar(value: string | null) {
    setAuthorAvatar(value);
    try {
      if (value) localStorage.setItem(AVATAR_STORAGE_KEY, value);
      else localStorage.removeItem(AVATAR_STORAGE_KEY);
    } catch {
      // storage blocked: choice just won't be remembered
    }
  }

  const displayAuthor = authorName.trim() || DEFAULT_AUTHOR;

  // Keep "x minutes ago" labels current
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);

  // Grow the textarea with its content
  useEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [message]);

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
        if (uploadError)
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        image_url = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path)
          .data.publicUrl;
      }

      const base = { body: trimmed || null, image_url };
      const withAuthor = {
        ...base,
        author_name: displayAuthor,
        author_avatar_url: authorAvatar,
      };
      let { data, error: insertError } = await supabase
        .from("posts")
        .insert(withAuthor)
        .select()
        .single();
      // Database not migrated for author columns yet: post without them.
      if (insertError?.code === "PGRST204") {
        ({ data, error: insertError } = await supabase
          .from("posts")
          .insert(base)
          .select()
          .single());
      }
      if (insertError) throw new Error(insertError.message);

      setNow(Date.now());
      setPosts((current) => mergePost(current, data as Post));
      markFresh((data as Post).id);
      setMessage("");
      clearImage();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f4f8] text-slate-800">
      {/* Soft background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_70%)]"
      />

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#3b5998] to-indigo-500 text-sm font-black text-white shadow-md shadow-indigo-500/30">
              w
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              thewall
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isSupabaseConfigured && (
              <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
                <span className="relative flex h-2 w-2">
                  {live && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      live ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  />
                </span>
                {live ? "Live" : "Connecting"}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 pb-16 pt-6">
        {/* Cover + profile */}
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
          <div className="relative h-36 bg-gradient-to-br from-[#3b5998] via-indigo-500 to-sky-400 sm:h-44">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_120%,rgba(255,255,255,0.25),transparent_45%),radial-gradient(circle_at_85%_-10%,rgba(255,255,255,0.2),transparent_40%)]" />
          </div>
          <div className="flex flex-col gap-4 px-6 pb-5 sm:flex-row sm:items-end">
            <div className="relative z-10 -mt-12 h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-lg ring-4 ring-white sm:h-28 sm:w-28">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={OWNER_PHOTO}
                alt={`${OWNER_NAME}'s profile picture`}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">
                {OWNER_NAME}
              </h1>
              <p className="text-sm text-slate-500">
                Write something on {OWNER_NAME}&apos;s wall. Everyone sees it
                instantly — just like 2008.
              </p>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-lg font-bold text-slate-900 tabular-nums">
                  {loading ? "–" : posts.length}
                </div>
                <div className="text-xs text-slate-500">Posts</div>
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">280</div>
                <div className="text-xs text-slate-500">Char limit</div>
              </div>
            </div>
          </div>
          <nav className="flex gap-1 border-t border-slate-100 px-4 text-sm">
            <span className="border-b-2 border-indigo-500 px-3 py-3 font-semibold text-indigo-600">
              Wall
            </span>
            <span className="px-3 py-3 text-slate-400">Info</span>
            <span className="px-3 py-3 text-slate-400">Photos</span>
          </nav>
        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="order-2 space-y-4 md:order-1">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
              <h2 className="text-sm font-semibold text-slate-900">About</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-500">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
                    </svg>
                  </span>
                  <div>
                    <dt className="text-xs text-slate-400">Network</dt>
                    <dd className="text-slate-700">The Internet</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-50 text-sky-500">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
                    </svg>
                  </span>
                  <div>
                    <dt className="text-xs text-slate-400">Built with</dt>
                    <dd className="text-slate-700">
                      Next.js · React · Supabase
                    </dd>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-500">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M13 2 3 14h9l-1 8 10-12h-9z" />
                    </svg>
                  </span>
                  <div>
                    <dt className="text-xs text-slate-400">Updates</dt>
                    <dd className="text-slate-700">Realtime, no refresh</dd>
                  </div>
                </div>
              </dl>
            </div>
            <p className="px-2 text-xs text-slate-400">
              Tip: press{" "}
              <kbd className="rounded border border-slate-300 bg-white px-1 font-sans">
                Ctrl
              </kbd>{" "}
              +{" "}
              <kbd className="rounded border border-slate-300 bg-white px-1 font-sans">
                Enter
              </kbd>{" "}
              to share.
            </p>
          </aside>

          {/* Wall column */}
          <section className="order-1 min-w-0 space-y-4 md:order-2">
            {!isSupabaseConfigured && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <strong className="font-semibold">Preview mode.</strong> Add{" "}
                <code className="rounded bg-amber-100 px-1">
                  NEXT_PUBLIC_SUPABASE_URL
                </code>{" "}
                and{" "}
                <code className="rounded bg-amber-100 px-1">
                  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
                </code>{" "}
                to enable posting. The posts below are samples.
              </div>
            )}

            {/* Composer */}
            <form
              onSubmit={handleShare}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 transition focus-within:shadow-md focus-within:ring-indigo-300"
            >
              <div className="flex gap-3">
                <AvatarPicker
                  name={displayAuthor}
                  value={authorAvatar}
                  onChange={changeAuthorAvatar}
                  disabled={!isSupabaseConfigured}
                />
                <div className="min-w-0 flex-1">
                  <label htmlFor="author" className="sr-only">
                    Your name (optional)
                  </label>
                  <input
                    id="author"
                    value={authorName}
                    onChange={(e) => changeAuthorName(e.target.value)}
                    placeholder="Your name (optional)"
                    maxLength={MAX_NAME_LENGTH}
                    autoComplete="nickname"
                    disabled={!isSupabaseConfigured}
                    className="w-full max-w-[240px] rounded-lg bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-900 outline-none ring-1 ring-slate-200 transition placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:ring-indigo-300 disabled:cursor-not-allowed"
                  />
                  <label htmlFor="message" className="sr-only">
                    Write something
                  </label>
                  <textarea
                    ref={textarea}
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                        handleShare();
                    }}
                    placeholder={`Write something on ${OWNER_NAME}'s wall…`}
                    maxLength={MAX_LENGTH}
                    rows={2}
                    disabled={!isSupabaseConfigured}
                    className="block max-h-60 w-full resize-none bg-transparent pt-2.5 text-[15px] leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                  />

                  {preview && (
                    <div className="relative mt-3 inline-block animate-post-in">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt="Selected photo"
                        className="max-h-56 rounded-xl ring-1 ring-slate-200"
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        aria-label="Remove photo"
                        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-slate-900/70 text-white backdrop-blur transition hover:bg-slate-900"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          aria-hidden="true"
                        >
                          <path
                            d="M2 2l8 8M10 2l-8 8"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={!isSupabaseConfigured || sharing}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:pointer-events-none disabled:opacity-40"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-emerald-500"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
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

                <div className="flex items-center gap-3">
                  {message.length > 0 && <CharRing count={message.length} />}
                  <button
                    type="submit"
                    disabled={!canShare}
                    className="rounded-full bg-gradient-to-r from-[#3b5998] to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
                  >
                    {sharing ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Sharing
                      </span>
                    ) : (
                      "Share"
                    )}
                  </button>
                </div>
              </div>
            </form>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                <span className="mt-px">⚠️</span>
                <span className="flex-1">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-rose-400 hover:text-rose-600"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Feed */}
            {loading ? (
              <ul aria-busy="true" className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70"
                  >
                    <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-2.5 pt-1">
                      <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200" />
                      <div className="h-3 w-4/5 animate-pulse rounded-full bg-slate-100" />
                      <div className="h-3 w-2/5 animate-pulse rounded-full bg-slate-100" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-slate-200/70">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-2xl">
                  ✍️
                </div>
                <p className="mt-4 font-semibold text-slate-800">
                  The wall is empty
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Be the first to write something.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {posts.map((post) => (
                  <li
                    key={post.id}
                    className={`group rounded-2xl bg-white p-4 shadow-sm ring-1 transition duration-700 hover:shadow-md ${
                      freshIds.has(post.id)
                        ? "animate-post-in ring-indigo-300 shadow-indigo-100"
                        : "ring-slate-200/70"
                    }`}
                  >
                    <div className="flex gap-3">
                      <Avatar
                        name={post.author_name || DEFAULT_AUTHOR}
                        avatar={post.author_avatar_url}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-slate-900">
                            {post.author_name || DEFAULT_AUTHOR}
                          </span>
                          <time
                            dateTime={post.created_at}
                            title={
                              now
                                ? new Date(post.created_at).toLocaleString()
                                : undefined
                            }
                            className="text-xs text-slate-400"
                          >
                            {timeAgo(post.created_at, now)}
                          </time>
                        </div>
                        {post.body && (
                          <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-700">
                            {post.body}
                          </p>
                        )}
                        {post.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.image_url}
                            alt="Photo attached to post"
                            loading="lazy"
                            className="mt-3 max-h-96 w-auto max-w-full rounded-xl ring-1 ring-slate-200"
                          />
                        )}
                        <div className="mt-3 flex gap-1 text-xs font-medium text-slate-400">
                          <span className="rounded-full px-2.5 py-1 transition group-hover:bg-slate-50 hover:!bg-rose-50 hover:text-rose-500">
                            ♥ Like
                          </span>
                          <span className="rounded-full px-2.5 py-1 transition group-hover:bg-slate-50 hover:!bg-indigo-50 hover:text-indigo-500">
                            💬 Comment
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      <footer className="pb-8 text-center text-xs text-slate-400">
        thewall · a 2008 throwback built with Next.js &amp; Supabase
      </footer>
    </div>
  );
}
