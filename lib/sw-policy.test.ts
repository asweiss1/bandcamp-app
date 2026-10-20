import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { CACHE_NAME, PRECACHE, cacheMode } from "./sw-policy";

describe("phone cache policy", () => {
  it("caches the app shell and static chunks, and skips writes", () => {
    assert.equal(cacheMode("/phone/plan", "GET"), "shell");
    assert.equal(cacheMode("/phone/gig/bk-yucca-mesa", "GET"), "shell");
    assert.equal(cacheMode("/_next/static/chunks/app.js", "GET"), "static");
    assert.equal(cacheMode("/api/fuel", "GET"), "api");
    assert.equal(cacheMode("/phone/plan", "POST"), "ignore");
    assert.equal(cacheMode("/book", "GET"), "ignore");
  });

  it("keeps the service worker on the same shell list", () => {
    const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
    assert.match(source, new RegExp(CACHE_NAME));
    for (const path of PRECACHE) assert.match(source, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });
});
