import { useEffect, useRef, useState } from 'react';
import { act, useWorkout } from '../store/workout';
import { PhotoStore, compressPhoto } from '../lib/photoStore';
import { AiFailure, reviewBody, type AiError, type AiReply } from '../lib/ai';
import { fmtKg } from '../lib/weight';
import { uid } from '../lib/utils';
import type { BodyPhoto } from '../types';
import { AiAnswer, AiErrorNote } from './ai/AiText';

type Pose = BodyPhoto['pose'];
const key = (id: string) => `body:${id}`;
const fmtDay = (at: number) => new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function useImage(id: string | undefined) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    setSrc(null);
    if (id) PhotoStore.get(key(id)).then(v => { if (live) setSrc(v); });
    return () => { live = false; };
  }, [id]);
  return src;
}

function Shot({ p, tag }: { p?: BodyPhoto; tag: string }) {
  const src = useImage(p?.id);
  return (
    <figure className="m-0 grid gap-1">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-sunk">
        {src
          ? <img src={src} alt={`${p!.pose} photo, ${fmtDay(p!.at)}`} className="anim-fade h-full w-full object-cover" />
          : <span className="grid h-full place-items-center px-3 text-center text-[12px] text-muted">{p ? 'Loading…' : 'No photo yet'}</span>}
        <span className="disp absolute left-2 top-2 rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-bg">{tag}</span>
      </div>
      <figcaption className="text-center text-[12px] text-muted">{p ? fmtDay(p.at) : '—'}</figcaption>
    </figure>
  );
}

/**
 * Monthly progress photos (front and side, neck down). Images stay on this phone only.
 * Compare the first with the latest, and ask the AI what has visibly changed.
 */
export default function ProgressPhotos() {
  const all = useWorkout(s => s.bodyPhotos);
  const weights = useWorkout(s => s.weights);
  const profile = useWorkout(s => s.aiProfile);
  const [pose, setPose] = useState<Pose>('front');
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState<{ reply?: AiReply; error?: AiError; detail?: string; busy?: boolean }>({});
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  // Hidden until you tap: the photos are private and only load when opened.
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const list = all.filter(p => p.pose === pose); // newest first
  const latest = list[0];
  const first = list.length > 1 ? list[list.length - 1] : undefined;
  const lastAt = all[0]?.at;
  const due = !lastAt || Date.now() - lastAt > 28 * 86400000;

  async function add(file: File) {
    setBusy(true);
    try {
      const image = await compressPhoto(file, 900, 0.75);
      const p: BodyPhoto = { id: uid(), at: Date.now(), pose };
      await PhotoStore.put(key(p.id), image);
      act().addBodyPhoto(p);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  async function remove(p: BodyPhoto) {
    await PhotoStore.del(key(p.id));
    act().removeBodyPhoto(p.id);
    setConfirmDel(null);
  }

  async function review() {
    setAi({ busy: true });
    const shots: { label: string; image: string }[] = [];
    for (const ps of (['front', 'side'] as Pose[])) {
      const xs = all.filter(p => p.pose === ps);
      if (xs.length < 2) continue;
      for (const [p, when] of [[xs[xs.length - 1], 'earliest'], [xs[0], 'latest']] as const) {
        const image = await PhotoStore.get(key(p.id));
        if (image) shots.push({ label: `${ps === 'front' ? 'Front' : 'Side'} · ${fmtDay(p.at)} (${when})`, image });
      }
    }
    if (shots.length < 2) { setAi({ error: 'failed', detail: 'Add at least two photos of the same pose, a few weeks apart.' }); return; }
    const w = [...weights].sort((a, b) => a.at - b.at);
    const trend = w.length ? `Body weight: ${fmtKg(w[0].kg)} kg on ${fmtDay(w[0].at)} → ${fmtKg(w[w.length - 1].kg)} kg on ${fmtDay(w[w.length - 1].at)}.` : 'No weigh-ins logged.';
    try {
      setAi({ reply: await reviewBody(shots, `${profile}\n${trend}`) });
    } catch (err) {
      setAi({ error: err instanceof AiFailure ? err.code : 'failed', detail: err instanceof AiFailure ? err.detail : String(err) });
    }
  }

  const comparable = (['front', 'side'] as Pose[]).some(ps => all.filter(p => p.pose === ps).length >= 2);

  return (
    <section id="progress-photos" className="card grid gap-3 p-4">
      <button id="progress-photos-toggle" className="flex w-full items-center justify-between gap-3 text-left" style={{ alignItems: 'center' }}
        aria-expanded={open} aria-controls="progress-photos-body" onClick={() => setOpen(!open)}>
        <span className="min-w-0">
          <span className="label block">Progress photos{all.length ? ` · ${all.length}` : ''}</span>
          <span className="mt-0.5 block text-[13px] text-muted">{due ? 'Due: take this month’s front and side photos.' : `Last taken ${fmtDay(lastAt!)}. Next one in about a month.`}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold">{open ? 'Hide' : 'Show'}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
        </span>
      </button>

      {open && (
      <div id="progress-photos-body" className="anim-fade grid gap-3">
      <div role="radiogroup" aria-label="Pose" className="grid h-10 grid-cols-2 overflow-hidden rounded-lg border-[1.5px] border-ink">
        {(['front', 'side'] as Pose[]).map(ps => (
          <button key={ps} role="radio" aria-checked={pose === ps} onClick={() => setPose(ps)}
            className={`disp text-[13px] font-bold uppercase tracking-wider transition-colors ${pose === ps ? 'bg-ink text-bg' : ''}`}>{ps}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Shot p={first} tag="First" />
        <Shot p={latest} tag="Latest" />
      </div>

      <div className="flex flex-wrap gap-2">
        <label className={`inline-flex h-11 cursor-pointer items-center rounded-xl bg-ink px-4 text-[14px] font-semibold text-bg ${busy ? 'opacity-50' : ''}`}>
          {busy ? 'Saving…' : `+ Add ${pose} photo`}
          <input ref={input} id="body-photo-input" type="file" accept="image/*" className="sr-only" disabled={busy}
            onChange={ev => { const f = ev.target.files?.[0]; if (f) void add(f); }} />
        </label>
        <button id="body-review" disabled={!comparable || ai.busy} onClick={() => void review()}
          className="h-11 rounded-xl border-[1.5px] border-ink px-4 text-[14px] font-semibold disabled:opacity-40">
          {ai.busy ? 'Comparing…' : 'AI: what changed?'}
        </button>
      </div>
      <p className="text-[12px] text-muted">
        Crop or frame from the neck down, no face. Same spot, light and time of day (morning, before eating), relaxed stance.
        Photos stay on this phone only; the AI review sends the first and latest of each pose to Gemini.
      </p>

      {ai.reply && <AiAnswer text={ai.reply.text} turn={ai.reply} />}
      {ai.error && <AiErrorNote code={ai.error} detail={ai.detail} />}

      {list.length > 0 && (
        <details className="text-[13px]">
          <summary className="cursor-pointer py-2 font-semibold">All {pose} photos ({list.length})</summary>
          <ul className="grid gap-1">
            {list.map(p => (
              <li key={p.id} className="flex items-center justify-between gap-2 border-t border-line py-1.5">
                <span>{fmtDay(p.at)}</span>
                {confirmDel === p.id
                  ? <button className="h-10 px-2 font-bold text-danger" onClick={() => void remove(p)}>Tap again to delete</button>
                  : <button className="h-10 px-2 font-semibold text-muted" onClick={() => setConfirmDel(p.id)} aria-label={`Delete photo from ${fmtDay(p.at)}`}>Delete</button>}
              </li>
            ))}
          </ul>
        </details>
      )}
      </div>
      )}
    </section>
  );
}
