import type { ImmersionKind, LibraryWork, WorkFormat, WorkProgressMode, WorkStatus } from "@/types/domain";
import { getDb } from "@/lib/db/database";
import { buildUnitRange, compactUnitNumbers, defaultProgressModeForKind } from "@/lib/progress/units";
import { createId } from "@/lib/utils/id";
import { formatIsoDate } from "@/lib/utils/format";

export interface WorkInput {
  title: string;
  originalTitle?: string;
  languageId: string;
  kind: ImmersionKind;
  format: WorkFormat;
  status?: WorkStatus;
  coverUrl?: string;
  totalUnits?: number;
  completedUnits?: number;
  averageCleanMinutes?: number;
  progressMode?: WorkProgressMode;
  seasonCount?: number;
  seasonLabel?: string;
  description?: string;
  notes?: string;
  externalSource?: "jikan" | "anilist" | "manual";
  externalId?: string;
}

function normalizeWork(input: WorkInput, existing?: LibraryWork): LibraryWork {
  const now = new Date().toISOString();
  const totalUnits = input.totalUnits === undefined ? undefined : Math.max(0, input.totalUnits);
  const completedUnits = Math.max(0, input.completedUnits ?? existing?.completedUnits ?? 0);
  return {
    id: existing?.id ?? createId("work"),
    title: input.title.trim(),
    originalTitle: input.originalTitle?.trim(),
    languageId: input.languageId,
    kind: input.kind,
    format: input.format,
    status: input.status ?? existing?.status ?? "active",
    coverUrl: input.coverUrl?.trim(),
    totalUnits,
    completedUnits: totalUnits ? Math.min(completedUnits, totalUnits) : completedUnits,
    averageCleanMinutes: input.averageCleanMinutes ?? existing?.averageCleanMinutes ?? 20,
    progressMode: input.progressMode ?? existing?.progressMode ?? defaultProgressModeForKind(input.kind),
    seasonCount: input.seasonCount ? Math.max(1, input.seasonCount) : undefined,
    seasonLabel: input.seasonLabel?.trim(),
    description: input.description?.trim(),
    notes: input.notes?.trim(),
    externalSource: input.externalSource ?? existing?.externalSource ?? "manual",
    externalId: input.externalId ?? existing?.externalId,
    lastRecordedAt: existing?.lastRecordedAt,
    userId: existing?.userId ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    syncState: "dirty"
  };
}

export async function listWorks(filters?: { languageId?: string; kind?: ImmersionKind; status?: WorkStatus }) {
  const works = await getDb().works.toArray();
  return works
    .filter((work) => !work.deletedAt)
    .filter((work) => !filters?.languageId || work.languageId === filters.languageId)
    .filter((work) => !filters?.kind || work.kind === filters.kind)
    .filter((work) => !filters?.status || work.status === filters.status)
    .sort((a, b) => (b.lastRecordedAt ?? b.updatedAt).localeCompare(a.lastRecordedAt ?? a.updatedAt));
}

export async function getWork(id?: string | null) {
  if (!id) return undefined;
  const work = await getDb().works.get(id);
  return work?.deletedAt ? undefined : work;
}

export async function createWork(input: WorkInput) {
  const db = getDb();
  const work = normalizeWork(input);
  await db.transaction("rw", db.works, db.sessions, async () => {
    await db.works.add(work);
    if (work.completedUnits > 0 && work.averageCleanMinutes > 0) {
      const now = new Date().toISOString();
      const unitFields = compactUnitNumbers(buildUnitRange(1, work.completedUnits));
      await db.sessions.add({
        id: createId("session"),
        date: formatIsoDate(),
        languageId: work.languageId,
        kind: work.kind,
        workId: work.id,
        workTitle: work.title,
        minutes: work.completedUnits * work.averageCleanMinutes,
        unitsCompleted: work.completedUnits,
        progressMode: work.progressMode,
        unitStart: unitFields.unitStart,
        unitEnd: unitFields.unitEnd,
        unitNumbers: unitFields.unitNumbers,
        entrySource: "historical-import",
        note: "添加作品时自动导入的历史进度。",
        phrases: [],
        isHistoricalImport: true,
        userId: null,
        createdAt: now,
        updatedAt: now,
        syncState: "dirty"
      });
    }
  });
  return work;
}

export async function updateWork(id: string, input: Partial<WorkInput>) {
  const existing = await getWork(id);
  if (!existing) throw new Error("作品不存在或已删除。");
  const next = normalizeWork(
    {
      title: input.title ?? existing.title,
      originalTitle: input.originalTitle ?? existing.originalTitle,
      languageId: input.languageId ?? existing.languageId,
      kind: input.kind ?? existing.kind,
      format: input.format ?? existing.format,
      status: input.status ?? existing.status,
      coverUrl: input.coverUrl ?? existing.coverUrl,
      totalUnits: "totalUnits" in input ? input.totalUnits : existing.totalUnits,
      completedUnits: input.completedUnits ?? existing.completedUnits,
      averageCleanMinutes: input.averageCleanMinutes ?? existing.averageCleanMinutes,
      progressMode: "progressMode" in input ? input.progressMode : existing.progressMode,
      seasonCount: "seasonCount" in input ? input.seasonCount : existing.seasonCount,
      seasonLabel: "seasonLabel" in input ? input.seasonLabel : existing.seasonLabel,
      description: input.description ?? existing.description,
      notes: input.notes ?? existing.notes,
      externalSource: input.externalSource ?? existing.externalSource,
      externalId: input.externalId ?? existing.externalId
    },
    existing
  );
  await getDb().works.put(next);
  return next;
}

export async function adjustWorkProgress(workId: string, unitsDelta: number, recordedAt?: string) {
  if (unitsDelta === 0 && !recordedAt) return;
  const work = await getWork(workId);
  if (!work) return;
  const completedUnits = Math.max(0, work.completedUnits + unitsDelta);
  await getDb().works.put({
    ...work,
    completedUnits: work.totalUnits ? Math.min(completedUnits, work.totalUnits) : completedUnits,
    lastRecordedAt: recordedAt ?? work.lastRecordedAt,
    updatedAt: new Date().toISOString(),
    syncState: "dirty"
  });
}

export async function deleteWork(id: string) {
  const work = await getWork(id);
  if (!work) return;
  await getDb().works.put({
    ...work,
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncState: "deleted"
  });
}
