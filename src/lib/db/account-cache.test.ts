import { beforeEach, describe, expect, it } from "vitest";
import { prepareLocalCacheForUser } from "@/lib/db/account-cache";
import { getDb } from "@/lib/db/database";
import { listWorks } from "@/lib/db/works";
import { makeWork } from "@/test/factories";

const storage = new Map<string, string>();

Object.defineProperty(window, "localStorage", {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key)
  },
  configurable: true
});

describe("account cache isolation", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("clears local account data when the authenticated user changes", async () => {
    storage.set("immerselog:cache-user-id", "user_a");
    await getDb().works.add(makeWork({ id: "work_user_a", userId: "user_a" }));

    await prepareLocalCacheForUser("user_b");

    await expect(listWorks()).resolves.toHaveLength(0);
    expect(storage.get("immerselog:cache-user-id")).toBe("user_b");
    await expect(getDb().languages.count()).resolves.toBeGreaterThan(0);
  });

  it("keeps local account data for the same authenticated user", async () => {
    storage.set("immerselog:cache-user-id", "user_a");
    await getDb().works.add(makeWork({ id: "work_user_a", userId: "user_a" }));

    await prepareLocalCacheForUser("user_a");

    await expect(listWorks()).resolves.toMatchObject([{ id: "work_user_a" }]);
  });
});
