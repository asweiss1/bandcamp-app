import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { flushOutbox, queueIfOffline, type OutboxItem } from "./outbox";

function item(id: string): OutboxItem {
  return { id, at: "2026-10-20T12:00:00.000Z", op: "save", summary: "Saved a change on this phone" };
}

describe("offline outbox", () => {
  it("keeps the queue empty while online", () => {
    assert.deepEqual(queueIfOffline(true, [item("a")], item("b")), [item("a")]);
  });

  it("queues a change made offline and caps the list", () => {
    const start = Array.from({ length: 40 }, (_, index) => item(String(index)));
    const next = queueIfOffline(false, start, item("new"));
    assert.equal(next.length, 40);
    assert.equal(next[0]?.id, "1");
    assert.equal(next.at(-1)?.id, "new");
  });

  it("flushes every queued change", () => {
    const queued = [item("a"), item("b")];
    const result = flushOutbox(queued);
    assert.deepEqual(result.pending, []);
    assert.deepEqual(result.synced, queued);
  });
});
