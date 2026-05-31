import { describe, expect, it } from "vitest";
import { getDb } from "@/lib/db/database";
import { getLanguage, listLanguages } from "@/lib/db/languages";
import { listCompletedUnitNumbers } from "@/lib/db/work-progress";
import { getSession, listSessions } from "@/lib/db/sessions";
import { listGoals } from "@/lib/db/settings";
import { markVocabularyReviewed, listVocabulary } from "@/lib/db/vocabulary";
import { getWork, listWorks } from "@/lib/db/works";
import { makeLanguage, makeSession, makeWork } from "@/test/factories";
import type { GoalSettings, VocabularyItem } from "@/types/domain";

const deletedAt = "2026-05-31T09:00:00.000Z";

describe("deleted entity filters", () => {
  it("hides remote tombstones for list and get operations", async () => {
    const db = getDb();
    await db.languages.bulkAdd([
      makeLanguage({ id: "lang_active" }),
      makeLanguage({ id: "lang_deleted", deletedAt, syncState: "synced" })
    ]);
    await db.works.bulkAdd([
      makeWork({ id: "work_active", languageId: "lang_active" }),
      makeWork({ id: "work_deleted", languageId: "lang_active", deletedAt, syncState: "synced" })
    ]);
    await db.sessions.bulkAdd([
      makeSession({ id: "session_active", workId: "work_active", unitNumbers: [1] }),
      makeSession({ id: "session_deleted", workId: "work_active", unitNumbers: [2], deletedAt, syncState: "synced" })
    ]);

    await expect(listLanguages()).resolves.toHaveLength(1);
    await expect(getLanguage("lang_deleted")).resolves.toBeUndefined();
    await expect(listWorks()).resolves.toHaveLength(1);
    await expect(getWork("work_deleted")).resolves.toBeUndefined();
    await expect(listSessions()).resolves.toHaveLength(1);
    await expect(getSession("session_deleted")).resolves.toBeUndefined();
    await expect(listCompletedUnitNumbers("work_active")).resolves.toEqual([1]);
  });

  it("hides deleted goals and vocabulary without mutating tombstones", async () => {
    const db = getDb();
    const activeGoal: GoalSettings = {
      id: "goal_active",
      languageId: "lang_ja",
      dailyListeningMinutes: 60,
      dailyReadingMinutes: 30,
      weeklyListeningMinutes: 420,
      weeklyReadingMinutes: 210,
      createdAt: "2026-05-31T08:00:00.000Z",
      updatedAt: "2026-05-31T08:00:00.000Z",
      syncState: "synced"
    };
    const deletedGoal: GoalSettings = { ...activeGoal, id: "goal_deleted", deletedAt };
    const activeVocab: VocabularyItem = {
      id: "vocab_active",
      languageId: "lang_ja",
      phrase: "ことば",
      userId: null,
      createdAt: "2026-05-31T08:00:00.000Z",
      updatedAt: "2026-05-31T08:00:00.000Z",
      syncState: "synced"
    };
    const deletedVocab: VocabularyItem = { ...activeVocab, id: "vocab_deleted", phrase: "隠す", deletedAt };

    await db.goals.bulkAdd([activeGoal, deletedGoal]);
    await db.vocabulary.bulkAdd([activeVocab, deletedVocab]);
    await markVocabularyReviewed("vocab_deleted");

    await expect(listGoals()).resolves.toEqual([activeGoal]);
    await expect(listVocabulary("lang_ja")).resolves.toEqual([activeVocab]);
    await expect(db.vocabulary.get("vocab_deleted")).resolves.not.toHaveProperty("reviewedAt");
  });
});
