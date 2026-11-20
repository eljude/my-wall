// Built-in illustrated avatars. Stored as "preset:<id>" in place of an image URL.

import type { ReactNode } from "react";

export const PRESET_PREFIX = "preset:";

function Eyes({
  y = 50,
  gap = 13,
  r = 4.2,
}: {
  y?: number;
  gap?: number;
  r?: number;
}) {
  return (
    <>
      <circle cx={50 - gap} cy={y} r={r} fill="#2b2b33" />
      <circle cx={50 + gap} cy={y} r={r} fill="#2b2b33" />
      <circle cx={50 - gap + 1.4} cy={y - 1.5} r={r * 0.35} fill="#fff" />
      <circle cx={50 + gap + 1.4} cy={y - 1.5} r={r * 0.35} fill="#fff" />
    </>
  );
}

function Blush({ y = 60, gap = 22 }: { y?: number; gap?: number }) {
  return (
    <>
      <ellipse
        cx={50 - gap}
        cy={y}
        rx="5.5"
        ry="3.2"
        fill="#ff8fa3"
        opacity="0.55"
      />
      <ellipse
        cx={50 + gap}
        cy={y}
        rx="5.5"
        ry="3.2"
        fill="#ff8fa3"
        opacity="0.55"
      />
    </>
  );
}

function Smile({ y = 62 }: { y?: number }) {
  return (
    <path
      d={`M${44} ${y}q3 3.5 6 0q3 3.5 6 0`}
      fill="none"
      stroke="#2b2b33"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

type Preset = { id: string; label: string; bg: string; face: ReactNode };

export const PRESETS: Preset[] = [
  {
    id: "cat",
    label: "Cat",
    bg: "#ffe8cc",
    face: (
      <>
        <path d="M22 44 L26 14 L46 30 Z" fill="#f4a259" />
        <path d="M78 44 L74 14 L54 30 Z" fill="#f4a259" />
        <path d="M28 36 L30 22 L40 31 Z" fill="#ffb3c1" />
        <path d="M72 36 L70 22 L60 31 Z" fill="#ffb3c1" />
        <ellipse cx="50" cy="56" rx="32" ry="28" fill="#f4a259" />
        <path d="M50 30 l-4 8 h8 z" fill="#e08a3c" opacity="0.7" />
        <ellipse cx="50" cy="66" rx="14" ry="10" fill="#fff4e6" />
        <Eyes y={52} />
        <path d="M47 59 h6 l-3 3.2 z" fill="#ff7a93" />
        <Smile y={63} />
        <g
          stroke="#a0603a"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.7"
        >
          <path d="M30 60 h-12M30 65 l-11 3M70 60 h12M70 65 l11 3" />
        </g>
        <Blush y={60} gap={24} />
      </>
    ),
  },
  {
    id: "dog",
    label: "Dog",
    bg: "#e0f0ff",
    face: (
      <>
        <ellipse cx="50" cy="54" rx="30" ry="29" fill="#d9a066" />
        <ellipse
          cx="22"
          cy="50"
          rx="10"
          ry="20"
          fill="#8b5a2b"
          transform="rotate(18 22 50)"
        />
        <ellipse
          cx="78"
          cy="50"
          rx="10"
          ry="20"
          fill="#8b5a2b"
          transform="rotate(-18 78 50)"
        />
        <ellipse cx="62" cy="44" rx="9" ry="8" fill="#c48a52" />
        <ellipse cx="50" cy="66" rx="15" ry="11" fill="#f6e3cb" />
        <Eyes y={50} gap={12} />
        <ellipse cx="50" cy="61" rx="5" ry="3.6" fill="#2b2b33" />
        <path
          d="M46 67 q4 3 8 0"
          fill="none"
          stroke="#2b2b33"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M48 68 q2 7 4 0" fill="#ff7a93" />
        <Blush y={60} gap={21} />
      </>
    ),
  },
  {
    id: "bear",
    label: "Bear",
    bg: "#f3e6ff",
    face: (
      <>
        <circle cx="25" cy="28" r="11" fill="#9c6b4a" />
        <circle cx="75" cy="28" r="11" fill="#9c6b4a" />
        <circle cx="25" cy="28" r="5.5" fill="#d8b49a" />
        <circle cx="75" cy="28" r="5.5" fill="#d8b49a" />
        <circle cx="50" cy="54" r="31" fill="#9c6b4a" />
        <ellipse cx="50" cy="64" rx="14" ry="11" fill="#e8cdb6" />
        <Eyes y={49} gap={12} />
        <ellipse cx="50" cy="59" rx="5" ry="3.5" fill="#2b2b33" />
        <Smile y={64} />
        <Blush y={60} gap={21} />
      </>
    ),
  },
  {
    id: "panda",
    label: "Panda",
    bg: "#dcf5e6",
    face: (
      <>
        <circle cx="25" cy="28" r="11" fill="#2b2b33" />
        <circle cx="75" cy="28" r="11" fill="#2b2b33" />
        <circle cx="50" cy="54" r="31" fill="#fff" />
        <ellipse
          cx="37"
          cy="51"
          rx="8"
          ry="10"
          fill="#2b2b33"
          transform="rotate(25 37 51)"
        />
        <ellipse
          cx="63"
          cy="51"
          rx="8"
          ry="10"
          fill="#2b2b33"
          transform="rotate(-25 63 51)"
        />
        <circle cx="38" cy="50" r="3.4" fill="#fff" />
        <circle cx="62" cy="50" r="3.4" fill="#fff" />
        <circle cx="38.8" cy="50" r="1.8" fill="#2b2b33" />
        <circle cx="62.8" cy="50" r="1.8" fill="#2b2b33" />
        <ellipse cx="50" cy="61" rx="4.5" ry="3.2" fill="#2b2b33" />
        <Smile y={66} />
        <Blush y={64} gap={22} />
      </>
    ),
  },
  {
    id: "fox",
    label: "Fox",
    bg: "#fff1d6",
    face: (
      <>
        <path d="M20 46 L22 12 L44 32 Z" fill="#ef7d3c" />
        <path d="M80 46 L78 12 L56 32 Z" fill="#ef7d3c" />
        <path d="M26 36 L27 21 L37 30 Z" fill="#2b2b33" />
        <path d="M74 36 L73 21 L63 30 Z" fill="#2b2b33" />
        <path
          d="M18 46 Q22 26 50 26 Q78 26 82 46 Q80 70 50 84 Q20 70 18 46 Z"
          fill="#ef7d3c"
        />
        <path
          d="M20 50 Q34 56 50 84 Q66 56 80 50 Q76 72 50 84 Q24 72 20 50 Z"
          fill="#fff"
        />
        <path
          d="M50 84 Q36 64 30 54 Q42 60 50 60 Q58 60 70 54 Q64 64 50 84 Z"
          fill="#fff"
        />
        <Eyes y={48} gap={13} />
        <ellipse cx="50" cy="66" rx="4.5" ry="3.2" fill="#2b2b33" />
        <Blush y={58} gap={23} />
      </>
    ),
  },
  {
    id: "bunny",
    label: "Bunny",
    bg: "#ffe3ec",
    face: (
      <>
        <ellipse
          cx="37"
          cy="22"
          rx="8"
          ry="20"
          fill="#fff"
          stroke="#ead7dd"
          strokeWidth="1.5"
        />
        <ellipse
          cx="63"
          cy="22"
          rx="8"
          ry="20"
          fill="#fff"
          stroke="#ead7dd"
          strokeWidth="1.5"
        />
        <ellipse cx="37" cy="23" rx="3.8" ry="14" fill="#ffb3c6" />
        <ellipse cx="63" cy="23" rx="3.8" ry="14" fill="#ffb3c6" />
        <circle
          cx="50"
          cy="58"
          r="28"
          fill="#fff"
          stroke="#ead7dd"
          strokeWidth="1.5"
        />
        <Eyes y={54} gap={11} />
        <path d="M47 61 h6 l-3 3 z" fill="#ff7a93" />
        <path
          d="M50 64 v3"
          stroke="#2b2b33"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <Smile y={66} />
        <Blush y={63} gap={20} />
      </>
    ),
  },
  {
    id: "frog",
    label: "Frog",
    bg: "#e6f7d9",
    face: (
      <>
        <circle cx="33" cy="34" r="12" fill="#7ac74f" />
        <circle cx="67" cy="34" r="12" fill="#7ac74f" />
        <ellipse cx="50" cy="60" rx="34" ry="24" fill="#7ac74f" />
        <circle cx="33" cy="33" r="7" fill="#fff" />
        <circle cx="67" cy="33" r="7" fill="#fff" />
        <circle cx="34" cy="34" r="4" fill="#2b2b33" />
        <circle cx="68" cy="34" r="4" fill="#2b2b33" />
        <circle cx="35.3" cy="32.5" r="1.4" fill="#fff" />
        <circle cx="69.3" cy="32.5" r="1.4" fill="#fff" />
        <path
          d="M34 62 Q50 74 66 62"
          fill="none"
          stroke="#2f6b1f"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="45" cy="54" r="1.4" fill="#2f6b1f" />
        <circle cx="55" cy="54" r="1.4" fill="#2f6b1f" />
        <Blush y={62} gap={26} />
      </>
    ),
  },
  {
    id: "chick",
    label: "Chick",
    bg: "#e0f4ff",
    face: (
      <>
        <path
          d="M46 24 q4 -10 8 0 q2 -8 6 -2"
          fill="none"
          stroke="#f2c230"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="50" cy="56" r="31" fill="#ffd93d" />
        <Eyes y={50} gap={12} />
        <path d="M43 59 L57 59 L50 67 Z" fill="#f59e0b" />
        <path d="M43 59 L57 59 L50 62 Z" fill="#fbbf24" />
        <Blush y={60} gap={22} />
      </>
    ),
  },
];

export function isPreset(src: string | null | undefined): src is string {
  return !!src && src.startsWith(PRESET_PREFIX);
}

export function PresetFace({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const preset = PRESETS.find(
    (p) => `${PRESET_PREFIX}${p.id}` === id || p.id === id,
  );
  if (!preset) return null;
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <rect width="100" height="100" fill={preset.bg} />
      <g transform="translate(0 4)">{preset.face}</g>
    </svg>
  );
}
