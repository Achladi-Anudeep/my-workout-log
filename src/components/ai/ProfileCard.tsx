import { useState } from 'react';
import { act, useWorkout } from '../../store/workout';
import { DEFAULT_PROFILE } from '../../lib/ai';

/** What the AI should know about you. Kept on this device. */
export default function ProfileCard() {
  const profile = useWorkout(s => s.aiProfile);
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <section className="card px-4 py-3">
      <div className="label">About me (for AI)</div>
      {draft == null ? (
        <>
          <p className="mt-1 whitespace-pre-wrap text-[14px]">{profile}</p>
          <button id="ai-profile-edit" className="mt-2 text-[14px] font-semibold text-accent" onClick={() => setDraft(profile)}>Edit</button>
        </>
      ) : (
        <form className="mt-2 grid gap-2" onSubmit={e => { e.preventDefault(); act().setAiProfile(draft); setDraft(null); }}>
          <textarea id="ai-profile" rows={6} maxLength={1200} value={draft} onChange={e => setDraft(e.target.value)}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-[15px]" />
          <div className="flex gap-3">
            <button type="submit" className="h-10 rounded-lg bg-accent px-3 text-[13px] font-bold text-accentInk">Save</button>
            <button type="button" className="h-10 px-1 text-[13px] font-semibold text-muted" onClick={() => setDraft(DEFAULT_PROFILE)}>Reset</button>
            <button type="button" className="h-10 px-1 text-[13px] font-semibold text-muted" onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </form>
      )}
      <p className="mt-2 text-[12px] text-muted">Sent with your questions so answers fit you. Don’t put anything private here.</p>
    </section>
  );
}
