"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ImmersionSession, LibraryWork, TargetLanguage } from "@/types/domain";
import { buildKindRatio, buildLanguageRatio, buildTopWorks, buildTrend } from "@/lib/stats/metrics";
import { formatHours } from "@/lib/utils/format";

const tooltipStyle = {
  background: "rgba(21,24,39,0.96)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 14,
  color: "#f9f3e8"
};

export function TrendChart({ sessions }: { sessions: ImmersionSession[] }) {
  const data = buildTrend(sessions, "day");
  return (
    <ChartPanel title="趋势">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#9ba3b8", fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fill: "#9ba3b8", fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}m`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatHours(value)} />
          <Line type="monotone" dataKey="listening" name="听力" stroke="#77e5cf" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="reading" name="阅读" stroke="#c6b6ff" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

export function RatioCharts({ sessions, languages }: { sessions: ImmersionSession[]; languages: TargetLanguage[] }) {
  const kindData = buildKindRatio(sessions);
  const languageData = buildLanguageRatio(sessions, languages);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <PiePanel title="听力 / 阅读" data={kindData} />
      <PiePanel title="语言占比" data={languageData} />
    </div>
  );
}

export function TopWorksChart({ sessions, works }: { sessions: ImmersionSession[]; works: LibraryWork[] }) {
  const data = buildTopWorks(sessions, works).map((item) => ({ ...item, hours: Number((item.minutes / 60).toFixed(1)) }));
  return (
    <ChartPanel title="Top 10 作品">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 12 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
          <XAxis type="number" tick={{ fill: "#9ba3b8", fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="title" tick={{ fill: "#9ba3b8", fontSize: 12 }} tickLine={false} axisLine={false} width={92} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${value}h`} />
          <Bar dataKey="hours" fill="#f7b267" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

function PiePanel({ title, data }: { title: string; data: Array<{ name: string; value: number; fill: string }> }) {
  return (
    <ChartPanel title={title}>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={4}>
            {data.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatHours(value)} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-2">
        {data.map((item) => (
          <span key={item.name} className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-muted-foreground">
            <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
            {item.name} {formatHours(item.value)}
          </span>
        ))}
      </div>
    </ChartPanel>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="quiet-panel rounded-[1.5rem] p-4">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </section>
  );
}
