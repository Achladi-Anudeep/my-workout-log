/**
 * Machine photos live in IndexedDB on the device (too big for the app's normal saved state),
 * keyed by exercise id. Falls back to memory where IndexedDB isn't available (tests, private modes).
 */
const DB = 'workout-photos';
const STORE = 'photos';
const memory = new Map<string, string>();

let dbPromise: Promise<IDBDatabase | null> | null = null;
function open(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  dbPromise ??= new Promise(resolve => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  return open().then(db => new Promise<T | undefined>(resolve => {
    if (!db) return resolve(undefined);
    try {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    } catch { resolve(undefined); }
  }));
}

export const PhotoStore = {
  async get(exId: string): Promise<string | null> {
    const v = await run<string>('readonly', s => s.get(exId));
    return v ?? memory.get(exId) ?? null;
  },
  async put(exId: string, dataUrl: string) {
    memory.set(exId, dataUrl);
    await run('readwrite', s => s.put(dataUrl, exId));
  },
  async del(exId: string) {
    memory.delete(exId);
    await run('readwrite', s => s.delete(exId));
  },
};

/** Shrinks a camera photo to at most `max` px on the long side as a JPEG data URL (~100 KB). */
export async function compressPhoto(file: Blob, max = 900, quality = 0.72): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Could not read that image'));
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
