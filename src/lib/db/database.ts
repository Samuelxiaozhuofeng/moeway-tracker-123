import Dexie, { type Table } from "dexie";
import type {
  ActivityTemplate,
  Achievement,
  GoalSettings,
  ImmersionSession,
  LibraryWork,
  TargetLanguage,
  UserSettings,
  VocabularyItem
} from "@/types/domain";

export class ImmerseLogDatabase extends Dexie {
  activities!: Table<ActivityTemplate, string>;
  languages!: Table<TargetLanguage, string>;
  goals!: Table<GoalSettings, string>;
  works!: Table<LibraryWork, string>;
  sessions!: Table<ImmersionSession, string>;
  vocabulary!: Table<VocabularyItem, string>;
  achievements!: Table<Achievement, string>;
  settings!: Table<UserSettings, string>;

  constructor() {
    super("immerselog");
    this.version(1).stores({
      languages: "id, code, updatedAt, syncState",
      goals: "id, languageId, updatedAt, syncState",
      works: "id, languageId, kind, status, title, lastRecordedAt, updatedAt, syncState",
      sessions: "id, date, languageId, kind, workId, updatedAt, syncState",
      vocabulary: "id, languageId, sessionId, phrase, reviewedAt, updatedAt, syncState",
      achievements: "id, key, unlockedAt, updatedAt, syncState",
      settings: "id, updatedAt, syncState"
    });
    this.version(2).stores({
      languages: "id, code, updatedAt, syncState",
      goals: "id, languageId, updatedAt, syncState",
      works: "id, languageId, kind, status, title, progressMode, lastRecordedAt, updatedAt, syncState",
      sessions: "id, date, languageId, kind, workId, progressMode, unitStart, unitEnd, updatedAt, syncState",
      vocabulary: "id, languageId, sessionId, phrase, reviewedAt, updatedAt, syncState",
      achievements: "id, key, unlockedAt, updatedAt, syncState",
      settings: "id, updatedAt, syncState"
    });
    this.version(3).stores({
      activities: "id, languageId, kind, isArchived, sortOrder, lastUsedAt, updatedAt, syncState",
      languages: "id, code, updatedAt, syncState",
      goals: "id, languageId, updatedAt, syncState",
      works: "id, languageId, kind, status, title, progressMode, lastRecordedAt, updatedAt, syncState",
      sessions: "id, date, languageId, kind, workId, activityId, progressMode, unitStart, unitEnd, updatedAt, syncState",
      vocabulary: "id, languageId, sessionId, phrase, reviewedAt, updatedAt, syncState",
      achievements: "id, key, unlockedAt, updatedAt, syncState",
      settings: "id, updatedAt, syncState"
    });
  }
}

let db: ImmerseLogDatabase | undefined;

export function getDb() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser.");
  }

  db ??= new ImmerseLogDatabase();
  return db;
}
