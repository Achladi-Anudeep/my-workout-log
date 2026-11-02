import { useEffect, useRef, useState } from 'react';
import { AiFailure, askAI, reviewWeek, type AiError, type ChatTurn } from '../../lib/ai';
import { act, useWorkout } from '../../store/workout';
import { AiAnswer, AiErrorNote } from './AiText';

/**
 * A conversation with the AI on one topic. Earlier messages are sent along with each question,
 * so follow-ups ("and how many sets?") make sense. Saved on this device.
 */
export default function AiChat({ thread, context, suggestions, review, inputId }: {
  thread: string;
  /** Built fresh for every question, so the AI always sees the latest logs. */
  context: () => string;
  suggestions?: string[];
  /** The weekly review thread starts with the review task instead of a typed question. */
  review?: boolean;
  inputId?: string;
}) {
  const chat = useWorkout(s => s.aiChats[thread]) ?? [];
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AiError | null>(null);
  const [detail, setDetail] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { if (chat.length) end.current?.scrollIntoView?.({ block: 'nearest' }); }, [chat.length]);

  async function send(question: string, asReview = false) {
    const text = question.trim();
    if (!text || busy) return;
    setBusy(true); setError(null);
    const history = useWorkout.getState().aiChats[thread] ?? [];
    try {
      const r = asReview ? await reviewWeek(context(), history) : await askAI(text, context(), history);
      act().addAiTurn(thread, { role: 'user', text, at: Date.now() });
      act().addAiTurn(thread, { role: 'model', text: r.text, at: Date.now(), model: r.model, tier: r.tier });
      setQ('');
    } catch (err) {
      setError(err instanceof AiFailure ? err.code : 'failed');
      setDetail(err instanceof AiFailure ? err.detail : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      {chat.map((t: ChatTurn, i) => t.role === 'user'
        ? <p key={i} className="ai-q justify-self-end rounded-xl bg-sunk px-3 py-2 text-[14px]">{t.text}</p>
        : <AiAnswer key={i} text={t.text} turn={t} />)}
      {busy && <p className="text-[13px] text-muted">Thinking…</p>}
      {error && <AiErrorNote code={error} detail={detail} />}
      <div ref={end} />

      {review && (
        <button id="ai-review" disabled={busy} onClick={() => void send(chat.length ? 'Review my week again with the latest logs.' : 'Review my week', true)}
          className="h-10 justify-self-start rounded-lg bg-accent px-3 text-[13px] font-bold text-accentInk disabled:opacity-50">
          {busy ? 'Reviewing…' : chat.length ? 'Review again' : 'Review my week'}
        </button>
      )}
      {suggestions && chat.length === 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map(s => (
            <button key={s} disabled={busy} onClick={() => void send(s)} className="rounded-full border border-line bg-bg px-2.5 py-1 text-[12px] font-semibold disabled:opacity-50">{s}</button>
          ))}
        </div>
      )}
      {(!review || chat.length > 0) && (
        <form className="flex gap-2" onSubmit={ev => { ev.preventDefault(); void send(q); }}>
          <input id={inputId} value={q} maxLength={500} onChange={ev => setQ(ev.target.value)} placeholder={chat.length ? 'Ask a follow-up…' : 'Or type your question…'}
            className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 text-[15px]" />
          <button type="submit" disabled={busy || !q.trim()} className="h-10 rounded-lg bg-accent px-3 text-[13px] font-bold text-accentInk disabled:opacity-40">{busy ? '…' : 'Ask'}</button>
        </form>
      )}
      {chat.length > 0 && (
        <button className="justify-self-start text-[12px] font-semibold text-muted" onClick={() => { act().clearAiChat(thread); setError(null); }}>
          Start a new conversation
        </button>
      )}
    </div>
  );
}
