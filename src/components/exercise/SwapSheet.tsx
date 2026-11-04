import Sheet from './Sheet';
import DemoGif from './DemoGif';
import { swapOptions } from '../../data/alternatives';
import { detailsOf } from '../../data/details';
import { act } from '../../store/workout';
import { range } from '../../lib/utils';
import type { Exercise } from '../../types';

/** "Machine busy?" Pick another exercise for the same muscles. It's logged under its own name and history. */
export default function SwapSheet({ e, inWorkout, atHome = false, onClose }: { e: Exercise; inWorkout: string[]; atHome?: boolean; onClose: () => void }) {
  const options = swapOptions(e, inWorkout, atHome);
  return (
    <Sheet title={`Swap ${e.name}`} onClose={onClose}>
      <p className="text-[14px] text-muted">Machine taken? These work the same muscles. Sets you've already ticked for {e.name} are cleared; your plan stays the same for next time.</p>
      {options.length === 0 && <p className="rounded-lg bg-sunk px-3 py-3 text-[14px]">No alternatives for this one yet.</p>}
      <div className="grid gap-2">
        {options.map(o => {
          const d = detailsOf(o);
          const back = e.swappedFor?.id === o.id;
          return (
            <button key={o.id} id={`swap-to-${o.id}`} onClick={() => { act().swapExercise(e.id, o); onClose(); }}
              className="flex items-center gap-3 card p-2 text-left">
              <DemoGif e={o} size={64} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{back ? `Back to ${o.name}` : o.name}</span>
                {d?.equipment && <span className="block text-[13px] text-muted">{d.equipment}</span>}
                <span className="block text-[12px] text-muted"><span className="num">{e.sets}×{range(o)}</span>{d?.targets ? ` · ${d.targets}` : ''}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
