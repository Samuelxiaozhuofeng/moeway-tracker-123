import type { ActivityTemplate, ImmersionKind } from "@/types/domain";
import { getDb } from "@/lib/db/database";
import { createId } from "@/lib/utils/id";

export interface ActivityInput {
  name: string;
  languageId?: string | null;
  kind: ImmersionKind;
  defaultMinutes: number;
  note?: string;
  sortOrder?: number;
  isArchived?: boolean;
}

function normalizeActivity(input: ActivityInput, existing?: ActivityTemplate): ActivityTemplate {
  const name = input.name.trim();
  if (!name) throw new Error("请输入活动名称。");
  const defaultMinutes = Math.max(1, Math.round(input.defaultMinutes));
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? createId("activity"),
    name,
    languageId: input.languageId ?? null,
    kind: input.kind,
    defaultMinutes,
    note: input.note?.trim(),
    sortOrder: input.sortOrder ?? existing?.sortOrder ?? 0,
    isArchived: input.isArchived ?? existing?.isArchived ?? false,
    lastUsedAt: existing?.lastUsedAt,
    userId: existing?.userId ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    syncState: "dirty"
  };
}

export async function listActivities(filters?: { includeArchived?: boolean; languageId?: string; kind?: ImmersionKind }) {
  const activities = await getDb().activities.toArray();
  return activities
    .filter((activity) => !activity.deletedAt)
    .filter((activity) => filters?.includeArchived || !activity.isArchived)
    .filter((activity) => !filters?.languageId || !activity.languageId || activity.languageId === filters.languageId)
    .filter((activity) => !filters?.kind || activity.kind === filters.kind)
    .sort((a, b) => a.sortOrder - b.sortOrder || (b.lastUsedAt ?? b.updatedAt).localeCompare(a.lastUsedAt ?? a.updatedAt));
}

export async function getActivity(id?: string | null) {
  if (!id) return undefined;
  const activity = await getDb().activities.get(id);
  return activity?.deletedAt ? undefined : activity;
}

export async function createActivity(input: ActivityInput) {
  const activity = normalizeActivity(input);
  await getDb().activities.add(activity);
  return activity;
}

export async function updateActivity(id: string, input: Partial<ActivityInput>) {
  const existing = await getActivity(id);
  if (!existing) throw new Error("活动不存在或已删除。");
  const next = normalizeActivity(
    {
      name: input.name ?? existing.name,
      languageId: "languageId" in input ? input.languageId : existing.languageId,
      kind: input.kind ?? existing.kind,
      defaultMinutes: input.defaultMinutes ?? existing.defaultMinutes,
      note: "note" in input ? input.note : existing.note,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      isArchived: input.isArchived ?? existing.isArchived
    },
    existing
  );
  await getDb().activities.put(next);
  return next;
}

export async function markActivityUsed(id: string, usedAt = new Date().toISOString()) {
  const activity = await getActivity(id);
  if (!activity) return;
  await getDb().activities.put({
    ...activity,
    lastUsedAt: usedAt,
    updatedAt: new Date().toISOString(),
    syncState: "dirty"
  });
}

export async function deleteActivity(id: string) {
  const activity = await getActivity(id);
  if (!activity) return;
  await getDb().activities.put({
    ...activity,
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncState: "deleted"
  });
}
