export type Unit = 'reps' | 'sec';
export type DayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  min: number;
  max: number;
  unit: Unit;
  /** Starting weight in kg; null = bodyweight */
  start: number | null;
  wNote: string;
  rest: number;
  perSide?: boolean;
  cue: string;
  /** Set when the exercise came from the ExerciseDB library: drives its tutorial demo. */
  demo?: { id: string; name: string; gifUrl: string };
}

/** One weekday inside a routine. A day with no exercises is a rest day. */
export interface RoutineDay {
  title: string;
  focus: string;
  mins: string;
  cardio: 'gym' | 'home' | 'none';
  home?: boolean;
  warmup: string[];
  cooldown: string[];
  exercises: Exercise[];
}

export interface Routine {
  id: string;
  name: string;
  builtin?: boolean;
  updatedAt: number;
  days: Record<DayId, RoutineDay>;
}

export interface Day {
  id: DayId;
  short: string;
  title: string;
  focus: string;
  mins: string;
  plate: string;
  cardio: 'gym' | 'home' | 'none';
  home?: boolean;
  warmup: string[];
  cooldown: string[];
  exercises: Exercise[];
}

/** One weigh-in: body weight in kg at a moment in time (ms since epoch). */
export interface WeightEntry { id: string; at: number; kg: number; }

export interface SetLog { w: string; r: string; done: boolean; }
/** A workout in progress. `day` is a snapshot taken at start, so editing the routine mid-workout can't break it. */
export interface Active { dayId: DayId; startedAt: number; logs: Record<string, SetLog[]>; routineId?: string; day?: Day; }

export interface LoggedSet { w: number | null; r: number; }
export interface SessionExercise { id: string; name: string; unit: Unit; sets: LoggedSet[]; }
export interface Session {
  id: string;
  dayId: DayId;
  date: string; // YYYY-MM-DD, local
  startedAt: number;
  mins: number;
  cardio: number;
  note: string;
  ex: SessionExercise[];
  /** Day title and routine at the time (older sessions lack these and fall back to the built-in plan). */
  title?: string;
  routineId?: string;
}
