import type { VocabularyItem } from "@/types/domain";
import { getDb } from "@/lib/db/database";
import { createId } from "@/lib/utils/id";

export interface VocabularyInput {
  sessionId?: string | null;
  languageId: string;
  phrase: string;
  reading?: string;
  meaning?: string;
  context?: string;
  sourceTitle?: string;
}

export async function listVocabulary(languageId?: string) {
  const items = await getDb().vocabulary.toArray();
  return items
    .filter((item) => !item.deletedAt)
    .filter((item) => !languageId || item.languageId === languageId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createVocabulary(input: VocabularyInput) {
  const now = new Date().toISOString();
  const item: VocabularyItem = {
    id: createId("vocab"),
    sessionId: input.sessionId ?? null,
    languageId: input.languageId,
    phrase: input.phrase.trim(),
    reading: input.reading?.trim(),
    meaning: input.meaning?.trim(),
    context: input.context?.trim(),
    sourceTitle: input.sourceTitle?.trim(),
    userId: null,
    createdAt: now,
    updatedAt: now,
    syncState: "dirty"
  };
  await getDb().vocabulary.add(item);
  return item;
}

export async function createVocabularyFromPhrases(params: {
  sessionId: string;
  languageId: string;
  sourceTitle?: string;
  phrases: string[];
}) {
  const phrases = params.phrases.map((phrase) => phrase.trim()).filter(Boolean);
  if (phrases.length === 0) return [];
  return Promise.all(
    phrases.map((phrase) =>
      createVocabulary({
        sessionId: params.sessionId,
        languageId: params.languageId,
        sourceTitle: params.sourceTitle,
        phrase
      })
    )
  );
}

export async function markVocabularyReviewed(id: string) {
  const db = getDb();
  const current = await db.vocabulary.get(id);
  if (!current || current.deletedAt) return;
  await db.vocabulary.put({
    ...current,
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncState: "dirty"
  });
}
