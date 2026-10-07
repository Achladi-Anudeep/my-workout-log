import { useEffect, useState } from 'react';
import Today from './views/Today';
import CalendarView from './views/CalendarView';
import Progress from './views/Progress';
import Tutorials from './views/Tutorials';
import Plan from './views/Plan';
import RestTimer, { type Timer } from './components/RestTimer';
import { PlateLogo } from './components/ui';
import { act, useWorkout, type Tab } from './store/workout';
import { useSync, type SyncMode } from './store/sync';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: 'M4 12h3l2-6 4 12 2-6h5' },
  { id: 'calendar', label: 'Calendar', icon: 'M4 7h16M8 3v4M16 3v4M5 5h14v15H5zM9 12h2M13 12h2M9 16h2' },
  { id: 'progress', label: 'Progress', icon: 'M4 19h16M6 15l4-4 3 3 5-6' },
  { id: 'tutorials', label: 'Tutorials', icon: 'M5 5h14v14H5zM10 9l5 3-5 3z' },
  { id: 'plan', label: 'Plan', icon: 'M7 4h10M7 9h10M7 14h10M7 19h6' },
];

const SYNC_LABEL: Record<SyncMode, [string, string]> = {
  unconfigured: ['This device only', 'var(--muted)'],
  'signed-out': ['Not signed in', 'var(--muted)'],
  syncing: ['Syncing…', 'var(--accent)'],
  synced: ['Synced', 'var(--good)'],
  offline: ['Offline', 'var(--warn)'],
};

function SyncPill() {
  const mode = useSync(s => s.mode);
  const pending = useWorkout(s => s.pendingUp.length + s.pendingDel.length);
  const [label, color] = SYNC_LABEL[mode];
  return (
    <button onClick={() => act().setTab('plan')} className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[12px] font-semibold">
      <span className="block h-2 w-2 rounded-full" style={{ background: color }} />
      {mode === 'offline' && pending ? `Offline · ${pending} to sync` : label}
    </button>
  );
}

export default function App() {
  const tab = useWorkout(s => s.tab);
  const [timer, setTimer] = useState<Timer | null>(null);
  const onRest = (secs: number, label: string) => setTimer({ end: Date.now() + secs * 1000, total: secs, label });

  // Older saved state may hold a tab that no longer exists
  useEffect(() => { if (!TABS.some(t => t.id === tab)) act().setTab('today'); }, [tab]);

  return (
    <div className="min-h-full">
      <header className="sticky z-20 border-b border-line bg-bg px-4 py-3" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <PlateLogo />
            <span className="disp truncate text-[21px] font-extrabold uppercase tracking-wide">My Workout Log</span>
          </div>
          <SyncPill />
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 pb-28 pt-4">
        {tab === 'today' && <Today onRest={onRest} />}
        {tab === 'calendar' && <CalendarView />}
        {tab === 'progress' && <Progress />}
        {tab === 'tutorials' && <Tutorials />}
        {tab === 'plan' && <Plan />}
      </main>

      {timer && <RestTimer t={timer} onClose={() => setTimer(null)} onAdd={s => setTimer({ ...timer, end: timer.end + s * 1000, total: timer.total + s })} />}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {TABS.map(t => (
            <button key={t.id} id={`tab-${t.id}`} onClick={() => act().setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}
              className={`flex h-16 flex-col items-center justify-center gap-1 ${tab === t.id ? 'text-accent' : 'text-muted'}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={t.icon} /></svg>
              <span className="text-[12px] font-semibold">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
