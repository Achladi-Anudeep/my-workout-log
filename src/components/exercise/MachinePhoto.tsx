import { useEffect, useRef, useState } from 'react';
import { act, useWorkout } from '../../store/workout';
import { PhotoStore, compressPhoto } from '../../lib/photoStore';

/** The photo for an exercise, reloaded whenever it changes on this or another device. */
export function usePhoto(exId: string) {
  const at = useWorkout(s => s.photos[exId]);
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    if (at == null) { setSrc(null); return; }
    PhotoStore.get(exId).then(v => { if (live) setSrc(v); });
    return () => { live = false; };
  }, [exId, at]);
  return src;
}

/** Small tile of your own photo, for exercise cards. Renders nothing when there's no photo. */
export function PhotoThumb({ exId, size = 72 }: { exId: string; size?: number }) {
  const src = usePhoto(exId);
  if (!src) return null;
  return <img src={src} alt="My photo of the machine" style={{ width: size, height: size }} className="shrink-0 rounded-lg border border-line object-cover" />;
}

/** "My machine" photo: take or pick one, replace or remove it. Synced across your devices. */
export default function MachinePhoto({ exId }: { exId: string }) {
  const src = usePhoto(exId);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setBusy(true); setError('');
    try {
      const data = await compressPhoto(file);
      await PhotoStore.put(exId, data);
      act().setPhoto(exId, Date.now());
    } catch (e: any) {
      setError(e?.message ?? 'Could not save that photo');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  const picker = (
    <input ref={input} id={`photo-input-${exId}`} type="file" accept="image/*" className="hidden" onChange={e => void onPick(e.target.files?.[0])} />
  );

  if (!src) {
    return (
      <div>
        {picker}
        <button className="text-left text-[14px] font-semibold text-accent" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? 'Saving photo…' : '📷 Add your own photo (machine or setup)'}
        </button>
        {error && <p className="text-[13px] text-danger">{error}</p>}
      </div>
    );
  }
  return (
    <figure className="grid gap-1.5">
      {picker}
      <div className="label">My photo</div>
      <img src={src} alt="My photo of the machine" className="max-h-72 w-full rounded-xl border border-line object-cover" />
      <figcaption className="flex gap-4 text-[13px] font-semibold">
        <button className="text-accent" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Saving…' : 'Replace photo'}</button>
        {confirm
          ? <button className="text-danger" onClick={() => { void PhotoStore.del(exId); act().removePhoto(exId); setConfirm(false); }}>Tap again to remove</button>
          : <button className="text-muted" onClick={() => setConfirm(true)}>Remove</button>}
      </figcaption>
      {error && <p className="text-[13px] text-danger">{error}</p>}
    </figure>
  );
}
