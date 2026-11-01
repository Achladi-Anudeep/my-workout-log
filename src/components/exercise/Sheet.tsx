import type { ReactNode } from 'react';

/** Bottom sheet used for exercise demos and swaps. Tapping the backdrop closes it. */
export default function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border-t border-line bg-surface px-4 pt-4"
        style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }} onClick={e => e.stopPropagation()}>
        <div className="mx-auto grid max-w-xl gap-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="disp text-[26px] font-bold uppercase leading-tight">{title}</h2>
            <button className="h-9 shrink-0 rounded-lg bg-sunk px-3 text-[13px] font-semibold" onClick={onClose}>Close</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
