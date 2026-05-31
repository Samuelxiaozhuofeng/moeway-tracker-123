export const GOAL_INTERVAL_DAY_VALUES = [1, 2, 3, 4, 5, 6, 7] as const;

const daysPerWeek = 7;

export function normalizeGoalIntervalDays(value: number | undefined, fallback = 1, label = "目标频率") {
  const resolved = value ?? fallback;
  if (!Number.isFinite(resolved) || !Number.isInteger(resolved) || resolved < 1 || resolved > daysPerWeek) {
    throw new Error(`${label}必须是 1 到 7 天之间的整数。`);
  }
  return resolved;
}

export function getGoalOccurrencesPerWeek(intervalDays: number) {
  return Math.ceil(daysPerWeek / normalizeGoalIntervalDays(intervalDays));
}

export function deriveWeeklyGoalMinutes(dailyMinutes: number, intervalDays: number) {
  return Math.round(dailyMinutes) * getGoalOccurrencesPerWeek(intervalDays);
}

export function isGoalScheduledOnDate(intervalDays: number, date: string) {
  const isoWeekday = getIsoWeekday(date);
  return (isoWeekday - 1) % normalizeGoalIntervalDays(intervalDays) === 0;
}

export function scheduledGoalMinutesForDate(dailyMinutes: number, intervalDays: number, date: string) {
  return isGoalScheduledOnDate(intervalDays, date) ? Math.round(dailyMinutes) : 0;
}

function getIsoWeekday(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error("目标日期格式必须是 YYYY-MM-DD。");
  }
  const jsDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return jsDay === 0 ? 7 : jsDay;
}
