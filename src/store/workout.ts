import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DAY } from '../data/plan';
import { isoDay, lastFor, uid } from '../lib/utils';
import type { Active, DayId, Session, SetLog, WeightEntry } from '../types';

export type Tab = 'today' | 'calendar' | 'progress' | 'tutorials' | 'plan';

/** A row as stored in Supabase: deletes are soft so they reach every device. */
export interface RemoteRow { id: string; data: Session | null; deleted: boolean; }
export interface RemoteWeightRow { id: string; at: number; kg: number | null; deleted: boolean; }

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

  setTab: (t: Tab) => void;
  setStartDate: (d: string) => void;
  start: (dayId: DayId) => void;
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

      setTab: tab => set({ tab }),
      setStartDate: startDate => set({ startDate, settingsDirty: true }),

      start: dayId => {
        const logs: Record<string, SetLog[]> = {};
        DAY[dayId].exercises.forEach(e => {
          const last = lastFor(get().sessions, e.id);
          const lw = last?.e.sets[0]?.w;
          const w = lw != null ? String(lw) : e.start != null ? String(e.start) : '';
          logs[e.id] = Array.from({ length: e.sets }, () => ({ w, r: '', done: false }));
        });
        set({ active: { dayId, startedAt: Date.now(), logs } });
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
        const day = DAY[a.dayId];
        const ex = day.exercises
          .map(e => ({
            id: e.id, name: e.name, unit: e.unit,
            sets: a.logs[e.id].filter(r => r.done && r.r !== '').map(r => ({ w: r.w === '' ? null : Number(r.w), r: Number(r.r) })),
          }))
          .filter(e => e.sets.length);
        const session: Session = {
          id: uid(), dayId: a.dayId, date: isoDay(new Date(a.startedAt)), startedAt: a.startedAt,
          mins: Math.max(1, Math.round((Date.now() - a.startedAt) / 60000)), cardio, note, ex,
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
      name: 'ppl-log-v1',
      storage: createJSONStorage(() => safeStorage),
      partialize: s => ({
        startDate: s.startDate, active: s.active, sessions: s.sessions, tab: s.tab,
        pendingUp: s.pendingUp, pendingDel: s.pendingDel, settingsDirty: s.settingsDirty,
        weights: s.weights, pendingWUp: s.pendingWUp, pendingWDel: s.pendingWDel,
      }),
    },
  ),
);

/** Read actions outside React. */
export const act = () => useWorkout.getState();
