import { describe, expect, it } from 'vitest';
import { BUILTIN, BUILTIN_ID, BUILTIN_V2, BUILTINS, DAY_IDS, findRoutine, homeDayOf, isBuiltin, planOf, routineName, toDay } from '../../src/lib/routines';
import { BAND_SWAPS, HOME_DAYS, ONE_DB } from '../../src/data/home';
import { DETAILS, detailsOf } from '../../src/data/details';
import { ALT_EXERCISES, ALTERNATIVES, EXERCISE_LIBRARY, swapOptions } from '../../src/data/alternatives';
import { DEMO_ID, DEMO_NOTE, demoGif } from '../../src/data/demos';
import { VERSIONS, WARMUP_DEMOS, warmupDemo } from '../../src/data/versions';
import type { Routine } from '../../src/types';

const names = (r: Routine, d: keyof Routine['days']) => r.days[d].exercises.map(e => e.name);

describe('Gym PPL (the original plan) stays exactly as agreed', () => {
  it('has the agreed exercises on each day', () => {
    expect(names(BUILTIN, 'mon')).toEqual(['Chest Press', 'Incline Press', 'Dips', 'Lateral Raises', 'Triceps Pushdown']);
    expect(names(BUILTIN, 'tue')).toEqual(['Deadlift', 'Lat Pulldown', 'Bent Over Row', 'Low Row', 'Face Pulls', 'Shrugs']);
    expect(names(BUILTIN, 'wed')).toEqual(['Barbell Squat', 'Leg Press', 'RDL', 'Wall Sit', 'Leg Curl', 'Seated Calf Raise', 'Side Plank']);
    expect(names(BUILTIN, 'thu')).toEqual(['Incline Press', 'Flies', 'Bicep Curl', 'Triceps + Bicep Superset', 'Front Raises', 'Rear Delt Fly']);
    expect(names(BUILTIN, 'fri')).toEqual(['Lat Pulldown', 'Low Row', 'Rear Delt Fly', "Farmer's Carry", 'Leg Raises', 'Plank']);
    expect(names(BUILTIN, 'sat')).toEqual(['Bodyweight Squat', 'Glute Bridge', 'Step-ups (low step)', 'Push-ups', 'Russian Twists', 'Dead Bug', 'Lying Leg Raise']);
    expect(names(BUILTIN, 'sun')).toEqual([]);
  });

  it('keeps the agreed sets, reps, starting weights and rest on key lifts', () => {
    const find = (d: keyof Routine['days'], id: string) => BUILTIN.days[d].exercises.find(e => e.id === id)!;
    expect(find('tue', 'deadlift')).toMatchObject({ sets: 3, min: 8, max: 10, start: 20, rest: 120 });
    expect(find('wed', 'squat')).toMatchObject({ sets: 3, min: 10, max: 12, start: 20, rest: 120 });
    expect(find('mon', 'chest-press')).toMatchObject({ sets: 3, min: 12, max: 15, start: 10, rest: 90 });
    expect(find('fri', 'plank')).toMatchObject({ unit: 'sec', min: 60, max: 60 });
  });

  it('keeps cardio off on deadlift and squat days', () => {
    expect(BUILTIN.days.tue.cardio).toBe('none');
    expect(BUILTIN.days.wed.cardio).toBe('none');
    expect(BUILTIN.days.sat.home).toBe(true);
  });
});

describe('Gym PPL v2', () => {
  it('fills the review gaps', () => {
    expect(names(BUILTIN_V2, 'mon')).toContain('Seated DB Shoulder Press');
    expect(names(BUILTIN_V2, 'thu')).not.toContain('Front Raises');
    expect(names(BUILTIN_V2, 'fri')).toEqual(expect.arrayContaining(['Hammer Curl', 'Standing Calf Raise']));
    expect(names(BUILTIN_V2, 'sat')).toEqual(expect.arrayContaining(['Band Seated Row', 'Band Face Pull', 'Band Lateral Raise', 'Monster Walk']));
  });

  it('trains side delts on three days a week', () => {
    const days = DAY_IDS.filter(d => BUILTIN_V2.days[d].exercises.some(e => /lateral-raise/.test(e.id)));
    expect(days).toEqual(['mon', 'thu', 'sat']);
  });

  it('keeps Saturday a gentle home session: bodyweight and bands only, no machines', () => {
    const sat = BUILTIN_V2.days.sat;
    expect(sat.home).toBe(true);
    for (const e of sat.exercises) expect(e.start, e.id).toBeNull();
  });

  it('splits the superset into two logged exercises, with no rest between them', () => {
    const [a1, a2] = BUILTIN_V2.days.thu.exercises.filter(e => e.superset);
    expect(a1).toMatchObject({ superset: 'A1', rest: 0, start: 6 });
    expect(a2).toMatchObject({ superset: 'A2', rest: 60, start: 4 });
  });

  it('shares exercise ids with Gym PPL so progress carries over', () => {
    const v1 = new Set(DAY_IDS.flatMap(d => BUILTIN.days[d].exercises.map(e => e.id)));
    const shared = DAY_IDS.flatMap(d => BUILTIN_V2.days[d].exercises).filter(e => v1.has(e.id));
    expect(shared.length).toBeGreaterThan(25);
  });

  it('leaves Tuesday and Wednesday identical to Gym PPL', () => {
    expect(BUILTIN_V2.days.tue).toEqual(BUILTIN.days.tue);
    expect(BUILTIN_V2.days.wed).toEqual(BUILTIN.days.wed);
  });
});

describe('every built-in routine', () => {
  for (const r of BUILTINS) {
    it(`${r.name}: every exercise has full details`, () => {
      for (const d of DAY_IDS) for (const e of r.days[d].exercises) {
        const det = detailsOf(e);
        expect(det, `${d} ${e.id}`).not.toBeNull();
        expect(det!.targets, e.id).not.toBe('');
        expect(det!.steps.length, e.id).toBeGreaterThanOrEqual(3);
        expect(det!.mistakes.length, e.id).toBeGreaterThanOrEqual(2);
      }
    });

    it(`${r.name}: no duplicate exercises within a day, sane numbers`, () => {
      for (const d of DAY_IDS) {
        const ids = r.days[d].exercises.map(e => e.id);
        expect(new Set(ids).size, d).toBe(ids.length);
        for (const e of r.days[d].exercises) {
          expect(e.sets, e.id).toBeGreaterThan(0);
          expect(e.max, e.id).toBeGreaterThanOrEqual(e.min);
          expect(e.rest, e.id).toBeGreaterThanOrEqual(0);
        }
      }
    });
  }

  it('has no orphaned detail entries', () => {
    const used = new Set([...BUILTINS.flatMap(r => DAY_IDS.flatMap(d => [...r.days[d].exercises, ...(homeDayOf(r, d)?.exercises ?? [])].map(e => e.id))), ...ALT_EXERCISES.map(e => e.id), ...BAND_SWAPS.map(e => e.id)]);
    for (const id of Object.keys(DETAILS)) expect(used.has(id), id).toBe(true);
  });
});

describe('routine helpers', () => {
  it('treats a day without exercises as rest', () => {
    const day = toDay(BUILTIN, 'sun');
    expect(day).toMatchObject({ title: 'Rest', mins: '0', plate: 'var(--line)' });
  });

  it('falls back to Gym PPL for an unknown routine id', () => {
    expect(findRoutine([], 'gone').id).toBe(BUILTIN_ID);
    expect(findRoutine([], BUILTIN_V2.id).id).toBe(BUILTIN_V2.id);
  });

  it('knows which routines are built in', () => {
    expect(isBuiltin(BUILTIN_ID)).toBe(true);
    expect(isBuiltin(BUILTIN_V2.id)).toBe(true);
    expect(isBuiltin('mine')).toBe(false);
  });

  it('gives an empty name a readable fallback', () => {
    expect(routineName({ ...BUILTIN, name: '  ' })).toBe('Untitled routine');
  });

  it('builds a 7-day plan', () => {
    expect(planOf(BUILTIN).map(d => d.id)).toEqual(DAY_IDS);
  });
});

describe('finding the machine and doing it right', () => {
  const all = [...EXERCISE_LIBRARY.values()];

  it('every exercise says what equipment to look for', () => {
    for (const e of all) expect(detailsOf(e)?.equipment, e.id).toBeTruthy();
  });

  it('every swap-in exercise has full how-to details', () => {
    for (const e of ALT_EXERCISES) {
      const d = detailsOf(e)!;
      expect(d.steps.length, e.id).toBeGreaterThanOrEqual(3);
      expect(d.mistakes.length, e.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('every built-in exercise has at least one swap, and every swap points at a known exercise', () => {
    for (const r of BUILTINS) for (const d of DAY_IDS) for (const e of r.days[d].exercises) {
      expect(ALTERNATIVES[e.id]?.length, e.id).toBeGreaterThan(0);
    }
    for (const [from, tos] of Object.entries(ALTERNATIVES)) for (const to of tos) {
      expect(EXERCISE_LIBRARY.has(to), `${from} → ${to}`).toBe(true);
      expect(to).not.toBe(from);
    }
  });

  it('swap options skip exercises already in the workout and offer the original back first', () => {
    const chest = EXERCISE_LIBRARY.get('chest-press')!;
    expect(swapOptions(chest, ['chest-press', 'push-up']).map(e => e.id)).toEqual(['db-bench-press']);
    const swapped = { ...EXERCISE_LIBRARY.get('db-bench-press')!, swappedFor: { id: 'chest-press', name: 'Chest Press' } };
    expect(swapOptions(swapped, ['db-bench-press']).map(e => e.id)).toEqual(['chest-press', 'push-up']);
  });

  it('every exercise has a pinned demo, and every demo note belongs to a real exercise', () => {
    const missing = all.filter(e => !demoGif(e)).map(e => e.id).sort();
    expect(missing).toEqual(['hand-gripper']); // no gripper animation exists; it shows an icon
    for (const k of Object.keys(DEMO_NOTE)) expect(EXERCISE_LIBRARY.has(k), k).toBe(true);
    for (const id of Object.values(DEMO_ID)) expect(id).toMatch(/^[A-Za-z0-9]{7}$/);
    for (const k of Object.keys(DEMO_ID)) expect(EXERCISE_LIBRARY.has(k), k).toBe(true);
  });

  it('hand-picked versions belong to real exercises, never repeat the pinned demo, and fit the grid', () => {
    for (const [k, list] of Object.entries(VERSIONS)) {
      expect(EXERCISE_LIBRARY.has(k), k).toBe(true);
      expect(list.length, k).toBeGreaterThan(0);
      expect(list.length, k).toBeLessThanOrEqual(6);
      for (const x of list) {
        expect(x.id).toMatch(/^[A-Za-z0-9]{7}$/);
        expect(x.id, `${k} repeats its own demo`).not.toBe(DEMO_ID[k]);
        expect(x.label.length).toBeGreaterThan(3);
      }
    }
  });

  it('warm-up and cool-down demos each match a move in the built-in routines', () => {
    const moves = BUILTINS.flatMap(r => DAY_IDS.flatMap(d => [...r.days[d].warmup, ...r.days[d].cooldown, ...(homeDayOf(r, d)?.warmup ?? []), ...(homeDayOf(r, d)?.cooldown ?? [])]));
    for (const d of WARMUP_DEMOS) expect(moves.some(m => d.match.test(m)), String(d.match)).toBe(true);
    expect(warmupDemo('Deep Squat Hamstring Stretch · 30s (pain-free)')).toBeNull(); // no clean demo: stays text-only
    expect(warmupDemo('Hamstring Stretch · 30s')?.id).toBe('99rWm7w');
  });

  it('every gym day Mon–Fri has a home version; Saturday (already home) and Sunday do not', () => {
    for (const r of BUILTINS) {
      expect(DAY_IDS.filter(d => homeDayOf(r, d))).toEqual(['mon', 'tue', 'wed', 'thu', 'fri']);
      for (const d of ['mon', 'tue', 'wed', 'thu', 'fri'] as const) {
        const home = toDay(r, d, 'home');
        expect(home.home).toBe(true);
        expect(home.exercises.length).toBeGreaterThanOrEqual(6);
      }
    }
  });

  it('home days only use home gear, and start at a weight the dumbbell kit can make', () => {
    for (const day of Object.values(HOME_DAYS)) for (const e of day!.exercises) {
      expect(e.start == null || (e.loads ?? []).includes(e.start), e.id).toBe(true);
      for (const l of e.loads ?? []) expect(ONE_DB.includes(l), `${e.id} ${l}`).toBe(true);
      expect(detailsOf(e)?.equipment, e.id).toBeTruthy();
    }
  });

  it('home days train the same muscles as the gym day they replace', () => {
    const has = (d: 'mon' | 'tue' | 'wed' | 'thu' | 'fri', re: RegExp) => toDay(BUILTIN, d, 'home').exercises.some(e => re.test(detailsOf(e)?.targets ?? ''));
    expect(has('mon', /Chest/) && has('mon', /delts/) && has('mon', /Triceps/)).toBe(true);
    expect(has('tue', /Lats|back/) && has('tue', /Hamstrings/) && has('tue', /traps/)).toBe(true);
    expect(has('wed', /Quads/) && has('wed', /Hamstrings/) && has('wed', /Calves/)).toBe(true);
    expect(has('thu', /Chest/) && has('thu', /Biceps/) && has('thu', /Triceps/)).toBe(true);
    expect(has('fri', /Lats/) && has('fri', /Biceps/) && has('fri', /abs|Core/i)).toBe(true);
  });

  it('a routine copied before home days existed still gets them; a blank routine has none', () => {
    const old: Routine = { ...BUILTIN, id: 'old-copy', builtin: false, homeDays: undefined };
    expect(homeDayOf(old, 'mon')?.title).toBe('Home Push');
    const blank: Routine = { ...BUILTIN, id: 'blank', builtin: false, homeDays: {} };
    expect(homeDayOf(blank, 'mon')).toBeNull();
  });
});
