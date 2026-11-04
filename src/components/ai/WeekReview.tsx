import { weekContext } from '../../lib/ai';
import { useWorkout } from '../../store/workout';
import { useActivePlan } from '../../lib/useRoutine';
import AiChat from './AiChat';

/** AI look at the last 7 days, then a conversation about it (follow-ups keep the context). */
export default function WeekReview() {
  const { plan, homeById } = useActivePlan();
  const context = () => {
    const s = useWorkout.getState();
    return weekContext(s.aiProfile, plan, s.sessions, s.weights, Date.now(), homeById);
  };
  return (
    <section className="grid gap-2 card px-4 py-3">
      <div>
        <div className="label">✨ AI weekly review</div>
        <p className="text-[13px] text-muted">Your last 7 days of workouts and body weight. Ask follow-ups below the answer.</p>
      </div>
      <AiChat thread="week" context={context} review inputId="ai-week-q" />
    </section>
  );
}
