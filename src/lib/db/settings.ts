import type { GoalSettings, UserSettings } from "@/types/domain";
import { createDefaultGoal, createDefaultSettings } from "@/lib/data/defaults";
import { getDb } from "@/lib/db/database";
import { createId } from "@/lib/utils/id";

export async function getSettings() {
  const db = getDb();
  const settings = await db.settings.get("settings_local");
  if (settings) return settings;
  const created = createDefaultSettings();
  await db.settings.put(created);
  return created;
}

export async function updateSettings(patch: Partial<UserSettings>) {
  const current = await getSettings();
  const next: UserSettings = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
    syncState: "dirty"
  };
  await getDb().settings.put(next);
  return next;
}

export async function listGoals() {
  return getDb().goals.where("syncState").notEqual("deleted").toArray();
}

export async function getPrimaryGoal(languageId?: string | null) {
  const goals = await listGoals();
  return goals.find((goal) => goal.languageId === languageId) ?? goals[0] ?? createDefaultGoal(languageId);
}

export async function upsertGoal(input: Partial<GoalSettings> & { languageId?: string | null }) {
  const db = getDb();
  const existing = input.id ? await db.goals.get(input.id) : undefined;
  const now = new Date().toISOString();
  const goal: GoalSettings = {
    id: existing?.id ?? createId("goal"),
    languageId: input.languageId ?? existing?.languageId ?? null,
    dailyListeningMinutes: input.dailyListeningMinutes ?? existing?.dailyListeningMinutes ?? 60,
    dailyReadingMinutes: input.dailyReadingMinutes ?? existing?.dailyReadingMinutes ?? 30,
    weeklyListeningMinutes: input.weeklyListeningMinutes ?? existing?.weeklyListeningMinutes ?? 420,
    weeklyReadingMinutes: input.weeklyReadingMinutes ?? existing?.weeklyReadingMinutes ?? 210,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    syncState: "dirty"
  };
  await db.goals.put(goal);
  return goal;
}
