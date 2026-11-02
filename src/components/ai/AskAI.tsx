import { useState } from 'react';
import { AiFailure, askAI, exerciseContext, type AiError } from '../../lib/ai';
import { useWorkout } from '../../store/workout';
import type { Exercise } from '../../types';
import { AiAnswer, AiErrorNote } from './AiText';

const SUGGESTIONS = [
  'Is this safe for my knee? Anything to change?',
  'What should I feel, and where?',
  'How do I set up this machine?',
  'My weight isn’t going up. What should I do?',
];

/** "Ask AI about this exercise": the AI gets the plan, the how-to, your recent sets and your profile. */
export default function AskAI({ e }: { e: Exercise }) {
  const sessions = useWorkout(s => s.sessions);
  const profile = useWorkout(s => s.aiProfile);
  const note = useWorkout(s => s.machineNotes[e.id]?.text);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<{ q: string; text: string } | null>(null);
  const [error, setError] = useState<AiError | null>(null);
  const [detail, setDetail] = useState('');

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    setBusy(true); setError(null);
    try {
      const text = await askAI(question.trim(), exerciseContext(profile, e, sessions, note));
      setAnswer({ q: question.trim(), text });
      setQ('');
    } catch (err) {
      setError(err instanceof AiFailure ? err.code : 'failed'); setDetail(err instanceof AiFailure ? err.detail : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return <button className="justify-self-start text-[14px] font-semibold text-accent" onClick={() => setOpen(true)}>✨ Ask AI about this exercise</button>;
  }
  return (
    <section className="grid gap-2 rounded-xl border border-line bg-surface p-3">
      <div className="flex items-center justify-between"><span className="label">✨ Ask AI · {e.name}</span>
        <button className="text-[13px] font-semibold text-muted" onClick={() => setOpen(false)}>Close</button></div>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map(s => (
          <button key={s} disabled={busy} onClick={() => void ask(s)} className="rounded-full border border-line bg-bg px-2.5 py-1 text-[12px] font-semibold disabled:opacity-50">{s}</button>
        ))}
      </div>
      <form className="flex gap-2" onSubmit={ev => { ev.preventDefault(); void ask(q); }}>
        <input id={`ai-q-${e.id}`} value={q} maxLength={500} onChange={ev => setQ(ev.target.value)} placeholder="Or type your question…"
          className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 text-[15px]" />
        <button type="submit" disabled={busy || !q.trim()} className="h-10 rounded-lg bg-accent px-3 text-[13px] font-bold text-accentInk disabled:opacity-40">{busy ? '…' : 'Ask'}</button>
      </form>
      {busy && <p className="text-[13px] text-muted">Thinking…</p>}
      {error && <AiErrorNote code={error} detail={detail} />}
      {answer && !busy && (
        <>
          <p className="text-[13px] text-muted">You asked: {answer.q}</p>
          <AiAnswer text={answer.text} />
        </>
      )}
    </section>
  );
}
