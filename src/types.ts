export type Unit = 'reps' | 'sec';
export type DayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
/** Where a workout happens. Each gym day can have a home version that trains the same muscles. */
export type Venue = 'gym' | 'home';

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
  /** Muscles worked, e.g. "Chest · front delts · triceps". */
  targets?: string;
  /** What to look for in the gym, e.g. "Cable machine · pulley at the top · rope". */
  equipment?: string;
  /** How to do it, in order. */
  steps?: string[];
  /** What to avoid. */
  mistakes?: string[];
  /** Weights your own kit can make for this exercise (kg per dumbbell). The coach only suggests these. */
  loads?: number[];
  /** The logged kg is machine assistance (assisted pull-up / dip machine): less is harder. */
  assisted?: boolean;
  /** Exercises sharing a superset label are done back to back (e.g. "A1", "A2"). */
  superset?: string;
  /** Set on an exercise swapped in during a workout: the planned exercise it replaces. */
  swappedFor?: { id: string; name: string };
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
  /** Home version of each gym day (bands, bodyweight). Missing on routines made before this existed: the built-in home days are used. */
  homeDays?: Partial<Record<DayId, RoutineDay>>;
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

/** How a set felt. Unset = OK. The coach uses it: hard sets hold the weight, easy ones can move up sooner. */
export type Feel = 'easy' | 'hard';
export interface SetLog { w: string; r: string; done: boolean; feel?: Feel; }
/** A workout in progress. `day` is a snapshot taken at start, so editing the routine mid-workout can't break it. */
export interface Active {
  dayId: DayId; startedAt: number; logs: Record<string, SetLog[]>; routineId?: string; day?: Day;
  /** Guided mode: which exercise is on screen. Unset = the normal list. */
  guided?: number;
  /** Set when today's workout is the home version. */
  venue?: Venue;
}

export interface LoggedSet { w: number | null; r: number; feel?: Feel; }
export interface SessionExercise { id: string; name: string; unit: Unit; sets: LoggedSet[]; /** Name of the planned exercise this replaced, when swapped. */ swappedFor?: string; }
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
  /** "home" when the home version of the day was done. */
  venue?: Venue;
}

/** A progress photo (neck down). The image stays on this device in IndexedDB under `body:<id>`. */
export interface BodyPhoto { id: string; at: number; pose: 'front' | 'side'; }
