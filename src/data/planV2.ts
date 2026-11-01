import { DAY } from './plan';
import type { DayId, Exercise, RoutineDay, Unit } from '../types';

const E = (id: string, name: string, sets: number, min: number, max: number, unit: Unit, start: number | null,
  wNote: string, rest: number, cue: string, extra: Partial<Exercise> = {}): Exercise =>
  ({ id, name, sets, min, max, unit, start, wNote, rest, cue, ...extra });

const strip = (id: DayId): RoutineDay => {
  const { id: _i, short: _s, plate: _p, ...rest } = JSON.parse(JSON.stringify(DAY[id]));
  return rest;
};
const ex = (day: DayId, id: string) => JSON.parse(JSON.stringify(DAY[day].exercises.find(e => e.id === id)!)) as Exercise;

/**
 * Gym PPL v2: the same split with the gaps from the November review filled.
 * Exercise ids are shared with Gym PPL wherever the exercise is the same, so progress carries over.
 */
export function buildV2(): Record<DayId, RoutineDay> {
  const mon = strip('mon');
  mon.mins = '60';
  mon.focus = 'Chest · shoulders · triceps';
  mon.exercises = [
    ex('mon', 'chest-press'),
    ex('mon', 'incline-press'),
    E('shoulder-press', 'Seated DB Shoulder Press', 3, 10, 12, 'reps', 4, '4–6 kg per hand', 90,
      'Back flat on the bench, press up and slightly in, lower to shoulder height.'),
    ex('mon', 'dips'),
    ex('mon', 'lateral-raise'),
    ex('mon', 'triceps-pushdown'),
  ];

  const thu = strip('thu');
  thu.focus = 'Chest · biceps · triceps · rear delts';
  thu.exercises = [
    ex('thu', 'incline-press'),
    ex('thu', 'flies'),
    ex('thu', 'bicep-curl'),
    E('ss-triceps-ext', 'Overhead Triceps Extension', 3, 12, 12, 'reps', 6, '6 kg, one dumbbell', 0,
      'Superset A1: go straight into A2 with no rest.', { superset: 'A1' }),
    E('ss-curl', 'Superset Curl', 3, 12, 12, 'reps', 4, '4 kg', 60,
      'Superset A2: right after A1, then rest 60s.', { superset: 'A2' }),
    ex('thu', 'rear-delt-fly'),
  ];

  const fri = strip('fri');
  fri.mins = '60';
  fri.focus = 'Back · biceps · grip · calves · core';
  fri.exercises = [
    ex('fri', 'lat-pulldown'),
    ex('fri', 'low-row'),
    ex('fri', 'rear-delt-fly'),
    E('hammer-curl', 'Hammer Curl', 3, 12, 12, 'reps', 4, '4–6 kg', 60, 'Palms facing in, elbows pinned, no swinging.'),
    ex('fri', 'farmers-carry'),
    E('standing-calf', 'Standing Calf Raise', 3, 15, 15, 'reps', null, 'Machine or bodyweight on a step', 45,
      'Straight legs, full stretch at the bottom, pause 1s at the top.'),
    ex('fri', 'leg-raise'),
    ex('fri', 'plank'),
  ];

  const sat = strip('sat');
  sat.mins = '40';
  sat.title = 'Home Legs + Core';
  sat.focus = 'Legs (pain-free) · calves · core · bodyweight';
  const squat = ex('sat', 'bw-squat');
  squat.min = 15; squat.max = 20;
  squat.cue = 'Lower over 3 seconds to a pain-free depth, stand up normally.';
  sat.exercises = [
    squat,
    ex('sat', 'step-up'),
    ex('sat', 'glute-bridge'),
    E('single-leg-calf', 'Single-leg Calf Raise', 3, 12, 15, 'reps', null, 'Bodyweight, on a stair', 30,
      'Hold the wall, full stretch, pause 1s at the top.', { perSide: true }),
    ex('sat', 'push-up'),
    ex('sat', 'dead-bug'),
    ex('sat', 'lying-leg-raise'),
  ];

  return { mon, tue: strip('tue'), wed: strip('wed'), thu, fri, sat, sun: strip('sun') };
}
