import type { ReactNode } from 'react';

export function Plate({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <span aria-hidden className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: color, boxShadow: `inset 0 0 0 2px var(--surface), 0 0 0 1px ${color}` }} />
  );
}

const TONES = {
  good: 'bg-goodSoft text-good',
  warn: 'bg-warnSoft text-warn',
  accent: 'bg-accentSoft text-accent',
  muted: 'bg-sunk text-muted',
} as const;

export function Chip({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-semibold ${TONES[tone]}`}>{children}</span>;
}

export function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 10.5l3.5 3.5 7.5-8" />
    </svg>
  );
}

export function PlateLogo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden>
      <circle cx="13" cy="13" r="12" fill="var(--p-red)" />
      <circle cx="13" cy="13" r="8" fill="none" stroke="var(--surface)" strokeWidth="1.5" />
      <circle cx="13" cy="13" r="3" fill="var(--surface)" />
    </svg>
  );
}
