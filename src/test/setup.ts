import "fake-indexeddb/auto";
import { afterAll, afterEach, beforeEach, vi } from "vitest";
import { getDb } from "@/lib/db/database";

const browserGlobal = globalThis as typeof globalThis & {
  window?: Window & typeof globalThis;
};

browserGlobal.window ??= browserGlobal as unknown as Window & typeof globalThis;

beforeEach(async () => {
  const db = getDb();
  await db.transaction("rw", db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
  });
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(() => {
  getDb().close();
});
