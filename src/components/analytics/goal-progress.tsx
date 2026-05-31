"use client";

import { ProgressBar } from "@tremor/react";
import { Headphones, BookOpen } from "lucide-react";
import { useGoals } from "@/lib/data/hooks";
import type { DashboardSummary } from "@/types/domain";

export function GoalProgress({ summary }: { summary: DashboardSummary }) {
  const { data: goals = [] } = useGoals();
  const goal = goals[0];
  const listeningGoal = goal?.dailyListeningMinutes ?? 60;
  const readingGoal = goal?.dailyReadingMinutes ?? 30;
  const listeningValue = Math.min(100, Math.round((summary.todayListeningMinutes / listeningGoal) * 100));
  const readingValue = Math.min(100, Math.round((summary.todayReadingMinutes / readingGoal) * 100));

  return (
    <section className="grid gap-3 sm:grid-cols-2">
      <GoalRow icon={<Headphones className="h-5 w-5" />} label="今日听力" minutes={summary.todayListeningMinutes} goal={listeningGoal} value={listeningValue} color="teal" />
      <GoalRow icon={<BookOpen className="h-5 w-5" />} label="今日阅读" minutes={summary.todayReadingMinutes} goal={readingGoal} value={readingValue} color="violet" />
    </section>
  );
}

function GoalRow({
  icon,
  label,
  minutes,
  goal,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  minutes: number;
  goal: number;
  value: number;
  color: "teal" | "violet";
}) {
  return (
    <div className="quiet-panel rounded-[1.5rem] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.06] text-primary">{icon}</span>
          {label}
        </div>
        <p className="text-xl font-semibold">{value}%</p>
      </div>
      <ProgressBar value={value} color={color} className="mt-2" />
      <p className="mt-2 text-xs text-muted-foreground">{minutes} / {goal} 分钟</p>
    </div>
  );
}
