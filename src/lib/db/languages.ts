import type { TargetLanguage } from "@/types/domain";
import { getDb } from "@/lib/db/database";
import { createId } from "@/lib/utils/id";

type LanguageInput = Pick<TargetLanguage, "code" | "name"> &
  Partial<Pick<TargetLanguage, "nativeName" | "accent" | "isCustom">>;

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
  const now = new Date().toISOString();
  const language: TargetLanguage = {
    id: createId("lang"),
    code: input.code.trim().toLowerCase(),
    name: input.name.trim(),
    nativeName: input.nativeName?.trim(),
    accent: input.accent ?? "#77e5cf",
    isCustom: input.isCustom ?? true,
    createdAt: now,
    updatedAt: now,
    syncState: "dirty"
  };
  await getDb().languages.add(language);
  return language;
}
