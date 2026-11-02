import type { AiError, ChatTurn } from '../../lib/ai';
import { AI_ERROR_TEXT, modelLabel } from '../../lib/ai';

/** An AI answer: plain text with "- " bullets kept as lines. */
export function AiAnswer({ text, turn }: { text: string; turn?: Pick<ChatTurn, 'model' | 'tier'> }) {
  return (
    <div className="ai-answer grid gap-1 rounded-xl border border-line bg-accentSoft px-3 py-2.5 text-[14px]">
      <div className="label">✨ AI answer</div>
      <div className="whitespace-pre-wrap leading-relaxed">{text.replace(/\*\*/g, '')}</div>
      <p className="ai-model text-[11px] text-muted">{modelLabel(turn ?? {})}. Can be wrong; for pain or injury, see a physio.</p>
    </div>
  );
}

export function AiErrorNote({ code, detail }: { code: AiError; detail?: string }) {
  return (
    <p className="ai-error rounded-lg bg-warnSoft px-3 py-2 text-[13px] text-warn">
      {AI_ERROR_TEXT[code]}{code === 'failed' && detail ? <span className="mt-0.5 block text-[11px] opacity-80">({detail})</span> : null}
    </p>
  );
}
