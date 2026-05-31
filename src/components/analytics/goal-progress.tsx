"use client";

import { ProgressBar } from "@tremor/react";
import { Headphones, BookOpen } from "lucide-react";
import { createDefaultGoal } from "@/lib/data/defaults";
import { useGoals } from "@/lib/data/hooks";
import { buildLanguageDailyGoals } from "@/lib/stats/language-goals";
import type { ImmersionKind, ImmersionSession, TargetLanguage } from "@/types/domain";

export function GoalProgress({ sessions, languages }: { sessions: ImmersionSession[]; languages: TargetLanguage[] }) {
  const { data: goals = [] } = useGoals();
  const rows = buildLanguageDailyGoals(sessions, languages, goals);

  return (
    <section className="grid gap-3 lg:grid-cols-3">
      {rows.map((row) => (
        <div key={row.language.id} className="quiet-panel rounded-[1.5rem] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="line-clamp-1 font-semibold">{row.language.name}</p>
              <p className="text-xs text-muted-foreground">{row.language.nativeName ?? row.language.code}</p>
            </div>
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: row.language.accent }} />
          </div>
          <div className="grid gap-3">
            <GoalRow
              icon={<Headphones className="h-4 w-4" />}
              label="今日听力"
              minutes={row.listeningMinutes}
              goal={row.listeningGoalMinutes}
              scheduled={row.isListeningScheduledToday}
              kind="listening"
            />
            <GoalRow
              icon={<BookOpen className="h-4 w-4" />}
              label="今日阅读"
              minutes={row.readingMinutes}
              goal={row.readingGoalMinutes}
              scheduled={row.isReadingScheduledToday}
              kind="reading"
            />
          </div>
        </div>
      ))}
      {rows.length === 0 && (
        <div className="quiet-panel rounded-[1.5rem] p-4 sm:col-span-2">
          <GoalRow icon={<Headphones className="h-4 w-4" />} label="今日听力" minutes={0} goal={createDefaultGoal().dailyListeningMinutes} scheduled kind="listening" />
        </div>
      )}
    </section>
  );
}

function GoalRow({
  icon,
  label,
  minutes,
  goal,
  scheduled,
  kind
}: {
  icon: React.ReactNode;
  label: string;
  minutes: number;
  goal: number;
  scheduled: boolean;
  kind: ImmersionKind;
}) {
  const hasGoal = goal > 0;
  const value = hasGoal ? Math.min(100, Math.round((minutes / goal) * 100)) : minutes > 0 ? 100 : 0;
  const status = hasGoal ? `${minutes} / ${goal} 分钟` : scheduled ? `${minutes} 分钟 · 未设置目标` : `${minutes} 分钟 · 今日休息`;
  const color = kind === "listening" ? "teal" : "violet";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/[0.06] text-primary">{icon}</span>
          {label}
        </div>
        <p className="text-sm font-semibold">{hasGoal ? `${value}%` : scheduled ? "未设置" : "休息"}</p>
      </div>
      <ProgressBar value={value} color={color} className="mt-2" />
      <p className="mt-2 text-xs text-muted-foreground">{status}</p>
    </div>
  );
}
