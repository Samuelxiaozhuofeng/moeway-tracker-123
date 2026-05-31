"use client";

import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { GoalTargetFields } from "@/components/app/goal-target-fields";
import { Button } from "@/components/ui/button";
import { createDefaultGoal } from "@/lib/data/defaults";
import { upsertGoal } from "@/lib/db/settings";
import { useGoals, useInvalidateData, useLanguages } from "@/lib/data/hooks";
import { deriveWeeklyGoalMinutes } from "@/lib/goals/schedule";
import { syncWithSupabase } from "@/lib/supabase/sync";
import type { GoalSettings, TargetLanguage } from "@/types/domain";

interface GoalDraft {
  dailyListeningMinutes: number;
  dailyReadingMinutes: number;
  listeningGoalIntervalDays: number;
  readingGoalIntervalDays: number;
  weeklyListeningMinutes: number;
  weeklyReadingMinutes: number;
}

const emptyGoals: GoalSettings[] = [];
const emptyLanguages: TargetLanguage[] = [];

export function GoalSettingsPanel() {
  const { data: goalData } = useGoals();
  const { data: languageData } = useLanguages();
  const goals = goalData ?? emptyGoals;
  const languages = languageData ?? emptyLanguages;
  const [drafts, setDrafts] = useState<Record<string, GoalDraft>>({});
  const invalidate = useInvalidateData();

  const goalsByLanguage = useMemo(
    () => new Map(goals.map((goal) => [goal.languageId, goal])),
    [goals]
  );

  useEffect(() => {
    const nextDrafts = Object.fromEntries(languages.map((language) => [language.id, toGoalDraft(goalForLanguage(language, goalsByLanguage))]));
    setDrafts((current) => (areGoalDraftsEqual(current, nextDrafts) ? current : nextDrafts));
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
              <div className="mt-3 grid gap-3">
                <GoalTargetFields
                  label="听力"
                  dailyMinutes={draft.dailyListeningMinutes}
                  intervalDays={draft.listeningGoalIntervalDays}
                  weeklyMinutes={draft.weeklyListeningMinutes}
                  onDailyMinutesChange={(value) => updateDraft(language.id, "dailyListeningMinutes", value, setDrafts)}
                  onIntervalDaysChange={(value) => updateDraft(language.id, "listeningGoalIntervalDays", value, setDrafts)}
                />
                <GoalTargetFields
                  label="阅读"
                  dailyMinutes={draft.dailyReadingMinutes}
                  intervalDays={draft.readingGoalIntervalDays}
                  weeklyMinutes={draft.weeklyReadingMinutes}
                  onDailyMinutesChange={(value) => updateDraft(language.id, "dailyReadingMinutes", value, setDrafts)}
                  onIntervalDaysChange={(value) => updateDraft(language.id, "readingGoalIntervalDays", value, setDrafts)}
                />
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
  const draft = {
    dailyListeningMinutes: goal.dailyListeningMinutes,
    dailyReadingMinutes: goal.dailyReadingMinutes,
    listeningGoalIntervalDays: goal.listeningGoalIntervalDays ?? 1,
    readingGoalIntervalDays: goal.readingGoalIntervalDays ?? 1,
    weeklyListeningMinutes: goal.weeklyListeningMinutes,
    weeklyReadingMinutes: goal.weeklyReadingMinutes
  };
  return withDerivedWeeklyMinutes(draft);
}

function updateDraft(
  languageId: string,
  key: keyof GoalDraft,
  value: number,
  setDrafts: React.Dispatch<React.SetStateAction<Record<string, GoalDraft>>>
) {
  setDrafts((current) => {
    const draft = {
      ...(current[languageId] ?? toGoalDraft(createDefaultGoal(languageId))),
      [key]: value
    };
    return {
      ...current,
      [languageId]: withDerivedWeeklyMinutes(draft)
    };
  });
}

function withDerivedWeeklyMinutes(draft: GoalDraft): GoalDraft {
  return {
    ...draft,
    weeklyListeningMinutes: deriveWeeklyGoalMinutes(draft.dailyListeningMinutes, draft.listeningGoalIntervalDays),
    weeklyReadingMinutes: deriveWeeklyGoalMinutes(draft.dailyReadingMinutes, draft.readingGoalIntervalDays)
  };
}

function areGoalDraftsEqual(left: Record<string, GoalDraft>, right: Record<string, GoalDraft>) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;

  return rightKeys.every((key) => {
    const leftDraft = left[key];
    const rightDraft = right[key];
    return Boolean(leftDraft) && areGoalDraftEqual(leftDraft, rightDraft);
  });
}

function areGoalDraftEqual(left: GoalDraft, right: GoalDraft) {
  return (
    left.dailyListeningMinutes === right.dailyListeningMinutes &&
    left.dailyReadingMinutes === right.dailyReadingMinutes &&
    left.listeningGoalIntervalDays === right.listeningGoalIntervalDays &&
    left.readingGoalIntervalDays === right.readingGoalIntervalDays &&
    left.weeklyListeningMinutes === right.weeklyListeningMinutes &&
    left.weeklyReadingMinutes === right.weeklyReadingMinutes
  );
}
