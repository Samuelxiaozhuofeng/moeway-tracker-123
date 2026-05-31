import { describe, expect, it } from "vitest";
import { getDb } from "@/lib/db/database";
import { listGoals, upsertGoal } from "@/lib/db/settings";
import type { GoalSettings } from "@/types/domain";

const baseTime = "2026-05-31T08:00:00.000Z";

describe("goal settings", () => {
  it("updates the existing goal for a language when id is omitted", async () => {
    await getDb().goals.add(makeGoal({ id: "goal_ja", languageId: "lang_ja" }));

    await upsertGoal({
      languageId: "lang_ja",
      dailyListeningMinutes: 90,
      dailyReadingMinutes: 45,
      listeningGoalIntervalDays: 2,
      readingGoalIntervalDays: 3
    });

    await expect(listGoals()).resolves.toMatchObject([
      {
        id: "goal_ja",
        languageId: "lang_ja",
        dailyListeningMinutes: 90,
        dailyReadingMinutes: 45,
        listeningGoalIntervalDays: 2,
        readingGoalIntervalDays: 3,
        weeklyListeningMinutes: 360,
        weeklyReadingMinutes: 135
      }
    ]);
  });

  it("defaults old goals without interval fields to daily cadence", async () => {
    await getDb().goals.add(makeGoal({ id: "goal_ja", languageId: "lang_ja" }));

    await upsertGoal({
      languageId: "lang_ja",
      dailyReadingMinutes: 10
    });

    await expect(listGoals()).resolves.toMatchObject([
      {
        id: "goal_ja",
        readingGoalIntervalDays: 1,
        weeklyReadingMinutes: 70
      }
    ]);
  });

  it("rejects invalid goal minutes", async () => {
    await expect(upsertGoal({ languageId: "lang_ja", dailyListeningMinutes: -1 })).rejects.toThrow("每日听力目标不能小于 0。");
  });

  it("rejects invalid goal intervals", async () => {
    await expect(upsertGoal({ languageId: "lang_ja", readingGoalIntervalDays: 8 })).rejects.toThrow("阅读目标频率必须是 1 到 7 天之间的整数。");
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
