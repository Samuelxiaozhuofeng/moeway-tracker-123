"use client";

import { motion } from "framer-motion";
import { BookOpen, Flame, Headphones, Library, Trophy } from "lucide-react";
import Link from "next/link";
import { GoalProgress } from "@/components/analytics/goal-progress";
import { Heatmap } from "@/components/analytics/heatmap";
import { PageHeader } from "@/components/app/page-header";
import { RecentRecords } from "@/components/records/recent-records";
import { StartImmersion } from "@/components/timer/start-immersion";
import { Button } from "@/components/ui/button";
import { useLanguages, useSessions, useWorks } from "@/lib/data/hooks";
import { getWorkUnitLabel } from "@/lib/progress/units";
import { milestoneForMinutes, summarizeDashboard } from "@/lib/stats/metrics";
import { formatHours } from "@/lib/utils/format";

export default function HomePage() {
  const { data: sessions = [] } = useSessions();
  const { data: languages = [] } = useLanguages();
  const { data: works = [] } = useWorks();
  const summary = summarizeDashboard(sessions);
  const totalMinutes = summary.totalListeningMinutes + summary.totalReadingMinutes;
  const milestone = milestoneForMinutes(totalMinutes);

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <PageHeader
        eyebrow="ImmerseLog"
        title="浸录"
        description="听 raw anime，读 raw manga / 轻小说。低摩擦记录，让长期沉浸变得看得见。"
        action={
          <Button asChild variant="outline">
            <Link href="/onboarding">初始化</Link>
          </Button>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <StartImmersion />
        </motion.div>
        <div className="grid grid-cols-2 gap-3">
          <SummaryTile icon={<Headphones />} label="总听力" value={formatHours(summary.totalListeningMinutes)} />
          <SummaryTile icon={<BookOpen />} label="总阅读" value={formatHours(summary.totalReadingMinutes)} />
          <SummaryTile icon={<Flame />} label="连续天数" value={`${summary.currentStreak} 天`} />
          <SummaryTile icon={<Trophy />} label="最长连续" value={`${summary.longestStreak} 天`} />
        </div>
      </section>

      {milestone && (
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[1.5rem] border border-accent/25 bg-accent/10 px-5 py-4 text-accent"
        >
          <p className="font-semibold">已跨过 {milestone} 小时里程碑</p>
          <p className="mt-1 text-sm text-accent/85">这种安静的累积，会在某天突然变成“听懂了”。</p>
        </motion.section>
      )}

      <GoalProgress summary={summary} />

      <section className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Heatmap sessions={sessions} />
        <div className="quiet-panel rounded-[1.5rem] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">快捷继续</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/library">
                <Library className="h-4 w-4" />
                作品架
              </Link>
            </Button>
          </div>
          <div className="grid gap-2">
            {works.slice(0, 4).map((work) => (
              <Link key={work.id} href={`/library/${work.id}`} className="rounded-2xl bg-white/[0.035] px-3 py-3 text-sm transition hover:bg-white/[0.06]">
                <span className="line-clamp-1 font-medium">{work.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {work.completedUnits}/{work.totalUnits ?? "?"} {getWorkUnitLabel(work)}
                </span>
              </Link>
            ))}
            {works.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">先添加一部作品。</p>}
          </div>
        </div>
      </section>

      <RecentRecords sessions={sessions} languages={languages} />
    </div>
  );
}

function SummaryTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="quiet-panel rounded-[1.5rem] p-4">
      <div className="mb-3 text-primary [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
