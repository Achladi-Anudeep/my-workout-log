import { useState } from 'react';
import { demoGif } from '../../data/demos';
import type { Exercise } from '../../types';

/** The exercise's demo animation on a white tile (GIFs are drawn on white). Falls back to a dumbbell mark. */
export default function DemoGif({ e, size, className = '' }: { e: Exercise; size?: number; className?: string }) {
  const src = demoGif(e);
  const [failed, setFailed] = useState(false);
  const style = size ? { width: size, height: size } : undefined;
  if (!src || failed) {
    return (
      <span style={style} className={`grid shrink-0 place-items-center rounded-lg bg-sunk text-muted ${className}`} aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" /></svg>
      </span>
    );
  }
  return (
    <img src={src} alt={`Demo of ${e.name}`} loading="lazy" onError={() => setFailed(true)} style={style}
      className={`shrink-0 rounded-lg border border-line bg-white object-contain ${className}`} />
  );
}
