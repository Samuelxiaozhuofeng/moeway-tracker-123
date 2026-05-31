"use client";

import { Check } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useInvalidateData } from "@/lib/data/hooks";
import { toggleWorkUnitCompletion } from "@/lib/db/unit-completions";
import { getSessionUnitNumbers, getWorkUnitNoun } from "@/lib/progress/units";
import { cn } from "@/lib/utils/cn";
import type { ImmersionSession, LibraryWork } from "@/types/domain";

export function WorkUnitGrid({ work, sessions }: { work: LibraryWork; sessions: ImmersionSession[] }) {
  const invalidate = useInvalidateData();
  const unitNoun = getWorkUnitNoun(work);
  const completedUnits = new Set(sessions.flatMap((session) => getSessionUnitNumbers(session)));
  const totalUnits = work.totalUnits ?? 0;
  const groups = buildUnitGroups(totalUnits, work.seasonCount);

  const mutation = useMutation({
    mutationFn: (unitNumber: number) => toggleWorkUnitCompletion(work.id, unitNumber),
    onSuccess: async (result) => {
      await invalidate();
      if (result.action === "completed") {
        toast.success(`已记录 ${result.addedUnitNumbers.length} 个${unitNoun}`);
      } else if (result.action === "skipped") {
        toast("该进度已经完成，没有重复增加时间。");
      } else if (result.action === "missing") {
        toast("没有找到可回滚的进度记录。");
      } else {
        toast.success(`已撤销第 ${result.removedUnitNumber} 个${unitNoun}`);
      }
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "进度更新失败")
  });

  return (
    <section className="quiet-panel rounded-[1.5rem] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">{unitNoun}进度</h2>
          {work.seasonLabel && <p className="mt-1 text-xs text-muted-foreground">{work.seasonLabel}</p>}
        </div>
        <p className="text-sm text-muted-foreground">{completedUnits.size}/{work.totalUnits ?? "?"}</p>
      </div>

      {totalUnits > 0 ? (
        <div className="max-h-[26rem] overflow-y-auto pr-1">
          <div className="grid gap-4">
            {groups.map((group, groupIndex) => (
              <div key={group[0]} className="grid gap-2">
                {groups.length > 1 && (
                  <p className="text-xs font-medium text-muted-foreground">
                    {work.seasonCount ? `Season ${groupIndex + 1}` : `${unitNoun} ${group[0]}-${group[group.length - 1]}`}
                  </p>
                )}
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
                  {group.map((unitNumber) => {
                    const completed = completedUnits.has(unitNumber);
                    return (
                      <button
                        key={unitNumber}
                        type="button"
                        aria-pressed={completed}
                        disabled={mutation.isPending}
                        onClick={() => mutation.mutate(unitNumber)}
                        className={cn(
                          "flex h-10 items-center justify-center rounded-xl border text-sm font-medium transition",
                          completed
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-white/[0.08] bg-white/[0.035] text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        {completed ? (
                          <span className="inline-flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" />
                            {unitNumber}
                          </span>
                        ) : unitNumber}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="rounded-2xl bg-white/[0.035] px-3 py-6 text-center text-sm text-muted-foreground">
          填写总{unitNoun}后可在这里逐项勾选。
        </p>
      )}
    </section>
  );
}

function buildUnitGroups(totalUnits: number, seasonCount?: number) {
  const groupSize = seasonCount && seasonCount > 0 ? Math.ceil(totalUnits / seasonCount) : 25;
  const groups: number[][] = [];
  for (let start = 1; start <= totalUnits; start += groupSize) {
    const end = Math.min(totalUnits, start + groupSize - 1);
    groups.push(Array.from({ length: end - start + 1 }, (_, index) => start + index));
  }
  return groups;
}
