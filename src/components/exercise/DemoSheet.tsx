import Sheet from './Sheet';
import DemoGif from './DemoGif';
import MachineNote from './MachineNote';
import ExerciseHowTo from '../ExerciseHowTo';
import { ytUrl } from '../../lib/exercisedb';
import { range } from '../../lib/utils';
import type { Exercise } from '../../types';

/** Everything you need at the machine: big demo, what to look for, your settings, and how to do it. */
export default function DemoSheet({ e, onClose }: { e: Exercise; onClose: () => void }) {
  return (
    <Sheet title={e.name} onClose={onClose}>
      <DemoGif e={e} className="mx-auto aspect-square w-full max-w-sm" />
      <p className="text-[14px] text-muted"><span className="num font-semibold text-ink">{e.sets}×{range(e)}</span> · {e.wNote} · {e.rest > 0 ? `rest ${e.rest}s` : 'no rest, go to next'}</p>
      <MachineNote exId={e.id} />
      <ExerciseHowTo e={e} />
      <a href={ytUrl(e.name)} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold text-accent">Watch a video on YouTube ↗</a>
    </Sheet>
  );
}
