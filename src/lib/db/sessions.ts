import type { ImmersionKind, ImmersionSession, SessionEntrySource, WorkProgressMode } from "@/types/domain";
import { getDb } from "@/lib/db/database";
import { listCompletedUnitNumbers } from "@/lib/db/work-progress";
import { adjustWorkProgress, getWork } from "@/lib/db/works";
import {
  assertUnitsWithinTotal,
  compactUnitNumbers,
  findDuplicateUnitNumbers,
  formatUnitNumberList,
  getSessionInputUnitNumbers,
  resolveWorkProgressMode
} from "@/lib/progress/units";
import { createId } from "@/lib/utils/id";
import { formatIsoDate } from "@/lib/utils/format";

export interface SessionInput {
  date?: string;
  startedAt?: string;
  endedAt?: string;
  languageId: string;
  kind: ImmersionKind;
  workId?: string | null;
  workTitle?: string;
  minutes: number;
  unitsCompleted?: number;
  progressMode?: WorkProgressMode;
  unitStart?: number;
  unitEnd?: number;
  unitNumbers?: number[];
  entrySource?: SessionEntrySource;
  allowDuplicateUnits?: boolean;
  note?: string;
  phrases?: string[];
  isHistoricalImport?: boolean;
}

export async function listSessions(filters?: {
  languageId?: string;
  kind?: ImmersionKind;
  workId?: string;
  from?: string;
  to?: string;
}) {
  const sessions = await getDb().sessions.where("syncState").notEqual("deleted").toArray();
  return sessions
    .filter((session) => !filters?.languageId || session.languageId === filters.languageId)
    .filter((session) => !filters?.kind || session.kind === filters.kind)
    .filter((session) => !filters?.workId || session.workId === filters.workId)
    .filter((session) => !filters?.from || session.date >= filters.from)
    .filter((session) => !filters?.to || session.date <= filters.to)
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
}

export async function getSession(id: string) {
  const session = await getDb().sessions.get(id);
  return session?.syncState === "deleted" ? undefined : session;
}

export async function createSession(input: SessionInput) {
  const db = getDb();
  const now = new Date().toISOString();
  const work = input.workId ? await getWork(input.workId) : undefined;
  const unitNumbers = getSessionInputUnitNumbers(input);
  if (work) {
    assertUnitsWithinTotal(unitNumbers, work.totalUnits);
    await assertNoDuplicateUnits(work.id, unitNumbers, input.allowDuplicateUnits);
  }
  const unitFields = compactUnitNumbers(unitNumbers);
  const unitsCompleted = unitNumbers.length > 0 ? unitNumbers.length : Math.max(0, input.unitsCompleted ?? 0);
  const session: ImmersionSession = {
    id: createId("session"),
    date: input.date ?? formatIsoDate(),
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    languageId: input.languageId,
    kind: input.kind,
    workId: input.workId ?? null,
    workTitle: input.workTitle ?? work?.title,
    minutes: Math.max(0, Math.round(input.minutes)),
    unitsCompleted,
    progressMode: input.progressMode ?? (work ? resolveWorkProgressMode(work, work.kind) : undefined),
    unitStart: unitFields.unitStart,
    unitEnd: unitFields.unitEnd,
    unitNumbers: unitFields.unitNumbers,
    entrySource: input.entrySource ?? (input.isHistoricalImport ? "historical-import" : "manual"),
    note: input.note?.trim(),
    phrases: input.phrases?.map((phrase) => phrase.trim()).filter(Boolean) ?? [],
    isHistoricalImport: input.isHistoricalImport ?? false,
    userId: null,
    createdAt: now,
    updatedAt: now,
    syncState: "dirty"
  };

  await db.transaction("rw", db.sessions, db.works, async () => {
    await db.sessions.add(session);
    if (session.workId) {
      await adjustWorkProgress(session.workId, session.unitsCompleted, session.date);
    }
  });
  return session;
}

export async function updateSession(id: string, input: Partial<SessionInput>) {
  const db = getDb();
  const existing = await getSession(id);
  if (!existing) throw new Error("记录不存在或已删除。");
  const nextWorkId = input.workId === undefined ? existing.workId : input.workId;
  const nextWork = nextWorkId ? await getWork(nextWorkId) : undefined;
  const hasUnitFieldInput = "unitStart" in input || "unitEnd" in input || "unitNumbers" in input;
  const unitNumbers = hasUnitFieldInput ? getSessionInputUnitNumbers(input) : getSessionInputUnitNumbers(existing);
  if (nextWork) {
    assertUnitsWithinTotal(unitNumbers, nextWork.totalUnits);
    if (hasUnitFieldInput) await assertNoDuplicateUnits(nextWork.id, unitNumbers, input.allowDuplicateUnits, existing.id);
  }
  const unitFields = compactUnitNumbers(unitNumbers);
  const next: ImmersionSession = {
    ...existing,
    date: input.date ?? existing.date,
    startedAt: input.startedAt ?? existing.startedAt,
    endedAt: input.endedAt ?? existing.endedAt,
    languageId: input.languageId ?? existing.languageId,
    kind: input.kind ?? existing.kind,
    workId: nextWorkId,
    workTitle: input.workTitle ?? existing.workTitle,
    minutes: input.minutes === undefined ? existing.minutes : Math.max(0, Math.round(input.minutes)),
    unitsCompleted:
      input.unitsCompleted === undefined ? existing.unitsCompleted : Math.max(0, input.unitsCompleted),
    progressMode: input.progressMode ?? existing.progressMode,
    unitStart: unitFields.unitStart,
    unitEnd: unitFields.unitEnd,
    unitNumbers: unitFields.unitNumbers,
    entrySource: input.entrySource ?? existing.entrySource,
    note: input.note === undefined ? existing.note : input.note.trim(),
    phrases: input.phrases ?? existing.phrases,
    isHistoricalImport: input.isHistoricalImport ?? existing.isHistoricalImport,
    updatedAt: new Date().toISOString(),
    syncState: "dirty"
  };

  await db.transaction("rw", db.sessions, db.works, async () => {
    await db.sessions.put(next);
    if (existing.workId && existing.workId !== next.workId) {
      await adjustWorkProgress(existing.workId, -existing.unitsCompleted);
    }
    if (next.workId) {
      const delta = existing.workId === next.workId ? next.unitsCompleted - existing.unitsCompleted : next.unitsCompleted;
      await adjustWorkProgress(next.workId, delta, next.date);
    }
  });
  return next;
}

async function assertNoDuplicateUnits(
  workId: string,
  unitNumbers: number[],
  allowDuplicateUnits?: boolean,
  excludingSessionId?: string
) {
  if (allowDuplicateUnits || unitNumbers.length === 0) return;
  const completedUnitNumbers = await listCompletedUnitNumbers(workId, excludingSessionId);
  const duplicates = findDuplicateUnitNumbers(unitNumbers, completedUnitNumbers);
  if (duplicates.length > 0) {
    throw new Error(`这些进度已完成：${formatUnitNumberList(duplicates)}。如需重复补录，请勾选允许重复。`);
  }
}

export async function deleteSession(id: string) {
  const db = getDb();
  const existing = await getSession(id);
  if (!existing) return;
  await db.transaction("rw", db.sessions, db.works, async () => {
    await db.sessions.put({
      ...existing,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncState: "deleted"
    });
    if (existing.workId) {
      await adjustWorkProgress(existing.workId, -existing.unitsCompleted);
    }
  });
}
