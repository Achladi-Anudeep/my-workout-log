import { useState } from 'react';
import { AiFailure, reviewWeek, weekContext, type AiError } from '../../lib/ai';
import { useWorkout } from '../../store/workout';
import { useActivePlan } from '../../lib/useRoutine';
import { AiAnswer, AiErrorNote } from './AiText';

/** AI look at the last 7 days: workouts, sets, body weight and the coach's calls. */
export default function WeekReview() {
  const sessions = useWorkout(s => s.sessions);
  const weights = useWorkout(s => s.weights);
  const profile = useWorkout(s => s.aiProfile);
  const { plan } = useActivePlan();
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<AiError | null>(null);
  const [detail, setDetail] = useState('');

  async function run() {
    setBusy(true); setError(null);
    try { setText(await reviewWeek(weekContext(profile, plan, sessions, weights))); }
    catch (err) { setError(err instanceof AiFailure ? err.code : 'failed'); setDetail(err instanceof AiFailure ? err.detail : String(err)); }
    finally { setBusy(false); }
  }

  return (
    <section className="grid gap-2 rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="label">✨ AI weekly review</div>
          <p className="text-[13px] text-muted">Your last 7 days of workouts and body weight.</p>
        </div>
        <button id="ai-review" disabled={busy} onClick={() => void run()} className="h-10 shrink-0 rounded-lg bg-accent px-3 text-[13px] font-bold text-accentInk disabled:opacity-50">
          {busy ? 'Reviewing…' : text ? 'Again' : 'Review my week'}
        </button>
      </div>
      {error && <AiErrorNote code={error} detail={detail} />}
      {text && !busy && <AiAnswer text={text} />}
    </section>
  );
}
