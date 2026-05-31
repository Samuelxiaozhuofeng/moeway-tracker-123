import type { ImmersionKind, ImmersionSession, LibraryWork, WorkFormat, WorkProgressMode } from "@/types/domain";

const seasonalListeningFormats = new Set<WorkFormat>(["anime", "podcast", "youtube"]);

export function defaultProgressModeForKind(kind: ImmersionKind): WorkProgressMode {
  return kind === "reading" ? "chapters" : "episodes";
}

export function resolveWorkProgressMode(
  work?: Pick<LibraryWork, "kind" | "progressMode"> | null,
  fallbackKind: ImmersionKind = "listening"
): WorkProgressMode {
  return work?.progressMode ?? defaultProgressModeForKind(work?.kind ?? fallbackKind);
}

export function isSeasonalListeningFormat(kind: ImmersionKind, format: WorkFormat) {
  return kind === "listening" && seasonalListeningFormats.has(format);
}

export function progressUnitLabel(mode: WorkProgressMode) {
  if (mode === "pages") return "页";
  if (mode === "chapters") return "章";
  return "集";
}

export function progressUnitNoun(mode: WorkProgressMode) {
  if (mode === "pages") return "页数";
  if (mode === "chapters") return "章节";
  return "集数";
}

export function getWorkUnitLabel(work: Pick<LibraryWork, "kind" | "progressMode">) {
  return progressUnitLabel(resolveWorkProgressMode(work, work.kind));
}

export function getWorkUnitNoun(work: Pick<LibraryWork, "kind" | "progressMode">) {
  return progressUnitNoun(resolveWorkProgressMode(work, work.kind));
}

export function getAverageMinutesLabel(work: Pick<LibraryWork, "kind" | "progressMode">) {
  return `干净分钟/${getWorkUnitLabel(work)}`;
}

export function normalizeUnitNumbers(numbers: number[]) {
  const normalized = [...new Set(numbers.map((number) => {
    if (!Number.isFinite(number) || !Number.isInteger(number)) {
      throw new Error("进度编号必须是整数。");
    }
    if (number < 1) throw new Error("进度编号不能小于 1。");
    return number;
  }))].sort((a, b) => a - b);
  return normalized;
}

export function buildUnitRange(unitStart?: number, unitEnd?: number) {
  if (unitStart === undefined && unitEnd === undefined) return [];
  if (unitStart === undefined || unitEnd === undefined) throw new Error("请同时填写起始和结束进度。");
  if (!Number.isFinite(unitStart) || !Number.isInteger(unitStart) || !Number.isFinite(unitEnd) || !Number.isInteger(unitEnd)) {
    throw new Error("进度编号必须是整数。");
  }
  if (unitStart < 1 || unitEnd < 1) throw new Error("进度编号不能小于 1。");
  const start = unitStart;
  const end = unitEnd;
  if (start > end) throw new Error("起始进度不能大于结束进度。");
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function getSessionUnitNumbers(
  session: Pick<ImmersionSession, "unitStart" | "unitEnd" | "unitNumbers">
) {
  if (session.unitNumbers && session.unitNumbers.length > 0) return normalizeUnitNumbers(session.unitNumbers);
  return buildUnitRange(session.unitStart, session.unitEnd);
}

export function getSessionInputUnitNumbers(input: {
  unitStart?: number;
  unitEnd?: number;
  unitNumbers?: number[];
}) {
  if (input.unitNumbers && input.unitNumbers.length > 0) return normalizeUnitNumbers(input.unitNumbers);
  return buildUnitRange(input.unitStart, input.unitEnd);
}

export function compactUnitNumbers(numbers: number[]) {
  const normalized = normalizeUnitNumbers(numbers);
  if (normalized.length === 0) {
    return { unitStart: undefined, unitEnd: undefined, unitNumbers: undefined };
  }

  const first = normalized[0];
  const contiguous = normalized.every((number, index) => number === first + index);
  if (contiguous) {
    return {
      unitStart: first,
      unitEnd: normalized[normalized.length - 1],
      unitNumbers: undefined
    };
  }

  return {
    unitStart: normalized[0],
    unitEnd: normalized[normalized.length - 1],
    unitNumbers: normalized
  };
}

export function assertUnitsWithinTotal(numbers: number[], totalUnits?: number) {
  if (!totalUnits || numbers.length === 0) return;
  const maxUnit = Math.max(...numbers);
  if (maxUnit > totalUnits) throw new Error(`进度不能超过总数 ${totalUnits}。`);
}

export function findDuplicateUnitNumbers(requested: number[], completed: number[]) {
  const completedSet = new Set(completed);
  return requested.filter((number) => completedSet.has(number));
}

export function calculateRangeProgress(input: {
  unitStart?: number;
  unitEnd?: number;
  averageCleanMinutes: number;
}) {
  const unitNumbers = buildUnitRange(input.unitStart, input.unitEnd);
  return {
    unitNumbers,
    unitsCompleted: unitNumbers.length,
    minutes: unitNumbers.length * input.averageCleanMinutes
  };
}

export function formatUnitNumberList(numbers: number[], limit = 8) {
  const visible = numbers.slice(0, limit).join("、");
  return numbers.length > limit ? `${visible} 等 ${numbers.length} 个` : visible;
}
