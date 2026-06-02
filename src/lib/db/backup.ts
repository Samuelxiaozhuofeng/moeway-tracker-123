import { getDb } from "@/lib/db/database";
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

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  activities?: ActivityTemplate[];
  languages: TargetLanguage[];
  goals: GoalSettings[];
  works: LibraryWork[];
  sessions: ImmersionSession[];
  vocabulary: VocabularyItem[];
  achievements: Achievement[];
  settings: UserSettings[];
}

export async function exportBackup(): Promise<BackupPayload> {
  const db = getDb();
  const [activities, languages, goals, works, sessions, vocabulary, achievements, settings] = await Promise.all([
    db.activities.toArray(),
    db.languages.toArray(),
    db.goals.toArray(),
    db.works.toArray(),
    db.sessions.toArray(),
    db.vocabulary.toArray(),
    db.achievements.toArray(),
    db.settings.toArray()
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    activities,
    languages,
    goals,
    works,
    sessions,
    vocabulary,
    achievements,
    settings
  };
}

export async function importBackup(payload: BackupPayload) {
  if (payload.version !== 1) throw new Error("暂不支持该备份版本。");
  const db = getDb();
  await db.transaction(
    "rw",
    [db.activities, db.languages, db.goals, db.works, db.sessions, db.vocabulary, db.achievements, db.settings],
    async () => {
      await Promise.all([
        db.activities.clear(),
        db.languages.clear(),
        db.goals.clear(),
        db.works.clear(),
        db.sessions.clear(),
        db.vocabulary.clear(),
        db.achievements.clear(),
        db.settings.clear()
      ]);
      await Promise.all([
        db.activities.bulkPut(payload.activities ?? []),
        db.languages.bulkPut(payload.languages),
        db.goals.bulkPut(payload.goals),
        db.works.bulkPut(payload.works),
        db.sessions.bulkPut(payload.sessions),
        db.vocabulary.bulkPut(payload.vocabulary),
        db.achievements.bulkPut(payload.achievements),
        db.settings.bulkPut(payload.settings)
      ]);
    }
  );
}

export function backupToCsvRows(sessions: ImmersionSession[]) {
  const header = ["date", "kind", "languageId", "workTitle", "minutes", "unitsCompleted", "note"];
  const rows = sessions.map((session) => [
    session.date,
    session.kind,
    session.languageId,
    session.workTitle ?? "",
    String(session.minutes),
    String(session.unitsCompleted),
    session.note ?? ""
  ]);
  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

export function vocabularyToAnkiCsv(items: Array<{ phrase: string; reading?: string; meaning?: string; context?: string }>) {
  return items
    .map((item) => [item.phrase, item.reading ?? "", item.meaning ?? "", item.context ?? ""].map(escapeCsvCell).join(","))
    .join("\n");
}

function escapeCsvCell(value: string) {
  const escaped = value.replaceAll("\"", "\"\"");
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}
