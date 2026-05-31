"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GOAL_INTERVAL_DAY_VALUES, getGoalOccurrencesPerWeek } from "@/lib/goals/schedule";

interface GoalTargetFieldsProps {
  label: string;
  dailyMinutes: number;
  intervalDays: number;
  weeklyMinutes: number;
  onDailyMinutesChange: (value: number) => void;
  onIntervalDaysChange: (value: number) => void;
}

export function GoalTargetFields({
  label,
  dailyMinutes,
  intervalDays,
  weeklyMinutes,
  onDailyMinutesChange,
  onIntervalDaysChange
}: GoalTargetFieldsProps) {
  return (
    <div className="grid gap-3 border-t border-white/[0.08] pt-3 first:border-t-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <p className="shrink-0 text-xs text-muted-foreground">{weeklyMinutes} 分钟/周</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <GoalField label="单次目标">
          <GoalInput value={dailyMinutes} onChange={onDailyMinutesChange} />
        </GoalField>
        <GoalField label="频率">
          <Select value={String(intervalDays)} onValueChange={(value) => onIntervalDaysChange(Number(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOAL_INTERVAL_DAY_VALUES.map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {formatIntervalLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </GoalField>
        <GoalField label="每周合计">
          <Input readOnly value={weeklyMinutes} className="text-muted-foreground" />
        </GoalField>
      </div>
    </div>
  );
}

function GoalInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <Input
      type="number"
      min={0}
      value={value}
      onChange={(event) => {
        const next = Number(event.target.value);
        if (Number.isFinite(next)) onChange(next);
      }}
    />
  );
}

function GoalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function formatIntervalLabel(intervalDays: number) {
  const occurrences = getGoalOccurrencesPerWeek(intervalDays);
  if (intervalDays === 1) return `每天（每周 ${occurrences} 次）`;
  return `每隔 ${intervalDays - 1} 天（每周 ${occurrences} 次）`;
}
