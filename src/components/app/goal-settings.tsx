"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertGoal } from "@/lib/db/settings";
import { useGoals, useInvalidateData } from "@/lib/data/hooks";

export function GoalSettingsPanel() {
  const { data: goals = [] } = useGoals();
  const goal = goals[0];
  const [dailyListening, setDailyListening] = useState(goal?.dailyListeningMinutes ?? 60);
  const [dailyReading, setDailyReading] = useState(goal?.dailyReadingMinutes ?? 30);
  const [weeklyListening, setWeeklyListening] = useState(goal?.weeklyListeningMinutes ?? 420);
  const [weeklyReading, setWeeklyReading] = useState(goal?.weeklyReadingMinutes ?? 210);
  const invalidate = useInvalidateData();

  useEffect(() => {
    if (!goal) return;
    setDailyListening(goal.dailyListeningMinutes);
    setDailyReading(goal.dailyReadingMinutes);
    setWeeklyListening(goal.weeklyListeningMinutes);
    setWeeklyReading(goal.weeklyReadingMinutes);
  }, [goal]);

  return (
    <section className="quiet-panel rounded-[1.5rem] p-4">
      <h2 className="font-semibold">目标</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="每日听力"><Input type="number" value={dailyListening} onChange={(event) => setDailyListening(Number(event.target.value))} /></Field>
        <Field label="每日阅读"><Input type="number" value={dailyReading} onChange={(event) => setDailyReading(Number(event.target.value))} /></Field>
        <Field label="每周听力"><Input type="number" value={weeklyListening} onChange={(event) => setWeeklyListening(Number(event.target.value))} /></Field>
        <Field label="每周阅读"><Input type="number" value={weeklyReading} onChange={(event) => setWeeklyReading(Number(event.target.value))} /></Field>
      </div>
      <Button
        className="mt-4"
        onClick={async () => {
          await upsertGoal({
            id: goal?.id,
            languageId: goal?.languageId ?? null,
            dailyListeningMinutes: dailyListening,
            dailyReadingMinutes: dailyReading,
            weeklyListeningMinutes: weeklyListening,
            weeklyReadingMinutes: weeklyReading
          });
          await invalidate();
          toast.success("目标已保存");
        }}
      >
        保存目标
      </Button>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
