"use client";

import { useEffect, useRef, useState } from "react";
import { IMAGE_BUCKET, supabase } from "@/lib/supabase";
import {
  DEFAULT_NAME,
  MAX_NAME_LENGTH,
  saveProfile,
  toSquareJpeg,
  type Profile,
} from "@/lib/profile";
import { PRESETS, PRESET_PREFIX, PresetFace, isPreset } from "@/components/PresetAvatars";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export default function ProfileSettings({
  profile,
  onClose,
}: {
  profile: Profile;
  onClose: () => void;
}) {
  const [name, setName] = useState(profile.name === DEFAULT_NAME ? "" : profile.name);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatarUrl);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInput.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Photos must be 5 MB or smaller.");
      return;
    }
    setError(null);
    setNewFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function choosePreset(id: string) {
    setNewFile(null);
    setPreview(null);
    setAvatarUrl(`${PRESET_PREFIX}${id}`);
  }

  function removePhoto() {
    setNewFile(null);
    setPreview(null);
    setAvatarUrl(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let finalUrl = avatarUrl;
      if (newFile) {
        if (!supabase) throw new Error("Connect Supabase to upload a profile picture.");
        const blob = await toSquareJpeg(newFile);
        const path = `avatars/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from(IMAGE_BUCKET)
          .upload(path, blob, { contentType: "image/jpeg" });
        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
        finalUrl = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
      }
      saveProfile({ name: name.trim() || DEFAULT_NAME, avatarUrl: finalUrl });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setSaving(false);
    }
  }

  const shownPhoto = preview ?? avatarUrl;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <form
        onSubmit={handleSave}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-sm animate-post-in overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200"
      >
        <div className="flex items-center justify-between">
          <h2 id="settings-title" className="text-lg font-bold text-slate-900">
            Edit profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Photo */}
        <div className="mt-6 flex flex-col items-center">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="group relative h-28 w-28 overflow-hidden rounded-full bg-gradient-to-br from-sky-300 to-indigo-500 ring-4 ring-indigo-50 transition hover:ring-indigo-100"
            aria-label="Change profile picture"
          >
            {isPreset(shownPhoto) ? (
              <PresetFace id={shownPhoto} className="h-full w-full" />
            ) : shownPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shownPhoto} alt="" className="h-full w-full object-cover" />
            ) : (
              <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden="true">
                <circle cx="20" cy="16" r="7" fill="white" fillOpacity="0.9" />
                <path d="M6 40c0-9 6.3-14.5 14-14.5S34 31 34 40z" fill="white" fillOpacity="0.9" />
              </svg>
            )}
            <span className="absolute inset-0 grid place-items-center bg-slate-900/45 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
              Change
            </span>
          </button>
          <div className="mt-3 flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="rounded-full px-3 py-1 font-medium text-indigo-600 transition hover:bg-indigo-50"
            >
              Upload photo
            </button>
            {shownPhoto && (
              <button
                type="button"
                onClick={removePhoto}
                className="rounded-full px-3 py-1 font-medium text-slate-500 transition hover:bg-slate-100"
              >
                Remove
              </button>
            )}
          </div>
          <p className="mt-5 self-start text-sm font-medium text-slate-700">
            Or pick a face
          </p>
          <div className="mt-2 grid w-full grid-cols-4 gap-2.5">
            {PRESETS.map((p) => {
              const selected = !preview && avatarUrl === `${PRESET_PREFIX}${p.id}`;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => choosePreset(p.id)}
                  aria-label={p.label}
                  aria-pressed={selected}
                  title={p.label}
                  className={`aspect-square overflow-hidden rounded-full transition hover:scale-105 ${
                    selected
                      ? "ring-[3px] ring-indigo-500 ring-offset-2"
                      : "ring-1 ring-slate-200 hover:ring-indigo-300"
                  }`}
                >
                  <PresetFace id={p.id} className="h-full w-full" />
                </button>
              );
            })}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={pickFile}
            className="hidden"
          />
        </div>

        {/* Name */}
        <label htmlFor="display-name" className="mt-6 block text-sm font-medium text-slate-700">
          Display name
        </label>
        <input
          ref={nameInput}
          id="display-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_NAME_LENGTH}
          placeholder={DEFAULT_NAME}
          autoComplete="nickname"
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[15px] outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
        />
        <p className="mt-1.5 text-xs text-slate-400">
          Shown on your posts. Saved in this browser only.
        </p>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-gradient-to-r from-[#3b5998] to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110 active:scale-[0.97] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
