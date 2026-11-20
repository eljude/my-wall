"use client";

import { useMemo, useSyncExternalStore } from "react";

// No login: each visitor's name and picture live in their own browser.
export type Profile = {
  name: string;
  avatarUrl: string | null;
};

export const DEFAULT_NAME = "Guest";
export const MAX_NAME_LENGTH = 40;

const STORAGE_KEY = "wall-profile";
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): Profile {
  if (!raw) return { name: DEFAULT_NAME, avatarUrl: null };
  try {
    const p = JSON.parse(raw) as Partial<Profile>;
    const name = typeof p.name === "string" ? p.name.trim().slice(0, MAX_NAME_LENGTH) : "";
    return {
      name: name || DEFAULT_NAME,
      avatarUrl: typeof p.avatarUrl === "string" ? p.avatarUrl : null,
    };
  } catch {
    return { name: DEFAULT_NAME, avatarUrl: null };
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

export function saveProfile(profile: Profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage blocked (private mode etc.): the profile just won't persist.
  }
  listeners.forEach((cb) => cb());
}

export function useProfile(): Profile {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  return useMemo(() => parse(raw), [raw]);
}

// Center-crop to a square and shrink, so avatars upload fast and look sharp.
export async function toSquareJpeg(file: File, size = 256): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't process the image.");
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  );
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't process the image."))),
      "image/jpeg",
      0.88,
    ),
  );
}
