import { describe, expect, it } from "vitest";
import { backupToCsvRows, exportBackup, importBackup } from "@/lib/db/backup";
import { getDb } from "@/lib/db/database";
import { makeLanguage, makeSession, makeWork } from "@/test/factories";

describe("backup import and export", () => {
  it("round-trips persisted entities through a JSON backup", async () => {
    const db = getDb();
    const language = makeLanguage();
    const work = makeWork({
      progressMode: "pages",
      seasonCount: 2,
      seasonLabel: "S2"
    });
    const session = makeSession({
      progressMode: "pages",
      unitStart: 10,
      unitEnd: 12,
      entrySource: "work-detail-toggle"
    });

    await db.languages.add(language);
    await db.works.add(work);
    await db.sessions.add(session);

    const exported = await exportBackup();
    await db.languages.clear();
    await db.works.clear();
    await db.sessions.clear();
    await importBackup(exported);

    await expect(db.languages.toArray()).resolves.toEqual([language]);
    await expect(db.works.toArray()).resolves.toEqual([work]);
    await expect(db.sessions.toArray()).resolves.toEqual([session]);
  });

  it("rejects unsupported backup versions", async () => {
    const payload = {
      version: 2,
      exportedAt: "2026-05-31T08:00:00.000Z",
      languages: [],
      goals: [],
      works: [],
      sessions: [],
      vocabulary: [],
      achievements: [],
      settings: []
    };

    await expect(importBackup(payload)).rejects.toThrow("暂不支持该备份版本。");
  });
});

describe("backup CSV export", () => {
  it("escapes commas, quotes, and newlines in session rows", () => {
    const csv = backupToCsvRows([
      makeSession({
        date: "2026-05-31",
        kind: "reading",
        languageId: "lang_ja",
        workTitle: "Manga, Vol. 1",
        minutes: 45,
        unitsCompleted: 2,
        note: "line 1\nsaid \"nice\""
      })
    ]);

    expect(csv).toBe(
      'date,kind,languageId,workTitle,minutes,unitsCompleted,note\n2026-05-31,reading,lang_ja,"Manga, Vol. 1",45,2,"line 1\nsaid ""nice"""'
    );
  });
});
