"use client";

import { Heatmap } from "@/components/analytics/heatmap";
import { RatioCharts, TopWorksChart, TrendChart } from "@/components/analytics/charts";
import { KindSelect, LanguageSelect, RangeSelect } from "@/components/app/filters";
import { PageHeader } from "@/components/app/page-header";
import { useLanguages, useSessions, useWorks } from "@/lib/data/hooks";
import { filterSessionsByRange, summarizeDashboard } from "@/lib/stats/metrics";
import { formatHours } from "@/lib/utils/format";
import { useFilterStore } from "@/store/filter-store";

export default function AnalyticsPage() {
  const { data: languages = [] } = useLanguages();
  const { data: works = [] } = useWorks();
  const { data: allSessions = [] } = useSessions();
  const { languageId, kind, range, setLanguage, setKind, setRange } = useFilterStore();
  const filtered = filterSessionsByRange(
    allSessions
      .filter((session) => !languageId || session.languageId === languageId)
      .filter((session) => !kind || session.kind === kind),
    range
  );
  const summary = summarizeDashboard(filtered);

  return (
    <div className="mx-auto grid max-w-6xl gap-5">
      <PageHeader
        eyebrow="Analytics"
        title="统计"
        description="按语言、类型和时间范围看沉浸结构；让长期输入变成可以复盘的轨迹。"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <LanguageSelect languages={languages} value={languageId} onValueChange={setLanguage} />
        <KindSelect value={kind} onValueChange={setKind} />
        <RangeSelect value={range} onValueChange={setRange} />
      </div>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="听力" value={formatHours(summary.totalListeningMinutes)} />
        <Metric label="阅读" value={formatHours(summary.totalReadingMinutes)} />
        <Metric label="连续" value={`${summary.currentStreak} 天`} />
        <Metric label="最长连续" value={`${summary.longestStreak} 天`} />
      </section>
      <TrendChart sessions={filtered} />
      <RatioCharts sessions={filtered} languages={languages} />
      <TopWorksChart sessions={filtered} works={works} />
      <Heatmap sessions={filtered} large />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="quiet-panel rounded-[1.5rem] p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
