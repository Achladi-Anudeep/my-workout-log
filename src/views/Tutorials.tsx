import { useEffect, useState } from 'react';
import { cleanStep, useDemos, ytUrl } from '../lib/exercisedb';
import { DEMO_Q } from '../data/plan';
import { exDays } from '../lib/routines';
import { useActivePlan } from '../lib/useRoutine';
import { Chip, Plate } from '../components/ui';
import type { DayId } from '../types';

function DemoError({ name }: { name: string }) {
  return (
    <div className="rounded-xl bg-sunk px-4 py-4 text-[14px]">
      <p className="font-semibold">Couldn't load the demo.</p>
      <p className="mt-1 text-muted">Check your connection, or watch a video instead.</p>
      <a href={ytUrl(name)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex h-10 items-center rounded-lg bg-accent px-4 font-bold text-accentInk">Watch a video ↗</a>
    </div>
  );
}

interface DemoTarget { title: string; query: string; cue?: string; }

function DemoView({ title, query, cue, onBack }: DemoTarget & { onBack: () => void }) {
  const { data, error } = useDemos(query, 6);
  const [pick, setPick] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => { setPick(0); setImgFailed(false); window.scrollTo({ top: 0 }); }, [query]);
  const demo = data?.[pick];

  return (
    <div className="grid gap-4">
      <button className="justify-self-start text-[14px] font-semibold text-accent" onClick={onBack}>‹ All tutorials</button>
      <h2 className="disp text-[34px] font-extrabold uppercase leading-none">{title}</h2>
      {cue && <div className="rounded-xl border border-line bg-surface px-4 py-3"><div className="label">Your cue</div><p className="mt-1 text-[15px]">{cue}</p></div>}
      {error && <DemoError name={title} />}
      {!error && !data && <div className="grid aspect-square w-full max-w-sm place-items-center rounded-2xl bg-sunk text-muted">Loading demo…</div>}
      {data && !data.length && (
        <div className="rounded-xl bg-sunk px-4 py-4 text-[14px]">No animated demo found for this one. <a className="font-semibold text-accent" href={ytUrl(title)} target="_blank" rel="noopener noreferrer">Watch a video ↗</a></div>
      )}
      {data && demo && (
        <>
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            {imgFailed ? <div className="p-4"><DemoError name={title} /></div> : (
              <img src={demo.gifUrl} alt={`Animated demo of ${demo.name}`} className="mx-auto block aspect-square w-full max-w-sm object-contain" onError={() => setImgFailed(true)} />
            )}
          </div>
          <div>
            <div className="text-[15px] font-semibold capitalize">{demo.name}</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {demo.targetMuscles.map(m => <Chip key={m} tone="accent">{m}</Chip>)}
              {demo.secondaryMuscles.slice(0, 3).map(m => <Chip key={m} tone="muted">{m}</Chip>)}
            </div>
          </div>
          {data.length > 1 && (
            <div>
              <div className="label">Other versions</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {data.map((d, i) => (
                  <button key={d.exerciseId} onClick={() => { setPick(i); setImgFailed(false); }}
                    className={`rounded-lg border px-2.5 py-1.5 text-[13px] capitalize ${i === pick ? 'border-ink bg-ink text-bg' : 'border-line bg-surface'}`}>{d.name}</button>
                ))}
              </div>
            </div>
          )}
          {demo.instructions.length > 0 && (
            <ol className="grid list-decimal gap-1.5 rounded-xl border border-line bg-surface py-3 pl-9 pr-4 text-[14px]">
              {demo.instructions.map((t, i) => <li key={i}>{cleanStep(t)}</li>)}
            </ol>
          )}
          <a href={ytUrl(title)} target="_blank" rel="noopener noreferrer" className="justify-self-start text-[14px] font-semibold text-accent">Watch a video on YouTube ↗</a>
        </>
      )}
    </div>
  );
}

export default function Tutorials() {
  const [q, setQ] = useState('');
  const [day, setDay] = useState<DayId | 'all'>('all');
  const [view, setView] = useState<DemoTarget | null>(null);
  const search = q.trim().length >= 3 ? q.trim().toLowerCase() : null;
  const results = useDemos(search, 12);

  const { plan, byId } = useActivePlan();
  if (view) return <DemoView {...view} onBack={() => setView(null)} />;

  const planList = (day === 'all' ? [...new Map(plan.flatMap(d => d.exercises).map(e => [e.id, e])).values()] : byId[day].exercises).filter(e => !q || e.name.toLowerCase().includes(q.toLowerCase()));
  const dayFilters: (DayId | 'all')[] = ['all', ...plan.filter(p => p.exercises.length).map(p => p.id)];

  return (
    <div className="grid gap-4">
      <h2 className="disp text-[36px] font-extrabold uppercase leading-none">Tutorials</h2>
      <p className="-mt-2 text-[14px] text-muted">Animated demos and steps for any exercise, loaded live.</p>
      <input id="tutorial-search" type="search" placeholder="Search any exercise, e.g. hip thrust" value={q} onChange={e => setQ(e.target.value)}
        className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-ink placeholder:text-muted" />

      {search && (
        <section className="grid gap-2">
          <div className="label">From the exercise library</div>
          {results.error && <DemoError name={q} />}
          {!results.error && !results.data && <p className="text-[14px] text-muted">Searching…</p>}
          {results.data && !results.data.length && <p className="text-[14px] text-muted">No matches. Try a simpler name, like "curl" or "row".</p>}
          {results.data && results.data.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {results.data.map(d => (
                <button key={d.exerciseId} onClick={() => setView({ title: d.name, query: d.name })} className="overflow-hidden rounded-xl border border-line bg-surface text-left">
                  <img src={d.gifUrl} alt="" loading="lazy" className="aspect-square w-full bg-white object-contain" />
                  <div className="px-2.5 py-2 text-[13px] font-semibold capitalize leading-snug">{d.name}</div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="grid gap-2">
        <div className="label">Your plan</div>
        <div className="-mx-4 overflow-x-auto px-4">
          <div className="flex gap-1.5">
            {dayFilters.map(d => (
              <button key={d} onClick={() => setDay(d)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-semibold ${day === d ? 'border-ink bg-ink text-bg' : 'border-line bg-surface'}`}>
                {d !== 'all' && <Plate color={byId[d].plate} size={8} />}{d === 'all' ? 'All' : byId[d].short}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {planList.map((e, i) => (
            <button key={e.id} onClick={() => setView({ title: e.name, query: e.demo?.name ?? DEMO_Q[e.id] ?? e.name, cue: e.cue })}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left ${i ? 'border-t border-line' : ''}`}>
              <span className="min-w-0 flex-1"><span className="block font-semibold">{e.name}</span><span className="block text-[12px] text-muted">{exDays(plan, e.id).join(' · ')}</span></span>
              <span className="text-[13px] font-semibold text-accent">Demo ›</span>
            </button>
          ))}
          {!planList.length && <p className="px-4 py-4 text-[14px] text-muted">No plan exercise matches "{q}".</p>}
        </div>
      </section>
    </div>
  );
}
