import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/lib/db/database";
import { getWork } from "@/lib/db/works";
import { makeActivity, makeWork } from "@/test/factories";
import { syncWithSupabase } from "@/lib/supabase/sync";

const getSupabaseClient = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient
}));

function mockSupabase(remoteRows: unknown[] = []) {
  const upserts: unknown[][] = [];
  getSupabaseClient.mockReturnValue({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: "user_1" } } },
        error: null
      })
    },
    from: vi.fn(() => ({
      upsert: vi.fn(async (payload: unknown[]) => {
        upserts.push(payload);
        return { error: null };
      }),
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: remoteRows, error: null })
      }))
    }))
  });
  return upserts;
}

describe("syncWithSupabase deletion semantics", () => {
  beforeEach(() => {
    getSupabaseClient.mockReset();
  });

  it("pushes local deletions using deletedAt and marks them synced", async () => {
    const deletedAt = "2026-05-31T09:00:00.000Z";
    const upserts = mockSupabase();
    await getDb().works.add(makeWork({ deletedAt, syncState: "deleted" }));

    await expect(syncWithSupabase()).resolves.toEqual({ ok: true });

    expect(upserts[0]).toMatchObject([{ id: "work_1", deleted_at: deletedAt }]);
    await expect(getDb().works.get("work_1")).resolves.toMatchObject({
      deletedAt,
      syncState: "synced",
      userId: "user_1"
    });
  });

  it("syncs activity templates as first-class entities", async () => {
    const upserts = mockSupabase();
    await getDb().activities.add(makeActivity({ id: "activity_anki", name: "Anki" }));

    await expect(syncWithSupabase()).resolves.toEqual({ ok: true });

    expect(upserts[0]).toMatchObject([
      {
        id: "activity_anki",
        entity_type: "activities",
        payload: { name: "Anki", syncState: "synced", userId: "user_1" }
      }
    ]);
    await expect(getDb().activities.get("activity_anki")).resolves.toMatchObject({
      syncState: "synced",
      userId: "user_1"
    });
  });

  it("stores remote deletions as synced tombstones that stay hidden", async () => {
    const deletedAt = "2026-05-31T09:00:00.000Z";
    mockSupabase([
      {
        id: "work_remote",
        entity_type: "works",
        payload: makeWork({ id: "work_remote", title: "Remote", syncState: "synced" }),
        deleted_at: deletedAt,
        updated_at: "2026-05-31T09:30:00.000Z"
      }
    ]);

    await expect(syncWithSupabase()).resolves.toEqual({ ok: true });

    await expect(getDb().works.get("work_remote")).resolves.toMatchObject({
      deletedAt,
      syncState: "synced"
    });
    await expect(getWork("work_remote")).resolves.toBeUndefined();
  });
});
