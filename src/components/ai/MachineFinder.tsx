import { useRef, useState } from 'react';
import Sheet from '../exercise/Sheet';
import DemoGif from '../exercise/DemoGif';
import DemoSheet from '../exercise/DemoSheet';
import { AiFailure, identifyMachine, type AiError, type MachineMatch } from '../../lib/ai';
import { compressPhoto, PhotoStore } from '../../lib/photoStore';
import { useAllExercises } from '../../lib/useRoutine';
import { EXERCISE_LIBRARY } from '../../data/alternatives';
import { detailsOf } from '../../data/details';
import { act } from '../../store/workout';
import type { Exercise } from '../../types';
import { AiErrorNote } from './AiText';

const CONFIDENCE = { high: 'Pretty sure', medium: 'Probably', low: 'Not sure' } as const;

/** Snap a machine → which of your exercises it's for. The AI may only pick from your own exercise list. */
export default function MachineFinder({ onClose }: { onClose: () => void }) {
  const mine = useAllExercises();
  const input = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AiError | null>(null);
  const [match, setMatch] = useState<MachineMatch | null>(null);
  const [shown, setShown] = useState<'best' | 'second'>('best');
  const [howTo, setHowTo] = useState<Exercise | null>(null);
  const [saved, setSaved] = useState('');

  const candidates = [...new Map([...mine, ...EXERCISE_LIBRARY.values()].map(e => [e.id, e])).values()];
  const byId = (id: string | null) => (id ? candidates.find(e => e.id === id) ?? null : null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setBusy(true); setError(null); setMatch(null); setSaved(''); setShown('best');
    try {
      const small = await compressPhoto(file, 768, 0.7);
      setPhoto(small);
      setMatch(await identifyMachine(small, candidates));
    } catch (err) {
      setError(err instanceof AiFailure ? err.code : 'failed');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  const ex = byId(match ? (shown === 'best' ? match.best : match.second) : null);

  if (howTo) return <DemoSheet e={howTo} onClose={() => setHowTo(null)} />;

  return (
    <Sheet title="What's this machine?" onClose={onClose}>
      <input ref={input} id="machine-finder-input" type="file" accept="image/*" className="hidden" onChange={e => void onPick(e.target.files?.[0])} />
      <p className="text-[14px] text-muted">Take a photo of a machine or station. AI matches it to one of your exercises and shows how to use it.</p>
      {photo && <img src={photo} alt="Your photo" className="max-h-56 w-full rounded-xl border border-line object-cover" />}
      <button id="machine-finder-pick" disabled={busy} onClick={() => input.current?.click()}
        className="h-12 rounded-xl bg-accent text-[15px] font-bold text-accentInk disabled:opacity-50">
        {busy ? 'Looking…' : photo ? '📷 Try another photo' : '📷 Take or choose a photo'}
      </button>
      {error && <AiErrorNote code={error} />}

      {match && !busy && (ex ? (
        <div id="machine-match" className="grid gap-2 rounded-xl border border-line bg-surface p-3">
          <div className="label">{shown === 'second' ? 'Second guess' : CONFIDENCE[match.confidence]}{match.machine ? ` · looks like a ${match.machine}` : ''}</div>
          <div className="flex items-center gap-3">
            <DemoGif e={ex} size={80} />
            <div className="min-w-0 flex-1">
              <div className="text-[17px] font-bold">{ex.name}</div>
              {detailsOf(ex)?.equipment && <div className="text-[13px] text-muted">{detailsOf(ex)!.equipment}</div>}
            </div>
          </div>
          {match.reason && <p className="text-[13px] text-muted">{match.reason}</p>}
          <p className="text-[13px]">Does the demo match your machine?</p>
          <div className="flex flex-wrap gap-2">
            <button className="h-10 rounded-lg bg-good px-3 text-[13px] font-bold text-surface" onClick={() => setHowTo(ex)}>✓ Yes, show how to do it</button>
            {photo && (
              <button className="h-10 rounded-lg bg-sunk px-3 text-[13px] font-semibold" disabled={!!saved}
                onClick={async () => { await PhotoStore.put(ex.id, photo); act().setPhoto(ex.id, Date.now()); setSaved(ex.id); }}>
                {saved === ex.id ? '✓ Saved as my photo' : 'Save photo to this exercise'}
              </button>
            )}
            {shown === 'best' && match.second && match.second !== match.best
              ? <button className="h-10 px-2 text-[13px] font-semibold text-muted" onClick={() => setShown('second')}>✗ No, next guess</button>
              : <button className="h-10 px-2 text-[13px] font-semibold text-muted" onClick={() => input.current?.click()}>✗ No, retake</button>}
          </div>
        </div>
      ) : (
        <p id="machine-nomatch" className="rounded-lg bg-sunk px-3 py-3 text-[14px]">
          {match.machine ? `Looks like a ${match.machine}, but ` : ''}it doesn't match any exercise in your list. Try a photo of the whole machine, from the side.
        </p>
      ))}
    </Sheet>
  );
}
