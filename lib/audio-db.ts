export const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
export const MAX_UPLOADS = 6;
const DB_NAME = "bandcamp.audio.v1";
const STORE = "tracks";
export const AUDIO_EVENT = "bandcamp-audio";

export type StoredTrack = {
  id: string;
  bandId: string;
  title: string;
  notes: string;
  mime: string;
  byteLength: number;
  blob: Blob;
  createdAt: string;
};

export function audioFileError(file: File) {
  const name = file.name.toLowerCase();
  const ok = name.endsWith(".mp3") || name.endsWith(".wav") || name.endsWith(".m4a");
  if (!ok) return "Use an mp3, wav, or m4a file.";
  if (file.size > MAX_AUDIO_BYTES) return "That file is over 8 MB.";
  if (file.size < 64) return "That file looks empty.";
  return null;
}

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("bandId", "bandId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listAllTracks() {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDb();
  return new Promise<StoredTrack[]>((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).getAll();
    request.onsuccess = () => resolve((request.result as StoredTrack[]) ?? []);
    request.onerror = () => reject(request.error);
  });
}

export async function listTracks(bandId: string) {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDb();
  return new Promise<StoredTrack[]>((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).index("bandId").getAll(bandId);
    request.onsuccess = () => {
      const rows = (request.result as StoredTrack[]).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      resolve(rows);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function countTracks(bandId: string) {
  const rows = await listTracks(bandId);
  return rows.length;
}

export async function saveTrack(track: StoredTrack) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(track);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  window.dispatchEvent(new Event(AUDIO_EVENT));
}

export async function deleteTrack(id: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  window.dispatchEvent(new Event(AUDIO_EVENT));
}

export async function clearAudioTracks() {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  window.dispatchEvent(new Event(AUDIO_EVENT));
}
