import { useState } from 'react';
import { exerciseContext } from '../../lib/ai';
import { useWorkout } from '../../store/workout';
import { useActivePlan } from '../../lib/useRoutine';
import type { Exercise } from '../../types';
import AiChat from './AiChat';

const SUGGESTIONS = [
  'Is this safe for my knee? Anything to change?',
  'What should I feel, and where?',
  'How do I set up this machine?',
  'My weight isn’t going up. What should I do?',
];

/** "Ask AI about this exercise": a conversation that knows the plan, the how-to, your recent sets and your profile. */
export default function AskAI({ e }: { e: Exercise }) {
  const hasChat = useWorkout(s => (s.aiChats[`ex:${e.id}`]?.length ?? 0) > 0);
  const [open, setOpen] = useState(false);
  const { plan, homeById } = useActivePlan();
  if (!open) {
    return (
      <button className="justify-self-start text-[14px] font-semibold text-accent" onClick={() => setOpen(true)}>
        ✨ Ask AI about this exercise{hasChat ? ' · continue chat' : ''}
      </button>
    );
  }
  const context = () => {
    const s = useWorkout.getState();
    return exerciseContext(s.aiProfile, e, s.sessions, s.machineNotes[e.id]?.text, plan, homeById);
  };
  return (
    <section className="grid gap-2 rounded-xl border border-line bg-surface p-3">
      <div className="flex items-center justify-between"><span className="label">✨ Ask AI · {e.name}</span>
        <button className="text-[13px] font-semibold text-muted" onClick={() => setOpen(false)}>Hide</button></div>
      <AiChat thread={`ex:${e.id}`} context={context} suggestions={SUGGESTIONS} inputId={`ai-q-${e.id}`} />
    </section>
  );
}
