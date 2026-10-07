import { useState, type FormEvent } from 'react';
import { Sync, useSync } from '../store/sync';
import { useWorkout } from '../store/workout';

const ago = (t: number | null) => {
  if (!t) return 'not yet';
  const s = Math.round((Date.now() - t) / 1000);
  return s < 60 ? 'just now' : s < 3600 ? `${Math.round(s / 60)} min ago` : new Date(t).toLocaleString();
};

export default function AccountCard() {
  const { mode, email, lastSync, error } = useSync();
  const pending = useWorkout(s => s.pendingUp.length + s.pendingDel.length);
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [confirmOut, setConfirmOut] = useState(false);

  if (mode === 'unconfigured') {
    return (
      <section className="rounded-2xl border border-line bg-surface px-4 py-3">
        <div className="label">Sync</div>
        <p className="mt-2 text-[14px] text-muted">Sync isn't set up for this site yet, so workouts are saved on this device only. Add the Supabase environment variables on Netlify and redeploy to turn it on.</p>
      </section>
    );
  }

  if (email) {
    return (
      <section className="rounded-2xl border border-line bg-surface px-4 py-3">
        <div className="label">Sync</div>
        <p className="mt-2 text-[15px]">Signed in as <span className="font-semibold">{email}</span></p>
        <p className="text-[13px] text-muted">
          Last synced {ago(lastSync)}{pending ? ` · ${pending} change${pending > 1 ? 's' : ''} waiting` : ''}.
        </p>
        {error && <p className="mt-1 text-[13px] text-danger">{error}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="h-10 rounded-lg bg-sunk px-4 text-[14px] font-semibold" onClick={() => void Sync.syncNow()}>Sync now</button>
          {confirmOut
            ? <button className="h-10 rounded-lg px-3 text-[14px] font-bold text-danger" onClick={() => { setConfirmOut(false); void Sync.signOut(); }}>Tap again to sign out</button>
            : <button className="h-10 rounded-lg px-3 text-[14px] font-semibold text-muted" onClick={() => setConfirmOut(true)}>Sign out</button>}
        </div>
      </section>
    );
  }

  const submit = async (kind: 'in' | 'up', e?: FormEvent) => {
    e?.preventDefault();
    if (!form.email || form.password.length < 6) { setMsg({ tone: 'bad', text: 'Enter your email and a password of at least 6 characters.' }); return; }
    setBusy(true); setMsg(null);
    try {
      if (kind === 'in') await Sync.signIn(form.email.trim(), form.password);
      else {
        const { needsConfirm } = await Sync.signUp(form.email.trim(), form.password);
        setMsg(needsConfirm
          ? { tone: 'good', text: 'Account created. Open the confirmation email, then come back here and sign in.' }
          : { tone: 'good', text: 'Account created and signed in.' });
      }
    } catch (err: any) {
      setMsg({ tone: 'bad', text: err?.message ?? 'Something went wrong. Try again.' });
    } finally { setBusy(false); }
  };

  return (
    <section className="rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="label">Sync across devices</div>
      <p className="mt-2 text-[14px] text-muted">Sign in with the same account on your phone and laptop. Workouts logged before signing in upload automatically.</p>
      <form className="mt-3 grid gap-2" onSubmit={e => void submit('in', e)}>
        <input id="acct-email" type="email" autoComplete="email" placeholder="Email" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} className="h-11 w-full rounded-lg border border-line bg-bg px-3" />
        <input id="acct-password" type="password" autoComplete="current-password" placeholder="Password" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })} className="h-11 w-full rounded-lg border border-line bg-bg px-3" />
        {msg && <p className={`text-[13px] ${msg.tone === 'bad' ? 'text-danger' : 'text-good'}`}>{msg.text}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="h-11 flex-1 rounded-lg bg-accent font-bold text-accentInk disabled:opacity-60">{busy ? 'Working…' : 'Sign in'}</button>
          <button type="button" disabled={busy} onClick={() => void submit('up')} className="h-11 flex-1 rounded-lg border border-line font-semibold disabled:opacity-60">Create account</button>
        </div>
      </form>
    </section>
  );
}
