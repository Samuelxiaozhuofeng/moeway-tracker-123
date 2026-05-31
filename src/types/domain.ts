export type ImmersionKind = "listening" | "reading";

export type WorkStatus = "planned" | "active" | "completed" | "dropped";

export type WorkProgressMode = "episodes" | "chapters" | "pages";

export type SessionEntrySource = "manual" | "timer" | "historical-import" | "work-detail-toggle";

export type WorkFormat =
  | "anime"
  | "podcast"
  | "youtube"
  | "manga"
  | "light_novel"
  | "web_novel"
  | "book"
  | "other";

export type SyncState = "local" | "dirty" | "synced" | "deleted";

export type TimeRange = "7d" | "30d" | "90d" | "1y" | "all";

export interface SyncableEntity {
  id: string;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  syncState: SyncState;
}

export interface TargetLanguage extends SyncableEntity {
  code: string;
  name: string;
  nativeName?: string;
  accent: string;
  isCustom: boolean;
}

export interface GoalSettings extends SyncableEntity {
  languageId?: string | null;
  dailyListeningMinutes: number;
  dailyReadingMinutes: number;
  listeningGoalIntervalDays?: number;
  readingGoalIntervalDays?: number;
  weeklyListeningMinutes: number;
  weeklyReadingMinutes: number;
}

export interface LibraryWork extends SyncableEntity {
  title: string;
  originalTitle?: string;
  languageId: string;
  kind: ImmersionKind;
  format: WorkFormat;
  status: WorkStatus;
  coverUrl?: string;
  totalUnits?: number;
  completedUnits: number;
  averageCleanMinutes: number;
  progressMode?: WorkProgressMode;
  seasonCount?: number;
  seasonLabel?: string;
  description?: string;
  notes?: string;
  externalSource?: "jikan" | "anilist" | "manual";
  externalId?: string;
  lastRecordedAt?: string;
}

export interface ImmersionSession extends SyncableEntity {
  date: string;
  startedAt?: string;
  endedAt?: string;
  languageId: string;
  kind: ImmersionKind;
  workId?: string | null;
  workTitle?: string;
  minutes: number;
  unitsCompleted: number;
  progressMode?: WorkProgressMode;
  unitStart?: number;
  unitEnd?: number;
  unitNumbers?: number[];
  entrySource?: SessionEntrySource;
  note?: string;
  phrases: string[];
  isHistoricalImport: boolean;
}

export interface VocabularyItem extends SyncableEntity {
  sessionId?: string | null;
  languageId: string;
  phrase: string;
  reading?: string;
  meaning?: string;
  context?: string;
  sourceTitle?: string;
  reviewedAt?: string;
}

export interface Achievement extends SyncableEntity {
  key: string;
  unlockedAt: string;
  title: string;
  description: string;
}

export interface UserSettings extends SyncableEntity {
  displayName?: string;
  timezone: string;
  defaultLanguageId?: string;
  notificationsEnabled: boolean;
  keepAwakeHintDismissed: boolean;
  onboardingCompleted: boolean;
}

export interface WorkSearchResult {
  source: "jikan" | "anilist";
  externalId: string;
  title: string;
  originalTitle?: string;
  coverUrl?: string;
  format: WorkFormat;
  kind: ImmersionKind;
  totalUnits?: number;
  averageMinutes?: number;
  description?: string;
}

export interface DashboardSummary {
  todayListeningMinutes: number;
  todayReadingMinutes: number;
  totalListeningMinutes: number;
  totalReadingMinutes: number;
  currentStreak: number;
  longestStreak: number;
}

export const kindLabels: Record<ImmersionKind, string> = {
  listening: "听力",
  reading: "阅读"
};

export const workStatusLabels: Record<WorkStatus, string> = {
  planned: "想看",
  active: "在看",
  completed: "已完",
  dropped: "弃坑"
};

export const workFormatLabels: Record<WorkFormat, string> = {
  anime: "Anime",
  podcast: "Podcast",
  youtube: "YouTube",
  manga: "Manga",
  light_novel: "轻小说",
  web_novel: "Web Novel",
  book: "书籍",
  other: "其他"
};
