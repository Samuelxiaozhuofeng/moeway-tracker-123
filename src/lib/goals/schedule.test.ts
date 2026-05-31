import { describe, expect, it } from "vitest";
import {
  deriveWeeklyGoalMinutes,
  getGoalOccurrencesPerWeek,
  isGoalScheduledOnDate,
  normalizeGoalIntervalDays,
  scheduledGoalMinutesForDate
} from "@/lib/goals/schedule";

describe("goal schedule helpers", () => {
  it("derives weekly minutes from daily minutes and interval", () => {
    expect(deriveWeeklyGoalMinutes(10, 1)).toBe(70);
    expect(deriveWeeklyGoalMinutes(10, 2)).toBe(40);
    expect(deriveWeeklyGoalMinutes(10, 3)).toBe(30);
    expect(deriveWeeklyGoalMinutes(10, 7)).toBe(10);
  });

  it("rounds up weekly occurrences for intervals that do not divide a week", () => {
    expect(getGoalOccurrencesPerWeek(4)).toBe(2);
    expect(getGoalOccurrencesPerWeek(5)).toBe(2);
    expect(getGoalOccurrencesPerWeek(6)).toBe(2);
  });

  it("keeps every-other-day goals on days 1, 3, 5, and 7 of the week", () => {
    expect(isGoalScheduledOnDate(2, "2026-06-01")).toBe(true);
    expect(isGoalScheduledOnDate(2, "2026-06-02")).toBe(false);
    expect(isGoalScheduledOnDate(2, "2026-06-03")).toBe(true);
    expect(isGoalScheduledOnDate(2, "2026-06-07")).toBe(true);
  });

  it("returns zero target minutes on unscheduled days", () => {
    expect(scheduledGoalMinutesForDate(10, 2, "2026-06-02")).toBe(0);
    expect(scheduledGoalMinutesForDate(10, 2, "2026-06-03")).toBe(10);
  });

  it("rejects invalid intervals", () => {
    expect(() => normalizeGoalIntervalDays(0)).toThrow("目标频率必须是 1 到 7 天之间的整数。");
    expect(() => normalizeGoalIntervalDays(8)).toThrow("目标频率必须是 1 到 7 天之间的整数。");
    expect(() => normalizeGoalIntervalDays(1.5)).toThrow("目标频率必须是 1 到 7 天之间的整数。");
  });
});
