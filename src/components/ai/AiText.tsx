import type { AiError } from '../../lib/ai';
import { AI_ERROR_TEXT } from '../../lib/ai';

/** An AI answer: plain text with "- " bullets kept as lines. */
export function AiAnswer({ text }: { text: string }) {
  return (
    <div className="ai-answer grid gap-1 rounded-xl border border-line bg-accentSoft px-3 py-2.5 text-[14px]">
      <div className="label">✨ AI answer</div>
      <div className="whitespace-pre-wrap leading-relaxed">{text.replace(/\*\*/g, '')}</div>
      <p className="text-[11px] text-muted">Gemini (free). Can be wrong; for pain or injury, see a physio.</p>
    </div>
  );
}

export function AiErrorNote({ code }: { code: AiError }) {
  return <p className="ai-error rounded-lg bg-warnSoft px-3 py-2 text-[13px] text-warn">{AI_ERROR_TEXT[code]}</p>;
}
