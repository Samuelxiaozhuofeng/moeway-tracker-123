import { describe, expect, it } from "vitest";
import { completeWorkUnits, uncompleteWorkUnit } from "@/lib/db/unit-completions";
import { createSession, listSessions } from "@/lib/db/sessions";
import { createWork, getWork } from "@/lib/db/works";

describe("work unit completions", () => {
  it("creates a 40 minute record when checking episodes 10 and 11", async () => {
    const work = await createWork({
      title: "Frieren",
      languageId: "lang_ja",
      kind: "listening",
      format: "anime",
      totalUnits: 12,
      averageCleanMinutes: 20
    });

    const result = await completeWorkUnits(work.id, [10, 11]);
    const sessions = await listSessions({ workId: work.id });

    expect(result).toMatchObject({
      action: "completed",
      addedUnitNumbers: [10, 11],
      skippedUnitNumbers: []
    });
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      minutes: 40,
      unitsCompleted: 2,
      unitStart: 10,
      unitEnd: 11,
      entrySource: "work-detail-toggle"
    });
    await expect(getWork(work.id)).resolves.toMatchObject({ completedUnits: 2 });
  });

  it("does not add time when the same completed episode is checked again", async () => {
    const work = await createWork({
      title: "Frieren",
      languageId: "lang_ja",
      kind: "listening",
      format: "anime",
      totalUnits: 12,
      averageCleanMinutes: 20
    });

    await completeWorkUnits(work.id, [10]);
    const repeated = await completeWorkUnits(work.id, [10]);
    const sessions = await listSessions({ workId: work.id });

    expect(repeated).toMatchObject({
      action: "skipped",
      addedUnitNumbers: [],
      skippedUnitNumbers: [10]
    });
    expect(sessions).toHaveLength(1);
    expect(sessions.reduce((sum, session) => sum + session.minutes, 0)).toBe(20);
    await expect(getWork(work.id)).resolves.toMatchObject({ completedUnits: 1 });
  });

  it("rolls back the matching session when a completed episode is unchecked", async () => {
    const work = await createWork({
      title: "Frieren",
      languageId: "lang_ja",
      kind: "listening",
      format: "anime",
      totalUnits: 12,
      averageCleanMinutes: 20
    });

    await completeWorkUnits(work.id, [10, 11]);
    await uncompleteWorkUnit(work.id, 10);
    const sessions = await listSessions({ workId: work.id });

    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      minutes: 20,
      unitsCompleted: 1,
      unitStart: 11,
      unitEnd: 11
    });
    await expect(getWork(work.id)).resolves.toMatchObject({ completedUnits: 1 });
  });

  it("calculates units for a consecutive batch session", async () => {
    const work = await createWork({
      title: "Podcast",
      languageId: "lang_ja",
      kind: "listening",
      format: "podcast",
      totalUnits: 10,
      averageCleanMinutes: 18
    });

    const session = await createSession({
      date: "2026-05-31",
      languageId: "lang_ja",
      kind: "listening",
      workId: work.id,
      minutes: 54,
      unitStart: 3,
      unitEnd: 5
    });

    expect(session).toMatchObject({
      unitsCompleted: 3,
      minutes: 54,
      unitStart: 3,
      unitEnd: 5,
      progressMode: "episodes"
    });
    await expect(getWork(work.id)).resolves.toMatchObject({ completedUnits: 3 });
  });

  it("keeps reading page progress separate from listening episode progress", async () => {
    const book = await createWork({
      title: "Novel",
      languageId: "lang_ja",
      kind: "reading",
      format: "book",
      progressMode: "pages",
      totalUnits: 300,
      averageCleanMinutes: 2
    });
    const anime = await createWork({
      title: "Anime",
      languageId: "lang_ja",
      kind: "listening",
      format: "anime",
      totalUnits: 12,
      averageCleanMinutes: 20
    });

    const pageSession = await createSession({
      date: "2026-05-31",
      languageId: "lang_ja",
      kind: "reading",
      workId: book.id,
      minutes: 12,
      unitStart: 10,
      unitEnd: 15
    });
    const episodeSession = await createSession({
      date: "2026-05-31",
      languageId: "lang_ja",
      kind: "listening",
      workId: anime.id,
      minutes: 40,
      unitStart: 1,
      unitEnd: 2
    });

    expect(pageSession).toMatchObject({ progressMode: "pages", unitsCompleted: 6 });
    expect(episodeSession).toMatchObject({ progressMode: "episodes", unitsCompleted: 2 });
    await expect(getWork(book.id)).resolves.toMatchObject({ completedUnits: 6 });
    await expect(getWork(anime.id)).resolves.toMatchObject({ completedUnits: 2 });
  });

  it("rejects invalid or out-of-range unit ranges", async () => {
    const work = await createWork({
      title: "Short show",
      languageId: "lang_ja",
      kind: "listening",
      format: "anime",
      totalUnits: 3
    });

    await expect(createSession({
      languageId: "lang_ja",
      kind: "listening",
      workId: work.id,
      minutes: 20,
      unitStart: 3,
      unitEnd: 2
    })).rejects.toThrow("起始进度不能大于结束进度。");

    await expect(createSession({
      languageId: "lang_ja",
      kind: "listening",
      workId: work.id,
      minutes: 20,
      unitStart: 1,
      unitEnd: 4
    })).rejects.toThrow("进度不能超过总数 3。");
  });
});
