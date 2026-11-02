import Sheet from './Sheet';
import DemoGif from './DemoGif';
import { DEMO_NOTE } from '../../data/demos';
import MachineNote from './MachineNote';
import MachinePhoto from './MachinePhoto';
import ExerciseHowTo from '../ExerciseHowTo';
import AskAI from '../ai/AskAI';
import { ytUrl } from '../../lib/exercisedb';
import { range } from '../../lib/utils';
import type { Exercise } from '../../types';

/** Everything you need at the machine: big demo, what to look for, your settings, and how to do it. */
export default function DemoSheet({ e, onClose }: { e: Exercise; onClose: () => void }) {
  return (
    <Sheet title={e.name} onClose={onClose}>
      <DemoGif e={e} className="mx-auto aspect-square w-full max-w-sm" />
      {!e.demo && DEMO_NOTE[e.id] && <p className="demo-note rounded-lg bg-sunk px-3 py-2 text-[13px]">{DEMO_NOTE[e.id]}</p>}
      <p className="text-[14px] text-muted"><span className="num font-semibold text-ink">{e.sets}×{range(e)}</span> · {e.wNote} · {e.rest > 0 ? `rest ${e.rest}s` : 'no rest, go to next'}</p>
      <MachinePhoto exId={e.id} />
      <MachineNote exId={e.id} />
      <ExerciseHowTo e={e} />
      <AskAI e={e} />
      <a href={ytUrl(e.name)} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold text-accent">Watch a video on YouTube ↗</a>
    </Sheet>
  );
}
