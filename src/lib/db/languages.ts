import type { TargetLanguage } from "@/types/domain";
import { createDefaultGoal } from "@/lib/data/defaults";
import { getDb } from "@/lib/db/database";
import { createId } from "@/lib/utils/id";

type LanguageInput = Pick<TargetLanguage, "code" | "name"> &
  Partial<Pick<TargetLanguage, "nativeName" | "accent" | "isCustom">>;

export interface LanguageUsageSummary {
  works: number;
  sessions: number;
  vocabulary: number;
  goals: number;
}

export type UpdateLanguageInput = Pick<TargetLanguage, "id"> &
  Partial<Pick<TargetLanguage, "code" | "name" | "nativeName" | "accent">>;

export async function listLanguages() {
  const languages = await getDb().languages.toArray();
  return languages
    .filter((language) => !language.deletedAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getLanguage(id?: string | null) {
  if (!id) return undefined;
  const language = await getDb().languages.get(id);
  return language?.deletedAt ? undefined : language;
}

export async function createLanguage(input: LanguageInput) {
  const db = getDb();
  const now = new Date().toISOString();
  const name = input.name.trim();
  const code = input.code.trim().toLowerCase();
  if (!name || !code) {
    throw new Error("语言名称不能为空。");
  }

  const language: TargetLanguage = {
    id: createId("lang"),
    code,
    name,
    nativeName: input.nativeName?.trim(),
    accent: input.accent ?? "#77e5cf",
    isCustom: input.isCustom ?? true,
    createdAt: now,
    updatedAt: now,
    syncState: "dirty"
  };
  await db.transaction("rw", [db.languages, db.goals], async () => {
    await db.languages.add(language);
    await db.goals.add({
      ...createDefaultGoal(language.id),
      createdAt: now,
      updatedAt: now,
      syncState: "dirty"
    });
  });
  return language;
}

export async function updateLanguage(input: UpdateLanguageInput) {
  const db = getDb();
  const existing = await db.languages.get(input.id);
  if (!existing || existing.deletedAt) {
    throw new Error("目标语言不存在。");
  }

  const name = input.name?.trim() ?? existing.name;
  const code = input.code?.trim().toLowerCase() ?? existing.code;
  if (!name || !code) {
    throw new Error("语言名称不能为空。");
  }

  const now = new Date().toISOString();
  const next: TargetLanguage = {
    ...existing,
    code,
    name,
    nativeName: input.nativeName?.trim() || undefined,
    accent: input.accent?.trim() || existing.accent,
    updatedAt: now,
    syncState: "dirty"
  };

  await db.languages.put(next);
  return next;
}

export async function getLanguageUsageSummary(id: string): Promise<LanguageUsageSummary> {
  const db = getDb();
  const [works, sessions, vocabulary, goals] = await Promise.all([
    db.works.where("languageId").equals(id).filter((work) => !work.deletedAt).count(),
    db.sessions.where("languageId").equals(id).filter((session) => !session.deletedAt).count(),
    db.vocabulary.where("languageId").equals(id).filter((item) => !item.deletedAt).count(),
    db.goals.where("languageId").equals(id).filter((goal) => !goal.deletedAt).count()
  ]);

  return { works, sessions, vocabulary, goals };
}

export async function deleteLanguage(id: string) {
  const db = getDb();
  const now = new Date().toISOString();

  await db.transaction("rw", [db.languages, db.goals, db.settings], async () => {
    const language = await db.languages.get(id);
    if (!language || language.deletedAt) {
      throw new Error("目标语言不存在。");
    }

    const activeLanguages = await db.languages.filter((item) => !item.deletedAt).toArray();
    if (activeLanguages.length <= 1) {
      throw new Error("至少保留一种目标语言。");
    }

    const nextDefaultLanguage = activeLanguages.find((item) => item.id !== id);
    await db.languages.put({
      ...language,
      deletedAt: now,
      updatedAt: now,
      syncState: "deleted"
    });

    const goals = await db.goals.where("languageId").equals(id).filter((goal) => !goal.deletedAt).toArray();
    await Promise.all(
      goals.map((goal) =>
        db.goals.put({
          ...goal,
          deletedAt: now,
          updatedAt: now,
          syncState: "deleted"
        })
      )
    );

    const settings = await db.settings.get("settings_local");
    if (settings?.defaultLanguageId === id) {
      await db.settings.put({
        ...settings,
        defaultLanguageId: nextDefaultLanguage?.id,
        updatedAt: now,
        syncState: "dirty"
      });
    }
  });
}
