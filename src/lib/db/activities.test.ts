import { describe, expect, it } from "vitest";
import { createActivity, deleteActivity, listActivities, markActivityUsed, updateActivity } from "@/lib/db/activities";
import { getDb } from "@/lib/db/database";
import { makeActivity } from "@/test/factories";

describe("activities", () => {
  it("creates and lists reusable activity templates", async () => {
    const activity = await createActivity({
      name: " Anki ",
      languageId: "lang_es",
      kind: "listening",
      defaultMinutes: 14.6,
      note: " deck "
    });

    await expect(listActivities()).resolves.toMatchObject([
      {
        id: activity.id,
        name: "Anki",
        languageId: "lang_es",
        kind: "listening",
        defaultMinutes: 15,
        note: "deck",
        syncState: "dirty"
      }
    ]);
  });

  it("keeps global activities visible when filtering by language", async () => {
    await getDb().activities.bulkAdd([
      makeActivity({ id: "activity_global", languageId: null, name: "Shadowing" }),
      makeActivity({ id: "activity_es", languageId: "lang_es", name: "Spanish YouTube" }),
      makeActivity({ id: "activity_ja", languageId: "lang_ja", name: "Japanese YouTube" })
    ]);

    const activities = await listActivities({ languageId: "lang_es" });
    expect(activities.map((activity) => activity.id).sort()).toEqual(["activity_es", "activity_global"]);
  });

  it("updates usage timestamps and soft deletes activities", async () => {
    await getDb().activities.add(makeActivity());

    await markActivityUsed("activity_1", "2026-06-01T08:00:00.000Z");
    await expect(getDb().activities.get("activity_1")).resolves.toMatchObject({
      lastUsedAt: "2026-06-01T08:00:00.000Z",
      syncState: "dirty"
    });

    await updateActivity("activity_1", { name: "Anki listening", defaultMinutes: 20 });
    await expect(getDb().activities.get("activity_1")).resolves.toMatchObject({
      name: "Anki listening",
      defaultMinutes: 20
    });

    await deleteActivity("activity_1");
    await expect(listActivities()).resolves.toEqual([]);
    await expect(getDb().activities.get("activity_1")).resolves.toMatchObject({ syncState: "deleted" });
  });
});
