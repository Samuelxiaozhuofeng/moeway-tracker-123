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
      weeklyListeningMinutes: 630,
      weeklyReadingMinutes: 315
    });

    await expect(listGoals()).resolves.toMatchObject([
      {
        id: "goal_ja",
        languageId: "lang_ja",
        dailyListeningMinutes: 90,
        dailyReadingMinutes: 45,
        weeklyListeningMinutes: 630,
        weeklyReadingMinutes: 315
      }
    ]);
  });

  it("rejects invalid goal minutes", async () => {
    await expect(upsertGoal({ languageId: "lang_ja", dailyListeningMinutes: -1 })).rejects.toThrow("每日听力目标不能小于 0。");
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
