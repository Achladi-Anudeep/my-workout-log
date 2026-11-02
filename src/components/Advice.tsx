import { useState } from 'react';
import type { AdviceKind } from '../lib/coach';

const ADVICE_TONE: Record<AdviceKind, string> = {
  new: 'bg-sunk text-muted', up: 'bg-goodSoft text-good', harder: 'bg-goodSoft text-good', hold: 'bg-accentSoft text-accent',
  down: 'bg-warnSoft text-warn', 'easy-week': 'bg-warnSoft text-warn', comeback: 'bg-warnSoft text-warn',
};
const ADVICE_ICON: Record<AdviceKind, string> = { new: '●', up: '▲', harder: '▲', hold: '■', down: '▼', 'easy-week': '▼', comeback: '↺' };

/** Coach's call for next time: add weight, stay, or go lighter. Tap for the reason. */
export default function Advice({ kind, title, detail }: { kind: AdviceKind; title: string; detail: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="grid w-full gap-1">
      <button className={`advice justify-self-start rounded-md px-2 py-1 text-[13px] font-semibold ${ADVICE_TONE[kind]}`} aria-expanded={open} onClick={() => setOpen(!open)}>
        {ADVICE_ICON[kind]} {title} <span className="opacity-70">{open ? '▴' : 'ⓘ'}</span>
      </button>
      {open && <span className="text-[13px] text-muted">{detail}</span>}
    </span>
  );
}

