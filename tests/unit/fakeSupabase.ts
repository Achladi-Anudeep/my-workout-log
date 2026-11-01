/**
 * A small in-memory stand-in for the Supabase client, covering exactly what the app uses:
 * auth.getSession / onAuthStateChange / signIn / signOut, and from(table).upsert / select / order / maybeSingle.
 * It enforces the same rule as our row level security: each user only sees and writes their own rows.
 */
type Row = Record<string, any>;

export interface FakeDb {
  tables: Record<string, Map<string, Row>>;
  /** Tables that "don't exist yet" (a migration that wasn't run). */
  missing: Set<string>;
  /** When true every request fails like a dropped connection. */
  offline: boolean;
  /** When true uploads "succeed" but are silently dropped (a misbehaving server). */
  dropUploads: boolean;
  calls: number;
}

export const createDb = (): FakeDb => ({ tables: {}, missing: new Set(), offline: false, dropUploads: false, calls: 0 });

const keyOf = (table: string, row: Row) => (table === 'settings' ? row.user_id : row.id);

export function createFakeSupabase(db: FakeDb, user: { id: string; email: string } | null) {
  const err = (code: string, message: string) => ({ data: null, error: { code, message } });
  const guard = (table: string) => {
    db.calls++;
    if (db.offline) throw new TypeError('Failed to fetch');
    if (db.missing.has(table)) return err('PGRST205', `Could not find the table 'public.${table}' in the schema cache`);
    if (!user) return err('42501', 'not signed in');
    return null;
  };
  const tableOf = (t: string) => (db.tables[t] ??= new Map());

  function from(table: string) {
    return {
      async upsert(row: Row) {
        const g = guard(table); if (g) return g;
        if (row.user_id !== user!.id) return err('42501', 'new row violates row-level security policy');
        const existing = tableOf(table).get(keyOf(table, row));
        if (existing && existing.user_id !== user!.id) return err('42501', 'row-level security');
        if (!db.dropUploads) tableOf(table).set(keyOf(table, row), JSON.parse(JSON.stringify(row)));
        return { data: null, error: null };
      },
      select(cols: string) {
        const pick = (r: Row) => Object.fromEntries(cols.split(',').map(c => c.trim()).map(c => [c, r[c]]));
        let order: { col: string; asc: boolean } | null = null;
        const run = () => {
          const g = guard(table); if (g) return g;
          let rows = [...tableOf(table).values()].filter(r => r.user_id === user!.id);
          if (order) { const o = order; rows.sort((a, b) => (a[o.col] - b[o.col]) * (o.asc ? 1 : -1)); }
          return { data: JSON.parse(JSON.stringify(rows.map(pick))), error: null };
        };
        const q: any = {
          order(col: string, opts?: { ascending?: boolean }) { order = { col, asc: opts?.ascending !== false }; return q; },
          async maybeSingle() {
            const res: any = run();
            if (res.error) return res;
            if (res.data.length > 1) return err('PGRST116', 'multiple rows');
            return { data: res.data[0] ?? null, error: null };
          },
          then(resolve: (v: any) => any, reject: (e: any) => any) {
            try { return Promise.resolve(run()).then(resolve, reject); } catch (e) { return Promise.reject(e).then(resolve, reject); }
          },
        };
        return q;
      },
    };
  }

  return {
    from,
    auth: {
      async getSession() { return { data: { session: user ? { user } : null } }; },
      onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
      async signInWithPassword() { return { error: null }; },
      async signUp() { return { data: { session: null }, error: null }; },
      async signOut() { return { error: null }; },
    },
  };
}
