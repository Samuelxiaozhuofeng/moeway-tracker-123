"use client";

import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDefaultGoal } from "@/lib/data/defaults";
import { upsertGoal } from "@/lib/db/settings";
import { useGoals, useInvalidateData, useLanguages } from "@/lib/data/hooks";
import { syncWithSupabase } from "@/lib/supabase/sync";
import type { GoalSettings, TargetLanguage } from "@/types/domain";

interface GoalDraft {
  dailyListeningMinutes: number;
  dailyReadingMinutes: number;
  weeklyListeningMinutes: number;
  weeklyReadingMinutes: number;
}

export function GoalSettingsPanel() {
  const { data: goals = [] } = useGoals();
  const { data: languages = [] } = useLanguages();
  const [drafts, setDrafts] = useState<Record<string, GoalDraft>>({});
  const invalidate = useInvalidateData();

  const goalsByLanguage = useMemo(
    () => new Map(goals.map((goal) => [goal.languageId, goal])),
    [goals]
  );

  useEffect(() => {
    setDrafts(Object.fromEntries(languages.map((language) => [language.id, toGoalDraft(goalForLanguage(language, goalsByLanguage))])));
  }, [goalsByLanguage, languages]);

  return (
    <section className="quiet-panel rounded-[1.5rem] p-4">
      <h2 className="font-semibold">目标</h2>
      <div className="mt-4 grid gap-4">
        {languages.map((language) => {
          const savedGoal = goalsByLanguage.get(language.id);
          const goal = savedGoal ?? createDefaultGoal(language.id);
          const draft = drafts[language.id] ?? toGoalDraft(goal);
          return (
            <div key={language.id} className="rounded-2xl bg-white/[0.035] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{language.name}</p>
                  <p className="text-xs text-muted-foreground">{language.nativeName ?? language.code}</p>
                </div>
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: language.accent }} />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="每日听力">
                  <GoalInput value={draft.dailyListeningMinutes} onChange={(value) => updateDraft(language.id, "dailyListeningMinutes", value, setDrafts)} />
                </Field>
                <Field label="每日阅读">
                  <GoalInput value={draft.dailyReadingMinutes} onChange={(value) => updateDraft(language.id, "dailyReadingMinutes", value, setDrafts)} />
                </Field>
                <Field label="每周听力">
                  <GoalInput value={draft.weeklyListeningMinutes} onChange={(value) => updateDraft(language.id, "weeklyListeningMinutes", value, setDrafts)} />
                </Field>
                <Field label="每周阅读">
                  <GoalInput value={draft.weeklyReadingMinutes} onChange={(value) => updateDraft(language.id, "weeklyReadingMinutes", value, setDrafts)} />
                </Field>
              </div>
            </div>
          );
        })}
        {languages.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">先添加一种目标语言。</p>}
      </div>
      <Button
        className="mt-4 w-full sm:w-auto"
        disabled={languages.length === 0}
        onClick={async () => {
          try {
            await Promise.all(
              languages.map((language) => {
                const savedGoal = goalsByLanguage.get(language.id);
                const goal = savedGoal ?? createDefaultGoal(language.id);
                const draft = drafts[language.id] ?? toGoalDraft(goal);
                return upsertGoal({
                  id: savedGoal?.id,
                  languageId: language.id,
                  ...draft
                });
              })
            );
            await invalidate();
            void syncWithSupabase().catch((error) => {
              toast.error(error instanceof Error ? error.message : "云同步失败");
            });
            toast.success("目标已保存");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "目标保存失败");
          }
        }}
      >
        <Save className="h-4 w-4" />
        保存目标
      </Button>
    </section>
  );
}

function goalForLanguage(language: TargetLanguage, goalsByLanguage: Map<string | null | undefined, GoalSettings>) {
  return goalsByLanguage.get(language.id) ?? createDefaultGoal(language.id);
}

function toGoalDraft(goal: GoalSettings): GoalDraft {
  return {
    dailyListeningMinutes: goal.dailyListeningMinutes,
    dailyReadingMinutes: goal.dailyReadingMinutes,
    weeklyListeningMinutes: goal.weeklyListeningMinutes,
    weeklyReadingMinutes: goal.weeklyReadingMinutes
  };
}

function updateDraft(
  languageId: string,
  key: keyof GoalDraft,
  value: number,
  setDrafts: React.Dispatch<React.SetStateAction<Record<string, GoalDraft>>>
) {
  setDrafts((current) => ({
    ...current,
    [languageId]: {
      ...(current[languageId] ?? toGoalDraft(createDefaultGoal(languageId))),
      [key]: value
    }
  }));
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
