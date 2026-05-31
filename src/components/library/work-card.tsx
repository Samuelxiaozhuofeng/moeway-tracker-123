"use client";

import { Clock, Play, StickyNote } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getWorkUnitLabel } from "@/lib/progress/units";
import { clampProgress, formatMinutes, timeAgo } from "@/lib/utils/format";
import { useTimerStore } from "@/store/timer-store";
import type { LibraryWork, TargetLanguage } from "@/types/domain";
import { kindLabels, workStatusLabels } from "@/types/domain";

export function WorkCard({ work, language }: { work: LibraryWork; language?: TargetLanguage }) {
  const startTimer = useTimerStore((state) => state.startTimer);
  const progress = clampProgress(work.completedUnits, work.totalUnits);
  const historicalMinutes = work.completedUnits * work.averageCleanMinutes;
  const unitLabel = getWorkUnitLabel(work);

  return (
    <article className="quiet-panel group grid grid-cols-[5.25rem_1fr] gap-4 rounded-[1.5rem] p-3 transition hover:border-primary/30">
      <Link href={`/library/${work.id}`} className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-white/[0.06]">
        {work.coverUrl ? <Image src={work.coverUrl} alt={work.title} fill className="object-cover transition duration-500 group-hover:scale-105" /> : null}
      </Link>
      <div className="min-w-0">
        <div className="mb-2 flex items-start justify-between gap-2">
          <Link href={`/library/${work.id}`} className="min-w-0">
            <h2 className="line-clamp-2 font-semibold leading-snug">{work.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {language?.name ?? "未设语言"} · {kindLabels[work.kind]} · {workStatusLabels[work.status]}
            </p>
          </Link>
          <Button
            size="icon"
            variant="outline"
            aria-label="继续沉浸"
            onClick={() =>
              startTimer({
                languageId: work.languageId,
                kind: work.kind,
                workId: work.id,
                workTitle: work.title
              })
            }
          >
            <Play className="h-4 w-4" />
          </Button>
        </div>
        <Progress value={progress} className="mb-2" />
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{work.completedUnits}/{work.totalUnits ?? "?"} {unitLabel}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatMinutes(historicalMinutes)}</span>
          <span>{timeAgo(work.lastRecordedAt)}</span>
        </div>
        {work.notes && (
          <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
            <StickyNote className="mr-1 inline h-3.5 w-3.5" />
            {work.notes}
          </p>
        )}
      </div>
    </article>
  );
}
