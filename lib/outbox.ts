export const OUTBOX_KEY = "bandcamp.outbox.v1";
export const OUTBOX_EVENT = "bandcamp-outbox";
export const OUTBOX_LIMIT = 40;

export type OutboxItem = {
  id: string;
  at: string;
  op: string;
  summary: string;
};

export function isOutboxItem(value: unknown): value is OutboxItem {
  if (!value || typeof value !== "object") return false;
  const item = value as OutboxItem;
  return typeof item.id === "string" && typeof item.at === "string" && typeof item.op === "string" && typeof item.summary === "string";
}

export function queueIfOffline(online: boolean, items: OutboxItem[], item: OutboxItem): OutboxItem[] {
  if (online) return items;
  return [...items, item].slice(-OUTBOX_LIMIT);
}

export function flushOutbox(items: OutboxItem[]) {
  return { pending: [] as OutboxItem[], synced: items };
}

export function readOutbox(): OutboxItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(OUTBOX_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isOutboxItem) : [];
  } catch {
    return [];
  }
}

export function writeOutbox(items: OutboxItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(OUTBOX_EVENT));
}

export function rememberOfflineChange(summary: string, id: string, at: string) {
  if (typeof navigator === "undefined" || navigator.onLine) return;
  writeOutbox(queueIfOffline(false, readOutbox(), { id, at, op: "save", summary }));
}

export function syncOutbox(): OutboxItem[] {
  const synced = flushOutbox(readOutbox()).synced;
  if (synced.length === 0) return synced;
  writeOutbox([]);
  return synced;
}
