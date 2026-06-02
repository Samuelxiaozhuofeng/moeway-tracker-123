import { describe, expect, it } from "vitest";
import { getDb } from "@/lib/db/database";
import { createSession, deleteSession, updateSession } from "@/lib/db/sessions";
import { createWork, getWork } from "@/lib/db/works";
import { makeActivity } from "@/test/factories";

describe("session progress recalculation", () => {
  it("creates activity sessions and marks the activity as used", async () => {
    await getDb().activities.add(makeActivity({ id: "activity_anki", name: "Anki", languageId: "lang_es" }));

    const session = await createSession({
      date: "2026-06-01",
      languageId: "lang_es",
      kind: "listening",
      activityId: "activity_anki",
      minutes: 15
    });

    await expect(getDb().sessions.get(session.id)).resolves.toMatchObject({
      activityId: "activity_anki",
      workId: null,
      workTitle: "Anki",
      entrySource: "activity"
    });
    await expect(getDb().activities.get("activity_anki")).resolves.toMatchObject({
      lastUsedAt: expect.any(String),
      syncState: "dirty"
    });
  });

  it("updates the linked work by the units delta when a session changes", async () => {
    const work = await createWork({
      title: "Frieren",
      languageId: "lang_ja",
      kind: "listening",
      format: "anime"
    });
    const session = await createSession({
      date: "2026-05-30",
      languageId: "lang_ja",
      kind: "listening",
      workId: work.id,
      minutes: 24,
      unitsCompleted: 2
    });

    await updateSession(session.id, {
      date: "2026-05-31",
      minutes: 48,
      unitsCompleted: 5
    });

    await expect(getWork(work.id)).resolves.toMatchObject({
      completedUnits: 5,
      lastRecordedAt: "2026-05-31"
    });
  });

  it("moves progress between works when a session is relinked", async () => {
    const sourceWork = await createWork({
      title: "Source",
      languageId: "lang_ja",
      kind: "reading",
      format: "manga"
    });
    const targetWork = await createWork({
      title: "Target",
      languageId: "lang_ja",
      kind: "reading",
      format: "manga"
    });
    const session = await createSession({
      date: "2026-05-30",
      languageId: "lang_ja",
      kind: "reading",
      workId: sourceWork.id,
      minutes: 30,
      unitsCompleted: 3
    });

    await updateSession(session.id, {
      workId: targetWork.id,
      unitsCompleted: 4,
      date: "2026-05-31"
    });

    await expect(getWork(sourceWork.id)).resolves.toMatchObject({ completedUnits: 0 });
    await expect(getWork(targetWork.id)).resolves.toMatchObject({
      completedUnits: 4,
      lastRecordedAt: "2026-05-31"
    });
  });

  it("subtracts deleted session progress from the linked work", async () => {
    const work = await createWork({
      title: "Frieren",
      languageId: "lang_ja",
      kind: "listening",
      format: "anime"
    });
    const session = await createSession({
      date: "2026-05-31",
      languageId: "lang_ja",
      kind: "listening",
      workId: work.id,
      minutes: 24,
      unitsCompleted: 2
    });

    await deleteSession(session.id);

    await expect(getWork(work.id)).resolves.toMatchObject({ completedUnits: 0 });
    await expect(getDb().sessions.get(session.id)).resolves.toMatchObject({
      syncState: "deleted",
      unitsCompleted: 2
    });
  });
});
