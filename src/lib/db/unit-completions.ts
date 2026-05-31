import { getDb } from "@/lib/db/database";
import { createSession, deleteSession, updateSession } from "@/lib/db/sessions";
import { listCompletedUnitNumbers } from "@/lib/db/work-progress";
import { getWork } from "@/lib/db/works";
import {
  assertUnitsWithinTotal,
  compactUnitNumbers,
  findDuplicateUnitNumbers,
  getSessionUnitNumbers,
  getWorkUnitLabel,
  normalizeUnitNumbers,
  resolveWorkProgressMode
} from "@/lib/progress/units";
import type { ImmersionSession } from "@/types/domain";

export interface CompleteWorkUnitsOptions {
  date?: string;
  minutes?: number;
  allowDuplicateUnits?: boolean;
  duplicateStrategy?: "skip" | "throw";
  note?: string;
}

export async function completeWorkUnits(workId: string, unitNumbers: number[], options: CompleteWorkUnitsOptions = {}) {
  const work = await getWork(workId);
  if (!work) throw new Error("作品不存在或已删除。");

  const requested = normalizeUnitNumbers(unitNumbers);
  assertUnitsWithinTotal(requested, work.totalUnits);

  const completed = await listCompletedUnitNumbers(workId);
  const skippedUnitNumbers = options.allowDuplicateUnits ? [] : findDuplicateUnitNumbers(requested, completed);
  if (skippedUnitNumbers.length > 0 && options.duplicateStrategy === "throw") {
    throw new Error(`这些${getWorkUnitLabel(work)}已经完成：${skippedUnitNumbers.join("、")}。`);
  }

  const addedUnitNumbers = options.allowDuplicateUnits
    ? requested
    : requested.filter((unitNumber) => !skippedUnitNumbers.includes(unitNumber));

  if (addedUnitNumbers.length === 0) {
    return {
      action: "skipped" as const,
      addedUnitNumbers,
      skippedUnitNumbers,
      session: undefined
    };
  }

  const unitFields = compactUnitNumbers(addedUnitNumbers);
  const session = await createSession({
    date: options.date,
    languageId: work.languageId,
    kind: work.kind,
    workId: work.id,
    workTitle: work.title,
    minutes: options.minutes ?? addedUnitNumbers.length * work.averageCleanMinutes,
    unitsCompleted: addedUnitNumbers.length,
    progressMode: resolveWorkProgressMode(work, work.kind),
    unitStart: unitFields.unitStart,
    unitEnd: unitFields.unitEnd,
    unitNumbers: unitFields.unitNumbers,
    entrySource: "work-detail-toggle",
    note: options.note ?? `作品详情勾选完成 ${addedUnitNumbers.join("、")}${getWorkUnitLabel(work)}。`
  });

  return {
    action: "completed" as const,
    addedUnitNumbers,
    skippedUnitNumbers,
    session
  };
}

export async function uncompleteWorkUnit(workId: string, unitNumber: number) {
  const work = await getWork(workId);
  if (!work) throw new Error("作品不存在或已删除。");
  const [normalizedUnitNumber] = normalizeUnitNumbers([unitNumber]);
  const target = await findSessionContainingUnit(workId, normalizedUnitNumber);

  if (!target) {
    return {
      action: "missing" as const,
      removedUnitNumber: normalizedUnitNumber,
      session: undefined
    };
  }

  const remainingUnitNumbers = target.unitNumbers.filter((number) => number !== normalizedUnitNumber);
  if (remainingUnitNumbers.length === 0) {
    await deleteSession(target.session.id);
    return {
      action: "removed" as const,
      removedUnitNumber: normalizedUnitNumber,
      session: target.session
    };
  }

  const unitFields = compactUnitNumbers(remainingUnitNumbers);
  const minutesPerUnit = target.session.unitsCompleted > 0
    ? target.session.minutes / target.session.unitsCompleted
    : work.averageCleanMinutes;
  const session = await updateSession(target.session.id, {
    minutes: Math.max(0, Math.round(minutesPerUnit * remainingUnitNumbers.length)),
    unitsCompleted: remainingUnitNumbers.length,
    unitStart: unitFields.unitStart,
    unitEnd: unitFields.unitEnd,
    unitNumbers: unitFields.unitNumbers,
    progressMode: target.session.progressMode ?? resolveWorkProgressMode(work, work.kind)
  });

  return {
    action: "updated" as const,
    removedUnitNumber: normalizedUnitNumber,
    session
  };
}

export async function toggleWorkUnitCompletion(workId: string, unitNumber: number) {
  const [normalizedUnitNumber] = normalizeUnitNumbers([unitNumber]);
  const completed = await listCompletedUnitNumbers(workId);
  if (completed.includes(normalizedUnitNumber)) {
    return uncompleteWorkUnit(workId, normalizedUnitNumber);
  }
  return completeWorkUnits(workId, [normalizedUnitNumber], { duplicateStrategy: "skip" });
}

async function findSessionContainingUnit(workId: string, unitNumber: number) {
  const sessions = await getDb().sessions.where("workId").equals(workId).toArray();
  return sessions
    .filter((session) => session.syncState !== "deleted")
    .map((session) => ({ session, unitNumbers: getSessionUnitNumbers(session) }))
    .filter((entry) => entry.unitNumbers.includes(unitNumber))
    .sort(compareUnitSessionCandidates)[0];
}

function compareUnitSessionCandidates(
  left: { session: ImmersionSession },
  right: { session: ImmersionSession }
) {
  const leftPriority = sourcePriority(left.session.entrySource);
  const rightPriority = sourcePriority(right.session.entrySource);
  if (leftPriority !== rightPriority) return rightPriority - leftPriority;
  return right.session.updatedAt.localeCompare(left.session.updatedAt);
}

function sourcePriority(source?: ImmersionSession["entrySource"]) {
  if (source === "work-detail-toggle") return 3;
  if (source === "historical-import") return 2;
  return 1;
}
