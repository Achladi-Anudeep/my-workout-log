import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DAY } from '../data/plan';
import { isoDay, lastFor, programWeek, uid } from '../lib/utils';
import { advise } from '../lib/coach';
import { BUILTIN, BUILTIN_ID, DAY_IDS, clone, emptyDay, findRoutine, isBuiltin, toDay } from '../lib/routines';
import type { Active, Day, DayId, Exercise, Routine, RoutineDay, Session, SetLog, WeightEntry } from '../types';

/** The day an in-progress workout runs on: its snapshot, or the built-in day for workouts started before routines existed. */
export const activeDay = (a: Active): Day => a.day ?? DAY[a.dayId];

export type Tab = 'today' | 'calendar' | 'progress' | 'tutorials' | 'plan';

/** A row as stored in Supabase: deletes are soft so they reach every device. */
export interface RemoteRow { id: string; data: Session | null; deleted: boolean; }
export interface RemoteWeightRow { id: string; at: number; kg: number | null; deleted: boolean; }
export interface RemoteRoutineRow { id: string; data: Routine | null; deleted: boolean; }
/** Your machine settings per exercise, e.g. "Seat 4, pin 15 kg". `at` decides which edit wins across devices. */
export type MachineNotes = Record<string, { text: string; at: number }>;

export interface WorkoutState {
  startDate: string;
  active: Active | null;
  sessions: Session[];
  tab: Tab;
  /** Session ids waiting to be uploaded / deleted on the server. */
  pendingUp: string[];
  pendingDel: string[];
  settingsDirty: boolean;
  weights: WeightEntry[];
  pendingWUp: string[];
  pendingWDel: string[];

  addWeight: (kg: number, at: number) => void;
  deleteWeight: (id: string) => void;
  applyRemoteWeights: (rows: RemoteWeightRow[]) => void;
  markWeightUploaded: (id: string) => void;
  markWeightDeleted: (id: string) => void;

  /** Your own routines. The built-in plan is not in here and can't be changed. */
  routines: Routine[];
  activeRoutineId: string;
  pendingRUp: string[];
  pendingRDel: string[];
  activeRoutineDirty: boolean;

  createRoutine: (name: string, fromId?: string) => string;
  renameRoutine: (id: string, name: string) => void;
  deleteRoutine: (id: string) => void;
  setActiveRoutine: (id: string) => void;
  updateDay: (routineId: string, dayId: DayId, patch: Partial<RoutineDay>) => void;
  saveExercise: (routineId: string, dayId: DayId, ex: Exercise, replaceId?: string) => void;
  removeExercise: (routineId: string, dayId: DayId, exId: string) => void;
  moveExercise: (routineId: string, dayId: DayId, from: number, to: number) => void;
  applyRemoteRoutines: (rows: RemoteRoutineRow[], remoteActiveId: string | null) => void;
  markRoutineUploaded: (id: string) => void;
  markRoutineDeleted: (id: string) => void;
  markActiveRoutineSaved: () => void;

  machineNotes: MachineNotes;
  /** Bumped on every local edit; sync clears the dirty state only for the version it uploaded. */
  notesVersion: number;
  notesSyncedVersion: number;
  setMachineNote: (exId: string, text: string) => void;

  /** Which exercises have a machine photo on this device (exercise id → when it was taken). The images are in IndexedDB. */
  photos: Record<string, number>;
  pendingPUp: string[];
  pendingPDel: string[];
  setPhoto: (exId: string, at: number) => void;
  removePhoto: (exId: string) => void;
  /** A newer photo (or a delete) arrived from another device. */
  photoArrived: (exId: string, at: number) => void;
  photoGone: (exId: string) => void;
  markPhotoUploaded: (exId: string) => void;
  markPhotoDeleted: (exId: string) => void;
  applyRemoteNotes: (remote: MachineNotes | null) => void;
  markNotesSaved: (version: number) => void;

  /** Replace an exercise in the running workout (machine busy). Swapping back restores the planned one. */
  swapExercise: (fromId: string, to: Exercise) => void;
  /** Show one exercise at a time (index), or null for the list. */
  setGuided: (idx: number | null) => void;

  setTab: (t: Tab) => void;
  setStartDate: (d: string) => void;
  start: (dayId: DayId, guided?: boolean) => void;
  edit: (exId: string, i: number, patch: Partial<SetLog>) => void;
  addSet: (exId: string) => void;
  removeSet: (exId: string) => void;
  finish: (cardio: number, note: string) => void;
  discard: () => void;
  deleteSession: (id: string) => void;

  // sync plumbing
  applyRemote: (rows: RemoteRow[], remoteStartDate: string | null) => void;
  markUploaded: (id: string) => void;
  markDeleted: (id: string) => void;
  markSettingsSaved: () => void;
}

const safeStorage = {
  getItem: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  setItem: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage full or blocked */ } },
  removeItem: (k: string) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

export const useWorkout = create<WorkoutState>()(
  persist(
    (set, get) => ({
      startDate: isoDay(),
      active: null,
      sessions: [],
      tab: 'today',
      pendingUp: [],
      pendingDel: [],
      settingsDirty: false,
      weights: [],
      pendingWUp: [],
      pendingWDel: [],

      addWeight: (kg, at) => set(s => {
        const entry: WeightEntry = { id: uid(), at, kg: Math.round(kg * 100) / 100 };
        return { weights: [...s.weights, entry].sort((a, b) => a.at - b.at), pendingWUp: [...s.pendingWUp, entry.id] };
      }),
      deleteWeight: id => set(s => ({
        weights: s.weights.filter(w => w.id !== id),
        pendingWUp: s.pendingWUp.filter(x => x !== id),
        pendingWDel: [...s.pendingWDel, id],
      })),
      applyRemoteWeights: rows => set(s => {
        const remoteIds = new Set(rows.map(r => r.id));
        const deleted = new Set(rows.filter(r => r.deleted).map(r => r.id));
        const live = rows.filter(r => !r.deleted && r.kg != null && !s.pendingWDel.includes(r.id))
          .map(r => ({ id: r.id, at: Number(r.at), kg: Number(r.kg) }));
        const localOnly = s.weights.filter(w => !remoteIds.has(w.id) && !deleted.has(w.id));
        return {
          weights: [...live, ...localOnly].sort((a, b) => a.at - b.at),
          pendingWUp: [...new Set([...s.pendingWUp.filter(id => !deleted.has(id)), ...localOnly.map(w => w.id)])],
        };
      }),
      markWeightUploaded: id => set(s => ({ pendingWUp: s.pendingWUp.filter(x => x !== id) })),
      markWeightDeleted: id => set(s => ({ pendingWDel: s.pendingWDel.filter(x => x !== id) })),

      routines: [],
      activeRoutineId: BUILTIN_ID,
      pendingRUp: [],
      pendingRDel: [],
      activeRoutineDirty: false,

      createRoutine: (name, fromId) => {
        const src = fromId ? findRoutine(get().routines, fromId) : null;
        const days = src ? clone(src.days) : Object.fromEntries(DAY_IDS.map(d => [d, emptyDay()])) as Record<DayId, RoutineDay>;
        const r: Routine = { id: uid(), name: name.trim() || 'New routine', updatedAt: Date.now(), days };
        set(s => ({ routines: [...s.routines, r], pendingRUp: [...s.pendingRUp, r.id] }));
        return r.id;
      },
      renameRoutine: (id, name) => editRoutine(set, id, r => { r.name = name.slice(0, 60); }),
      deleteRoutine: id => set(s => {
        if (isBuiltin(id)) return {};
        const wasActive = s.activeRoutineId === id;
        return {
          routines: s.routines.filter(r => r.id !== id),
          pendingRUp: s.pendingRUp.filter(x => x !== id),
          pendingRDel: [...s.pendingRDel, id],
          ...(wasActive ? { activeRoutineId: BUILTIN_ID, activeRoutineDirty: true } : {}),
        };
      }),
      setActiveRoutine: id => set({ activeRoutineId: id, activeRoutineDirty: true }),
      updateDay: (routineId, dayId, patch) => editRoutine(set, routineId, r => { r.days[dayId] = { ...(r.days[dayId] ?? emptyDay()), ...patch }; }),
      saveExercise: (routineId, dayId, ex, replaceId) => editRoutine(set, routineId, r => {
        const day = r.days[dayId] ?? (r.days[dayId] = emptyDay());
        const i = day.exercises.findIndex(e => e.id === (replaceId ?? ex.id));
        if (i >= 0) day.exercises[i] = ex; else day.exercises.push(ex);
      }),
      removeExercise: (routineId, dayId, exId) => editRoutine(set, routineId, r => {
        const day = r.days[dayId];
        if (day) day.exercises = day.exercises.filter(e => e.id !== exId);
      }),
      moveExercise: (routineId, dayId, from, to) => editRoutine(set, routineId, r => {
        const xs = r.days[dayId]?.exercises;
        if (!xs || to < 0 || to >= xs.length) return;
        const [m] = xs.splice(from, 1);
        xs.splice(to, 0, m);
      }),
      applyRemoteRoutines: (rows, remoteActiveId) => set(s => {
        const remote = new Map(rows.map(r => [r.id, r]));
        const kept: Routine[] = [];
        // Newest edit wins per routine; unsynced local edits are kept until uploaded.
        for (const local of s.routines) {
          const r = remote.get(local.id);
          if (!r) { kept.push(local); continue; }
          if (r.deleted) continue;
          const pending = s.pendingRUp.includes(local.id);
          kept.push(pending || !r.data || local.updatedAt > r.data.updatedAt ? local : r.data);
        }
        for (const r of rows) {
          if (!r.deleted && r.data && !s.routines.some(x => x.id === r.id) && !s.pendingRDel.includes(r.id)) kept.push(r.data);
        }
        const localOnly = s.routines.filter(x => !remote.has(x.id)).map(x => x.id);
        const pendingRUp = [...new Set([...s.pendingRUp.filter(id => !rows.some(r => r.id === id && r.deleted)), ...localOnly])];
        let activeRoutineId = s.activeRoutineId;
        if (!s.activeRoutineDirty && remoteActiveId) activeRoutineId = remoteActiveId;
        if (!isBuiltin(activeRoutineId) && !kept.some(r => r.id === activeRoutineId)) activeRoutineId = BUILTIN_ID;
        return { routines: kept, pendingRUp, activeRoutineId };
      }),
      markRoutineUploaded: id => set(s => ({ pendingRUp: s.pendingRUp.filter(x => x !== id) })),
      markRoutineDeleted: id => set(s => ({ pendingRDel: s.pendingRDel.filter(x => x !== id) })),
      markActiveRoutineSaved: () => set({ activeRoutineDirty: false }),

      machineNotes: {},
      notesVersion: 0,

      photos: {},
      pendingPUp: [],
      pendingPDel: [],
      setPhoto: (exId, at) => set(s => ({
        photos: { ...s.photos, [exId]: at },
        pendingPUp: s.pendingPUp.includes(exId) ? s.pendingPUp : [...s.pendingPUp, exId],
        pendingPDel: s.pendingPDel.filter(x => x !== exId),
      })),
      removePhoto: exId => set(s => {
        const photos = { ...s.photos };
        delete photos[exId];
        return { photos, pendingPUp: s.pendingPUp.filter(x => x !== exId), pendingPDel: s.pendingPDel.includes(exId) ? s.pendingPDel : [...s.pendingPDel, exId] };
      }),
      photoArrived: (exId, at) => set(s => ({ photos: { ...s.photos, [exId]: at } })),
      photoGone: exId => set(s => { const photos = { ...s.photos }; delete photos[exId]; return { photos }; }),
      markPhotoUploaded: exId => set(s => ({ pendingPUp: s.pendingPUp.filter(x => x !== exId) })),
      markPhotoDeleted: exId => set(s => ({ pendingPDel: s.pendingPDel.filter(x => x !== exId) })),
      notesSyncedVersion: 0,
      setMachineNote: (exId, text) => set(s => ({
        machineNotes: { ...s.machineNotes, [exId]: { text: text.slice(0, 200), at: Date.now() } },
        notesVersion: s.notesVersion + 1,
      })),
      applyRemoteNotes: remote => set(s => {
        if (!remote) return {};
        const merged: MachineNotes = { ...remote };
        let localNewer = false;
        for (const [k, v] of Object.entries(s.machineNotes)) {
          if (!merged[k] || v.at > merged[k].at) { merged[k] = v; if (!remote[k] || v.at > remote[k].at) localNewer = true; }
        }
        // If this device has edits the server lacks, make sure they get uploaded.
        return { machineNotes: merged, ...(localNewer && s.notesVersion === s.notesSyncedVersion ? { notesVersion: s.notesVersion + 1 } : {}) };
      }),
      markNotesSaved: version => set({ notesSyncedVersion: version }),

      swapExercise: (fromId, to) => set(s => {
        const a = s.active;
        if (!a) return {};
        const day = clone(activeDay(a));
        const i = day.exercises.findIndex(e => e.id === fromId);
        if (i < 0 || day.exercises.some(e => e.id === to.id)) return {};
        const from = day.exercises[i];
        const original = from.swappedFor ?? { id: from.id, name: from.name };
        const back = to.id === original.id;
        // Inside a superset the rest belongs to the slot (A1 = straight to A2), not to the exercise.
        const next: Exercise = { ...clone(to), sets: from.sets, superset: from.superset, swappedFor: back ? undefined : original,
          ...(from.superset ? { rest: from.rest } : {}) };
        if (back) delete next.swappedFor;
        day.exercises[i] = next;
        const last = lastFor(s.sessions, next.id);
        const lw = last?.e.sets[0]?.w;
        const w = lw != null ? String(lw) : next.start != null ? String(next.start) : '';
        const logs = { ...a.logs };
        delete logs[fromId];
        logs[next.id] = Array.from({ length: next.sets }, () => ({ w, r: '', done: false }));
        return { active: { ...a, day, logs } };
      }),

      setTab: tab => set({ tab }),
      setStartDate: startDate => set({ startDate, settingsDirty: true }),

      setGuided: idx => set(s => {
        if (!s.active) return {};
        const a = { ...s.active };
        if (idx == null) delete a.guided; else a.guided = Math.max(0, Math.min(idx, activeDay(a).exercises.length - 1));
        return { active: a };
      }),

      start: (dayId, guided = false) => {
        const routine = findRoutine(get().routines, get().activeRoutineId);
        const day = clone(toDay(routine, dayId));
        const logs: Record<string, SetLog[]> = {};
        const deload = programWeek(get().startDate).deload;
        day.exercises.forEach(e => {
          // Prefill the weight the coach suggests (add, stay, or go lighter).
          const kg = advise(get().sessions, e, { deload }).weight;
          const w = kg != null && kg > 0 ? String(kg) : '';
          logs[e.id] = Array.from({ length: e.sets }, () => ({ w, r: '', done: false }));
        });
        set({ active: { dayId, startedAt: Date.now(), logs, routineId: routine.id, day, ...(guided ? { guided: 0 } : {}) } });
      },

      edit: (exId, i, patch) => set(s => {
        if (!s.active) return {};
        const rows = s.active.logs[exId].map((r, j) => (j === i ? { ...r, ...patch } : r));
        return { active: { ...s.active, logs: { ...s.active.logs, [exId]: rows } } };
      }),

      addSet: exId => set(s => {
        if (!s.active) return {};
        const rows = s.active.logs[exId];
        const lastW = rows[rows.length - 1]?.w ?? '';
        return { active: { ...s.active, logs: { ...s.active.logs, [exId]: [...rows, { w: lastW, r: '', done: false }] } } };
      }),

      removeSet: exId => set(s => {
        if (!s.active || s.active.logs[exId].length <= 1) return {};
        return { active: { ...s.active, logs: { ...s.active.logs, [exId]: s.active.logs[exId].slice(0, -1) } } };
      }),

      finish: (cardio, note) => set(s => {
        const a = s.active;
        if (!a) return {};
        const day = activeDay(a);
        const ex = day.exercises
          .map(e => ({
            id: e.id, name: e.name, unit: e.unit, ...(e.swappedFor ? { swappedFor: e.swappedFor.name } : {}),
            sets: (a.logs[e.id] ?? []).filter(r => r.done && r.r !== '').map(r => ({ w: r.w === '' ? null : Number(r.w), r: Number(r.r) })),
          }))
          .filter(e => e.sets.length);
        const session: Session = {
          id: uid(), dayId: a.dayId, date: isoDay(new Date(a.startedAt)), startedAt: a.startedAt,
          mins: Math.max(1, Math.round((Date.now() - a.startedAt) / 60000)), cardio, note, ex,
          title: day.title, routineId: a.routineId ?? BUILTIN.id,
        };
        return { active: null, sessions: [session, ...s.sessions], pendingUp: [...s.pendingUp, session.id], tab: 'calendar' };
      }),

      discard: () => set({ active: null }),

      deleteSession: id => set(s => ({
        sessions: s.sessions.filter(x => x.id !== id),
        pendingUp: s.pendingUp.filter(x => x !== id),
        pendingDel: [...s.pendingDel, id],
      })),

      applyRemote: (rows, remoteStartDate) => set(s => {
        const remoteIds = new Set(rows.map(r => r.id));
        const deletedRemotely = new Set(rows.filter(r => r.deleted).map(r => r.id));
        const live = rows.filter(r => !r.deleted && r.data && !s.pendingDel.includes(r.id)).map(r => r.data as Session);
        // Local sessions the server has never seen (logged offline, or before signing in) get queued for upload.
        const localOnly = s.sessions.filter(x => !remoteIds.has(x.id) && !deletedRemotely.has(x.id));
        const pendingUp = [...new Set([...s.pendingUp.filter(id => !deletedRemotely.has(id)), ...localOnly.map(x => x.id)])];
        const sessions = [...live, ...localOnly].sort((a, b) => b.startedAt - a.startedAt);
        const startDate = remoteStartDate && !s.settingsDirty ? remoteStartDate : s.startDate;
        return { sessions, pendingUp, startDate };
      }),

      markUploaded: id => set(s => ({ pendingUp: s.pendingUp.filter(x => x !== id) })),
      markDeleted: id => set(s => ({ pendingDel: s.pendingDel.filter(x => x !== id) })),
      markSettingsSaved: () => set({ settingsDirty: false }),
    }),
    {
      // Tests run several simulated devices in one page, each with its own key (window.__storeKey).
      name: (globalThis as { __storeKey?: string }).__storeKey ?? 'ppl-log-v1',
      storage: createJSONStorage(() => safeStorage),
      partialize: s => ({
        startDate: s.startDate, active: s.active, sessions: s.sessions, tab: s.tab,
        pendingUp: s.pendingUp, pendingDel: s.pendingDel, settingsDirty: s.settingsDirty,
        weights: s.weights, pendingWUp: s.pendingWUp, pendingWDel: s.pendingWDel,
        routines: s.routines, activeRoutineId: s.activeRoutineId, pendingRUp: s.pendingRUp, pendingRDel: s.pendingRDel,
        activeRoutineDirty: s.activeRoutineDirty,
        machineNotes: s.machineNotes, notesVersion: s.notesVersion, notesSyncedVersion: s.notesSyncedVersion,
        photos: s.photos, pendingPUp: s.pendingPUp, pendingPDel: s.pendingPDel,
      }),
    },
  ),
);

/** Apply an edit to a copy of one of your routines and queue it for sync. The built-in plan is never edited. */
function editRoutine(set: (fn: (s: WorkoutState) => Partial<WorkoutState>) => void, id: string, fn: (r: Routine) => void) {
  if (isBuiltin(id)) return;
  set(s => {
    const i = s.routines.findIndex(r => r.id === id);
    if (i < 0) return {};
    const r = clone(s.routines[i]);
    fn(r);
    r.updatedAt = Date.now();
    const routines = [...s.routines];
    routines[i] = r;
    return { routines, pendingRUp: s.pendingRUp.includes(id) ? s.pendingRUp : [...s.pendingRUp, id] };
  });
}

/** Read actions outside React. */
export const act = () => useWorkout.getState();
