import { describe, expect, it, vi } from "vitest";
import { createWork } from "@/lib/db/works";
import { listSessions } from "@/lib/db/sessions";

describe("createWork", () => {
  it("creates a historical import session for existing completed units", async () => {
    vi.setSystemTime(new Date("2026-05-31T10:15:00.000Z"));

    const work = await createWork({
      title: "  Frieren  ",
      languageId: "lang_ja",
      kind: "listening",
      format: "anime",
      totalUnits: 28,
      completedUnits: 6,
      averageCleanMinutes: 24
    });

    const sessions = await listSessions({ workId: work.id });

    expect(work.title).toBe("Frieren");
    expect(work.completedUnits).toBe(6);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      date: "2026-05-31",
      languageId: "lang_ja",
      kind: "listening",
      workId: work.id,
      workTitle: "Frieren",
      minutes: 144,
      unitsCompleted: 6,
      note: "添加作品时自动导入的历史进度。",
      phrases: [],
      isHistoricalImport: true,
      syncState: "dirty"
    });
  });

  it("does not create a historical import session when no progress is provided", async () => {
    await createWork({
      title: "Yotsuba&!",
      languageId: "lang_ja",
      kind: "reading",
      format: "manga",
      completedUnits: 0,
      averageCleanMinutes: 15
    });

    expect(await listSessions()).toHaveLength(0);
  });
});
