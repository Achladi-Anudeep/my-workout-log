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

export interface SetLog { w: string; r: string; done: boolean; }
export interface Active { dayId: DayId; startedAt: number; logs: Record<string, SetLog[]>; }

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
}
