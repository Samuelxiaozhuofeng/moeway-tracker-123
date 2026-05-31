import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)} 分钟`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return rest > 0 ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`;
}

export function formatHours(minutes: number, digits = 1) {
  return `${(minutes / 60).toFixed(digits)}h`;
}

export function formatShortDate(date: string) {
  return format(parseISO(date), "M月d日", { locale: zhCN });
}

export function formatIsoDate(date = new Date()) {
  return format(date, "yyyy-MM-dd");
}

export function timeAgo(value?: string) {
  if (!value) return "还没有记录";
  return `${formatDistanceToNowStrict(parseISO(value), { locale: zhCN })}前`;
}

export function clampProgress(done: number, total?: number) {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}
