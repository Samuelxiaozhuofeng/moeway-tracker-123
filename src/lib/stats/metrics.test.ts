import { describe, expect, it, vi } from "vitest";
import { summarizeDashboard } from "@/lib/stats/metrics";
import { makeSession } from "@/test/factories";

describe("dashboard streak metrics", () => {
  it("keeps the current streak when yesterday was active and today has no sessions yet", () => {
    vi.setSystemTime(new Date("2026-05-31T10:00:00.000Z"));

    const summary = summarizeDashboard([
      makeSession({ id: "session_1", date: "2026-05-29", minutes: 25 }),
      makeSession({ id: "session_2", date: "2026-05-30", minutes: 25 })
    ]);

    expect(summary.currentStreak).toBe(2);
  });

  it("returns zero when neither today nor yesterday was active", () => {
    vi.setSystemTime(new Date("2026-05-31T10:00:00.000Z"));

    const summary = summarizeDashboard([
      makeSession({ id: "session_1", date: "2026-05-29", minutes: 25 })
    ]);

    expect(summary.currentStreak).toBe(0);
  });
});
