import type { Session } from '../types';
import { fmtDate, fmtW, volumeOf } from './utils';

/**
 * A poster-style summary image of one workout (1080×1350, Instagram portrait), drawn on a canvas.
 * Shared through the phone's share sheet when it can take files, otherwise downloaded.
 */
export async function drawShareCard(s: Session, title: string, plate: string): Promise<Blob> {
  const W = 1080, H = 1350;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  try { await Promise.all([document.fonts.load('120px Anton'), document.fonts.load('600 36px Barlow'), document.fonts.load('700 40px "Barlow Condensed"')]); } catch { /* fall back to system fonts */ }

  // Plate colours are CSS variables like var(--p-blue): resolve them for the canvas.
  const v = /^var\((--[\w-]+)\)$/.exec(plate);
  if (v) plate = getComputedStyle(document.documentElement).getPropertyValue(v[1]).trim() || '#2350D8';
  const paper = '#F3EFE6', ink = '#17150F', hot = '#D8322A', muted = '#5F5B51';
  g.fillStyle = paper; g.fillRect(0, 0, W, H);

  // The plate, cropped off the top right corner.
  g.fillStyle = plate; g.beginPath(); g.arc(W - 120, 230, 300, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 6; g.beginPath(); g.arc(W - 120, 230, 228, 0, Math.PI * 2); g.stroke();
  g.fillStyle = paper; g.beginPath(); g.arc(W - 120, 230, 56, 0, Math.PI * 2); g.fill();

  const pad = 80;
  g.fillStyle = muted; g.font = '700 40px "Barlow Condensed", sans-serif';
  g.fillText(`${fmtDate(s.date).toUpperCase()}${s.venue === 'home' ? ' · HOME' : ''}`, pad, 140);

  // Title, wrapped onto up to 3 lines.
  g.fillStyle = ink; g.font = '150px Anton, Impact, sans-serif';
  const words = title.toUpperCase().split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (g.measureText(t).width > W - pad * 2 - 160 && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  lines.slice(0, 3).forEach((l, i) => g.fillText(l, pad, 300 + i * 150));
  let y = 300 + Math.min(lines.length, 3) * 150 + 10;

  // Three stat tiles.
  const sets = s.ex.reduce((a, e) => a + e.sets.length, 0);
  const vol = Math.round(volumeOf(s));
  const stats: [string, string][] = [[`${s.mins}`, 'MIN'], [`${sets}`, 'SETS'], [vol ? vol.toLocaleString() : `${s.ex.length}`, vol ? 'KG LIFTED' : 'MOVES']];
  const tw = (W - pad * 2 - 40) / 3;
  stats.forEach(([v, k], i) => {
    const x = pad + i * (tw + 20);
    g.fillStyle = i === 0 ? hot : ink; roundRect(g, x, y, tw, 190, 28); g.fill();
    g.fillStyle = paper; g.font = '96px Anton, Impact, sans-serif'; g.fillText(v, x + 28, y + 115);
    g.font = '700 34px "Barlow Condensed", sans-serif'; g.fillText(k, x + 30, y + 162);
  });
  y += 260;

  // Top exercises with their best set.
  g.font = '600 38px Barlow, sans-serif';
  for (const e of s.ex.slice(0, 6)) {
    const best = e.sets.reduce((b, x) => ((x.w ?? 0) > (b.w ?? 0) || ((x.w ?? 0) === (b.w ?? 0) && x.r > b.r) ? x : b), e.sets[0]);
    g.fillStyle = ink; g.fillText(fit(g, e.name, W - pad * 2 - 260), pad, y);
    g.fillStyle = muted; g.textAlign = 'right';
    g.fillText(`${fmtW(best.w)}×${best.r}${e.unit === 'sec' ? 's' : ''}`, W - pad, y);
    g.textAlign = 'left';
    g.strokeStyle = '#DDD6C8'; g.lineWidth = 2; g.beginPath(); g.moveTo(pad, y + 26); g.lineTo(W - pad, y + 26); g.stroke();
    y += 74;
    if (y > H - 140) break;
  }

  g.fillStyle = ink; g.font = '44px Anton, Impact, sans-serif'; g.fillText('MY WORKOUT LOG', pad, H - 70);
  g.fillStyle = hot; g.beginPath(); g.arc(W - pad - 22, H - 86, 22, 0, Math.PI * 2); g.fill();

  return new Promise((resolve, reject) => c.toBlob(b => (b ? resolve(b) : reject(new Error('Could not draw the card'))), 'image/png'));
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

function fit(g: CanvasRenderingContext2D, text: string, max: number) {
  if (g.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && g.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

/** Share the image if the phone allows it, else save it. Returns what happened. */
export async function shareImage(blob: Blob, name: string): Promise<'shared' | 'saved' | 'cancelled'> {
  const file = new File([blob], name, { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title: 'My workout' }); return 'shared'; } catch { return 'cancelled'; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'saved';
}
