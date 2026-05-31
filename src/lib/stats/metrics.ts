import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths
} from "date-fns";
import type { DashboardSummary, ImmersionSession, LibraryWork, TimeRange } from "@/types/domain";
import { formatIsoDate } from "@/lib/utils/format";

export interface DailyTotal {
  date: string;
  listening: number;
  reading: number;
  total: number;
}

export interface TrendPoint {
  label: string;
  listening: number;
  reading: number;
  total: number;
}

export interface RatioPoint {
  name: string;
  value: number;
  fill: string;
}

export function summarizeDashboard(sessions: ImmersionSession[]): DashboardSummary {
  const today = formatIsoDate();
  const daily = groupSessionsByDay(sessions);
  const todayTotal = daily.find((day) => day.date === today);
  const totalListeningMinutes = sessions
    .filter((session) => session.kind === "listening")
    .reduce((sum, session) => sum + session.minutes, 0);
  const totalReadingMinutes = sessions
    .filter((session) => session.kind === "reading")
    .reduce((sum, session) => sum + session.minutes, 0);

  return {
    todayListeningMinutes: todayTotal?.listening ?? 0,
    todayReadingMinutes: todayTotal?.reading ?? 0,
    totalListeningMinutes,
    totalReadingMinutes,
    currentStreak: calculateCurrentStreak(daily),
    longestStreak: calculateLongestStreak(daily)
  };
}

export function filterSessionsByRange(sessions: ImmersionSession[], range: TimeRange) {
  if (range === "all") return sessions;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
  const start = formatIsoDate(subDays(new Date(), days - 1));
  return sessions.filter((session) => session.date >= start);
}

export function groupSessionsByDay(sessions: ImmersionSession[], days = 365): DailyTotal[] {
  const map = new Map<string, DailyTotal>();
  const start = subDays(new Date(), days - 1);
  eachDayOfInterval({ start, end: new Date() }).forEach((date) => {
    const key = formatIsoDate(date);
    map.set(key, { date: key, listening: 0, reading: 0, total: 0 });
  });

  sessions.forEach((session) => {
    const row = map.get(session.date) ?? { date: session.date, listening: 0, reading: 0, total: 0 };
    row[session.kind] += session.minutes;
    row.total += session.minutes;
    map.set(session.date, row);
  });

  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function buildTrend(sessions: ImmersionSession[], granularity: "day" | "week" | "month") {
  const buckets = new Map<string, TrendPoint>();
  sessions.forEach((session) => {
    const date = parseISO(session.date);
    const label =
      granularity === "day"
        ? format(date, "MM-dd")
        : granularity === "week"
          ? format(startOfWeek(date, { weekStartsOn: 1 }), "MM-dd")
          : format(startOfMonth(date), "yyyy-MM");
    const current = buckets.get(label) ?? { label, listening: 0, reading: 0, total: 0 };
    current[session.kind] += session.minutes;
    current.total += session.minutes;
    buckets.set(label, current);
  });
  return [...buckets.values()];
}

export function buildKindRatio(sessions: ImmersionSession[]): RatioPoint[] {
  const listening = sessions.filter((session) => session.kind === "listening").reduce((sum, item) => sum + item.minutes, 0);
  const reading = sessions.filter((session) => session.kind === "reading").reduce((sum, item) => sum + item.minutes, 0);
  return [
    { name: "听力", value: listening, fill: "#77e5cf" },
    { name: "阅读", value: reading, fill: "#c6b6ff" }
  ];
}

export function buildLanguageRatio(
  sessions: ImmersionSession[],
  languages: Array<{ id: string; name: string; accent: string }>
): RatioPoint[] {
  return languages
    .map((language) => ({
      name: language.name,
      value: sessions.filter((session) => session.languageId === language.id).reduce((sum, session) => sum + session.minutes, 0),
      fill: language.accent
    }))
    .filter((item) => item.value > 0);
}

export function buildTopWorks(sessions: ImmersionSession[], works: LibraryWork[]) {
  const totals = new Map<string, number>();
  sessions.forEach((session) => {
    const key = session.workId ?? session.workTitle ?? "临时记录";
    totals.set(key, (totals.get(key) ?? 0) + session.minutes);
  });
  return [...totals.entries()]
    .map(([key, minutes]) => ({
      id: key,
      title: works.find((work) => work.id === key)?.title ?? key,
      minutes
    }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 10);
}

export function weeklyWindow() {
  return {
    start: formatIsoDate(startOfWeek(new Date(), { weekStartsOn: 1 })),
    end: formatIsoDate(endOfWeek(new Date(), { weekStartsOn: 1 }))
  };
}

export function monthlyWindow() {
  const month = subMonths(new Date(), 0);
  return {
    start: formatIsoDate(startOfMonth(month)),
    end: formatIsoDate(endOfMonth(month))
  };
}

export function milestoneForMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const milestones = [1000, 500, 250, 100, 50, 10];
  return milestones.find((milestone) => hours >= milestone);
}

function calculateCurrentStreak(daily: DailyTotal[]) {
  const activeDays = new Set(daily.filter((day) => day.total > 0).map((day) => day.date));
  const today = new Date();
  let cursor = activeDays.has(formatIsoDate(today)) ? today : subDays(today, 1);
  let streak = 0;
  while (activeDays.has(formatIsoDate(cursor))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

function calculateLongestStreak(daily: DailyTotal[]) {
  let longest = 0;
  let current = 0;
  daily
    .filter((day) => !isAfter(parseISO(day.date), new Date()))
    .forEach((day) => {
      current = day.total > 0 ? current + 1 : 0;
      longest = Math.max(longest, current);
    });
  return longest;
}
