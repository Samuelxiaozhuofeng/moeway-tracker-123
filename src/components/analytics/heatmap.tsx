"use client";

import type { ImmersionSession } from "@/types/domain";
import { groupSessionsByDay } from "@/lib/stats/metrics";
import { formatMinutes } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function Heatmap({ sessions, large = false }: { sessions: ImmersionSession[]; large?: boolean }) {
  const days = groupSessionsByDay(sessions, 365);

  return (
    <div className="quiet-panel rounded-[1.5rem] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">过去一年</h2>
        <p className="text-xs text-muted-foreground">颜色越亮，沉浸越久</p>
      </div>
      <div className="no-scrollbar overflow-x-auto">
        <div className={cn("grid grid-flow-col grid-rows-7 gap-1", large ? "auto-cols-[1rem]" : "auto-cols-[0.72rem]")}>
          {days.map((day) => (
            <span
              key={day.date}
              title={`${day.date} · ${formatMinutes(day.total)}`}
              className={cn("rounded-[0.22rem]", large ? "h-4 w-4" : "h-3 w-3", colorForMinutes(day.total))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function colorForMinutes(minutes: number) {
  if (minutes >= 180) return "bg-primary";
  if (minutes >= 90) return "bg-primary/70";
  if (minutes >= 45) return "bg-primary/45";
  if (minutes > 0) return "bg-primary/22";
  return "bg-white/[0.055]";
}
