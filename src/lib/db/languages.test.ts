import { describe, expect, it } from "vitest";
import { createLanguage, deleteLanguage, getLanguageUsageSummary, listLanguages, updateLanguage } from "@/lib/db/languages";
import { listGoals } from "@/lib/db/settings";
import { getDb } from "@/lib/db/database";
import { makeLanguage, makeSession, makeWork } from "@/test/factories";
import type { GoalSettings, UserSettings, VocabularyItem } from "@/types/domain";

const baseTime = "2026-05-31T08:00:00.000Z";

describe("language settings", () => {
  it("creates a default goal when adding a language", async () => {
    const language = await createLanguage({ name: "韩语", code: "ko", accent: "#88ccff" });

    await expect(listLanguages()).resolves.toEqual([language]);
    await expect(listGoals()).resolves.toMatchObject([
      {
        languageId: language.id,
        dailyListeningMinutes: 60,
        dailyReadingMinutes: 30,
        syncState: "dirty"
      }
    ]);
  });

  it("soft deletes a language and its goals without deleting historical content", async () => {
    const db = getDb();
    await db.languages.bulkAdd([
      makeLanguage({ id: "lang_ja", name: "日语" }),
      makeLanguage({ id: "lang_es", name: "西班牙语" })
    ]);
    await db.goals.add(makeGoal({ id: "goal_ja", languageId: "lang_ja" }));
    await db.works.add(makeWork({ id: "work_ja", languageId: "lang_ja" }));
    await db.sessions.add(makeSession({ id: "session_ja", languageId: "lang_ja" }));
    await db.vocabulary.add(makeVocabulary({ id: "vocab_ja", languageId: "lang_ja" }));
    await db.settings.add(makeSettings({ defaultLanguageId: "lang_ja" }));

    await expect(getLanguageUsageSummary("lang_ja")).resolves.toEqual({
      works: 1,
      sessions: 1,
      vocabulary: 1,
      goals: 1
    });

    await deleteLanguage("lang_ja");

    await expect(listLanguages()).resolves.toEqual([expect.objectContaining({ id: "lang_es" })]);
    await expect(listGoals()).resolves.toEqual([]);
    await expect(db.languages.get("lang_ja")).resolves.toMatchObject({
      deletedAt: expect.any(String),
      syncState: "deleted"
    });
    await expect(db.goals.get("goal_ja")).resolves.toMatchObject({
      deletedAt: expect.any(String),
      syncState: "deleted"
    });
    await expect(db.works.get("work_ja")).resolves.toBeDefined();
    await expect(db.sessions.get("session_ja")).resolves.toBeDefined();
    await expect(db.vocabulary.get("vocab_ja")).resolves.toBeDefined();
    await expect(db.settings.get("settings_local")).resolves.toMatchObject({
      defaultLanguageId: "lang_es",
      syncState: "dirty"
    });
  });

  it("updates an existing language", async () => {
    const db = getDb();
    await db.languages.add(makeLanguage({ id: "lang_ja", name: "日语", code: "ja", nativeName: "日本語" }));

    await updateLanguage({
      id: "lang_ja",
      name: "Japanese",
      code: "jp",
      nativeName: "日本語 / Japanese",
      accent: "#00ffaa"
    });

    await expect(db.languages.get("lang_ja")).resolves.toMatchObject({
      name: "Japanese",
      code: "jp",
      nativeName: "日本語 / Japanese",
      accent: "#00ffaa",
      syncState: "dirty"
    });
  });

  it("keeps at least one target language", async () => {
    await getDb().languages.add(makeLanguage({ id: "lang_ja" }));

    await expect(deleteLanguage("lang_ja")).rejects.toThrow("至少保留一种目标语言。");
  });
});

function makeGoal(overrides: Partial<GoalSettings> = {}): GoalSettings {
  return {
    id: "goal_1",
    languageId: "lang_ja",
    dailyListeningMinutes: 60,
    dailyReadingMinutes: 30,
    weeklyListeningMinutes: 420,
    weeklyReadingMinutes: 210,
    createdAt: baseTime,
    updatedAt: baseTime,
    syncState: "dirty",
    ...overrides
  };
}

function makeVocabulary(overrides: Partial<VocabularyItem> = {}): VocabularyItem {
  return {
    id: "vocab_1",
    languageId: "lang_ja",
    phrase: "ことば",
    createdAt: baseTime,
    updatedAt: baseTime,
    syncState: "dirty",
    ...overrides
  };
}

function makeSettings(overrides: Partial<UserSettings> = {}): UserSettings {
  return {
    id: "settings_local",
    timezone: "Asia/Shanghai",
    notificationsEnabled: false,
    keepAwakeHintDismissed: false,
    onboardingCompleted: false,
    createdAt: baseTime,
    updatedAt: baseTime,
    syncState: "dirty",
    ...overrides
  };
}
