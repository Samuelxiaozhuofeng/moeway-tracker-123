import type { ImmersionSession, LibraryWork, TargetLanguage } from "@/types/domain";

const baseTime = "2026-05-31T08:00:00.000Z";

export function makeLanguage(overrides: Partial<TargetLanguage> = {}): TargetLanguage {
  return {
    id: "lang_ja",
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    accent: "#ef4444",
    isCustom: false,
    userId: null,
    createdAt: baseTime,
    updatedAt: baseTime,
    syncState: "dirty",
    ...overrides
  };
}

export function makeWork(overrides: Partial<LibraryWork> = {}): LibraryWork {
  return {
    id: "work_1",
    title: "Frieren",
    languageId: "lang_ja",
    kind: "listening",
    format: "anime",
    status: "active",
    completedUnits: 0,
    averageCleanMinutes: 24,
    progressMode: "episodes",
    userId: null,
    createdAt: baseTime,
    updatedAt: baseTime,
    syncState: "dirty",
    ...overrides
  };
}

export function makeSession(overrides: Partial<ImmersionSession> = {}): ImmersionSession {
  return {
    id: "session_1",
    date: "2026-05-31",
    languageId: "lang_ja",
    kind: "listening",
    workId: "work_1",
    workTitle: "Frieren",
    minutes: 24,
    unitsCompleted: 1,
    progressMode: "episodes",
    phrases: [],
    isHistoricalImport: false,
    userId: null,
    createdAt: baseTime,
    updatedAt: baseTime,
    syncState: "dirty",
    ...overrides
  };
}
