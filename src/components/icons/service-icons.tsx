import type { ReactNode } from "react";

export type ServiceId =
  | "steam"
  | "telegram-stars"
  | "telegram-premium"
  | "gift-cards"
  | "games"
  | "keys";

const icons: Record<ServiceId, ReactNode> = {
  steam: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658a3.28 3.28 0 0 1 1.874-.593c.064 0 .128.004.192.012l2.861-4.142V8.4c0-2.222 1.8-4.025 4.022-4.025 2.223 0 4.025 1.803 4.025 4.025 0 2.222-1.802 4.025-4.025 4.025h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.387 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.972 20.784 7.548 24 11.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12z" />
    </svg>
  ),
  "telegram-stars": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" strokeLinejoin="round" />
    </svg>
  ),
  "telegram-premium": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6">
      <path d="M2 19l3-9 7-4-7-4-3-9 18 7-4 7 4 7 18-7-4-7 4-7z" strokeLinejoin="round" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  ),
  "gift-cards": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6">
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M12 8v13M3 12h18" />
      <path d="M12 8c-2-2.5-4-3.5-6-2s-1 4 2 4h4M12 8c2-2.5 4-3.5 6-2s1 4-2 4h-4" />
    </svg>
  ),
  games: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6">
      <path d="M6 12h4M8 10v4" strokeLinecap="round" />
      <circle cx="15.5" cy="11" r=".75" fill="currentColor" stroke="none" />
      <circle cx="17.75" cy="13.25" r=".75" fill="currentColor" stroke="none" />
      <path d="M8 18h8a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v6a4 4 0 0 0 4 4z" />
    </svg>
  ),
  keys: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-6 w-6">
      <circle cx="8" cy="16" r="4" />
      <path d="M11.5 12.5L21 3M17 3h4v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const tones: Record<ServiceId, string> = {
  steam: "from-[#1a2f45] to-[#0f1923] text-[#66c0f4]",
  "telegram-stars": "from-[#1a3a4f] to-[#0d2433] text-[#38bdf8]",
  "telegram-premium": "from-[#2d2450] to-[#16102a] text-[#a78bfa]",
  "gift-cards": "from-[#3d1f2a] to-[#1a0d12] text-[#f472b6]",
  games: "from-[#1a3330] to-[#0d1a18] text-[#34d399]",
  keys: "from-[#2a2a35] to-[#14141a] text-[#94a3b8]",
};

export function ServiceIcon({ id, className = "" }: { id: ServiceId; className?: string }) {
  return <span className={className}>{icons[id]}</span>;
}

export function ServiceIconBadge({ id }: { id: ServiceId }) {
  return (
    <span
      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tones[id]} shadow-inner`}
    >
      {icons[id]}
    </span>
  );
}

export { tones as serviceTones };
