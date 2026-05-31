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
  const goals = await getDb().goals.toArray();
  return goals.filter((goal) => !goal.deletedAt);
}

export async function getPrimaryGoal(languageId?: string | null) {
  const goals = await listGoals();
  return goals.find((goal) => goal.languageId === languageId) ?? goals[0] ?? createDefaultGoal(languageId);
}

export async function upsertGoal(input: Partial<GoalSettings> & { languageId?: string | null }) {
  const db = getDb();
  const existing = input.id
    ? await db.goals.get(input.id)
    : input.languageId
      ? await db.goals.where("languageId").equals(input.languageId).filter((goal) => !goal.deletedAt).first()
      : undefined;
  const now = new Date().toISOString();
  const goal: GoalSettings = {
    id: existing?.id ?? createId("goal"),
    languageId: "languageId" in input ? input.languageId ?? null : existing?.languageId ?? null,
    dailyListeningMinutes: resolveGoalMinutes(input.dailyListeningMinutes, existing?.dailyListeningMinutes ?? 60, "每日听力目标"),
    dailyReadingMinutes: resolveGoalMinutes(input.dailyReadingMinutes, existing?.dailyReadingMinutes ?? 30, "每日阅读目标"),
    weeklyListeningMinutes: resolveGoalMinutes(input.weeklyListeningMinutes, existing?.weeklyListeningMinutes ?? 420, "每周听力目标"),
    weeklyReadingMinutes: resolveGoalMinutes(input.weeklyReadingMinutes, existing?.weeklyReadingMinutes ?? 210, "每周阅读目标"),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    syncState: "dirty"
  };
  await db.goals.put(goal);
  return goal;
}

function resolveGoalMinutes(value: number | undefined, fallback: number, label: string) {
  const resolved = value ?? fallback;
  if (!Number.isFinite(resolved) || resolved < 0) {
    throw new Error(`${label}不能小于 0。`);
  }
  return Math.round(resolved);
}
