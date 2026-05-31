"use client";

import { ArrowLeft, Pencil, Play, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { WorkUnitGrid } from "@/components/library/work-unit-grid";
import { RecentRecords } from "@/components/records/recent-records";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WorkDialog } from "@/components/library/work-dialog";
import { useLanguages, useSessions, useWork } from "@/lib/data/hooks";
import { deleteWork } from "@/lib/db/works";
import { getWorkUnitLabel } from "@/lib/progress/units";
import { clampProgress, formatMinutes } from "@/lib/utils/format";
import { useTimerStore } from "@/store/timer-store";
import { kindLabels, workFormatLabels, workStatusLabels } from "@/types/domain";

export default function WorkDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: work } = useWork(params.id);
  const { data: languages = [] } = useLanguages();
  const { data: sessions = [] } = useSessions({ workId: params.id });
  const startTimer = useTimerStore((state) => state.startTimer);

  if (!work) {
    return (
      <div className="mx-auto max-w-3xl">
        <Button asChild variant="ghost">
          <Link href="/library"><ArrowLeft className="h-4 w-4" />返回作品架</Link>
        </Button>
        <p className="mt-10 text-muted-foreground">作品不存在或已删除。</p>
      </div>
    );
  }

  const progress = clampProgress(work.completedUnits, work.totalUnits);
  const minutes = sessions.reduce((sum, session) => sum + session.minutes, 0);
  const unitLabel = getWorkUnitLabel(work);

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <Button asChild variant="ghost" className="w-fit">
        <Link href="/library"><ArrowLeft className="h-4 w-4" />返回作品架</Link>
      </Button>

      <section className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] bg-white/[0.06] shadow-soft">
          {work.coverUrl ? <Image src={work.coverUrl} alt={work.title} fill className="object-cover" priority /> : null}
        </div>
        <div className="flex flex-col justify-between gap-5">
          <div>
            <p className="mb-2 text-sm text-primary">{languages.find((language) => language.id === work.languageId)?.name} · {kindLabels[work.kind]}</p>
            <h1 className="text-4xl font-semibold text-balance">{work.title}</h1>
            {work.originalTitle && <p className="mt-2 text-muted-foreground">{work.originalTitle}</p>}
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-white/[0.06] px-3 py-1">{workFormatLabels[work.format]}</span>
              <span className="rounded-full bg-white/[0.06] px-3 py-1">{workStatusLabels[work.status]}</span>
              <span className="rounded-full bg-white/[0.06] px-3 py-1">{formatMinutes(minutes)}</span>
            </div>
            {work.description && <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">{work.description}</p>}
          </div>

          <div className="quiet-panel rounded-[1.5rem] p-4">
            <div className="mb-3 flex justify-between text-sm">
              <span>{work.completedUnits}/{work.totalUnits ?? "?"} {unitLabel}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="lg"
                onClick={() =>
                  startTimer({
                    languageId: work.languageId,
                    kind: work.kind,
                    workId: work.id,
                    workTitle: work.title
                  })
                }
              >
                <Play className="h-4 w-4" />继续沉浸
              </Button>
              <WorkDialog work={work} trigger={<Button variant="outline" size="lg"><Pencil className="h-4 w-4" />编辑</Button>} />
              <Button
                variant="destructive"
                size="lg"
                onClick={async () => {
                  await deleteWork(work.id);
                  toast.success("作品已删除");
                  router.push("/library");
                }}
              >
                <Trash2 className="h-4 w-4" />删除
              </Button>
            </div>
          </div>
        </div>
      </section>

      {work.notes && (
        <section className="quiet-panel rounded-[1.5rem] p-4">
          <h2 className="mb-2 font-semibold">笔记</h2>
          <p className="text-sm leading-7 text-muted-foreground">{work.notes}</p>
        </section>
      )}

      <WorkUnitGrid work={work} sessions={sessions} />

      <RecentRecords sessions={sessions} languages={languages} limit={8} />
    </div>
  );
}
