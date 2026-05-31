import { createDefaultGoal, createDefaultLanguages, createDefaultSettings } from "@/lib/data/defaults";
import { getDb } from "@/lib/db/database";

export async function ensureLocalSeed() {
  const db = getDb();
  const [languageCount, settingsCount] = await Promise.all([
    db.languages.count(),
    db.settings.count()
  ]);

  if (languageCount === 0) {
    const languages = createDefaultLanguages();
    await db.languages.bulkAdd(languages);
    await db.goals.add(createDefaultGoal(languages[0]?.id));
  }

  if (settingsCount === 0) {
    await db.settings.add(createDefaultSettings());
  }
}
