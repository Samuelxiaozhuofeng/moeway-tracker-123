import { describe, expect, it } from "vitest";
import { buildLanguageDailyGoals } from "@/lib/stats/language-goals";
import { makeLanguage, makeSession } from "@/test/factories";
import type { GoalSettings } from "@/types/domain";

const baseTime = "2026-05-31T08:00:00.000Z";

describe("buildLanguageDailyGoals", () => {
  it("uses the matching language goal for today's progress", () => {
    const rows = buildLanguageDailyGoals(
      [
        makeSession({ id: "session_ja_listening", languageId: "lang_ja", kind: "listening", minutes: 45, date: "2026-05-31" }),
        makeSession({ id: "session_ja_reading", languageId: "lang_ja", kind: "reading", minutes: 20, date: "2026-05-31" }),
        makeSession({ id: "session_es_old", languageId: "lang_es", kind: "listening", minutes: 90, date: "2026-05-30" })
      ],
      [
        makeLanguage({ id: "lang_ja", name: "日语" }),
        makeLanguage({ id: "lang_es", name: "西班牙语" })
      ],
      [
        makeGoal({ id: "goal_ja", languageId: "lang_ja", dailyListeningMinutes: 120, dailyReadingMinutes: 40 }),
        makeGoal({ id: "goal_es", languageId: "lang_es", dailyListeningMinutes: 30, dailyReadingMinutes: 15 })
      ],
      "2026-05-31"
    );

    expect(rows).toMatchObject([
      {
        language: { id: "lang_ja" },
        goal: { dailyListeningMinutes: 120, dailyReadingMinutes: 40 },
        listeningMinutes: 45,
        readingMinutes: 20,
        listeningGoalMinutes: 120,
        readingGoalMinutes: 40,
        isListeningScheduledToday: true,
        isReadingScheduledToday: true
      },
      {
        language: { id: "lang_es" },
        goal: { dailyListeningMinutes: 30, dailyReadingMinutes: 15 },
        listeningMinutes: 0,
        readingMinutes: 0,
        listeningGoalMinutes: 30,
        readingGoalMinutes: 15,
        isListeningScheduledToday: true,
        isReadingScheduledToday: true
      }
    ]);
  });

  it("returns zero daily target on unscheduled interval days", () => {
    const rows = buildLanguageDailyGoals(
      [],
      [makeLanguage({ id: "lang_ja", name: "日语" })],
      [makeGoal({ id: "goal_ja", languageId: "lang_ja", dailyReadingMinutes: 10, readingGoalIntervalDays: 2, weeklyReadingMinutes: 40 })],
      "2026-06-02"
    );

    expect(rows).toMatchObject([
      {
        readingGoalMinutes: 0,
        isReadingScheduledToday: false
      }
    ]);
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
