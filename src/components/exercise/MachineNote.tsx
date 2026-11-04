import { useState } from 'react';
import { act, useWorkout } from '../../store/workout';

/** "My setup": your own machine settings for an exercise (seat, pin, pad), synced across devices. */
export default function MachineNote({ exId, compact = false }: { exId: string; compact?: boolean }) {
  const note = useWorkout(s => s.machineNotes[exId]?.text ?? '');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note);

  if (editing) {
    return (
      <form className="flex items-center gap-2" onSubmit={e => { e.preventDefault(); act().setMachineNote(exId, draft.trim()); setEditing(false); }}>
        <input id={`note-${exId}`} autoFocus value={draft} maxLength={200} onChange={e => setDraft(e.target.value)}
          placeholder="e.g. Seat 4, pin 15 kg · or · blue band, 2 steps back"
          className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 text-[15px]" />
        <button type="submit" className="h-10 rounded-lg bg-accent px-3 text-[13px] font-bold text-accentInk">Save</button>
        <button type="button" className="h-10 px-1 text-[13px] font-semibold text-muted" onClick={() => setEditing(false)}>Cancel</button>
      </form>
    );
  }
  if (!note) {
    return (
      <button className={`text-left font-semibold text-accent ${compact ? 'text-[13px]' : 'text-[14px]'}`} onClick={() => { setDraft(''); setEditing(true); }}>
        + Add my setup notes
      </button>
    );
  }
  return (
    <button className="flex w-full items-start gap-2 rounded-lg bg-accentSoft px-3 py-2 text-left" onClick={() => { setDraft(note); setEditing(true); }} aria-label="Edit my machine settings">
      <span className="min-w-0 flex-1 text-[14px]"><span className="font-semibold">My setup: </span>{note}</span>
      <span className="text-[13px] font-semibold text-accent">Edit</span>
    </button>
  );
}
