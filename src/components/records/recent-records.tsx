"use client";

import { History } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatMinutes, formatShortDate } from "@/lib/utils/format";
import type { ImmersionSession, TargetLanguage } from "@/types/domain";
import { kindLabels } from "@/types/domain";

export function RecentRecords({
  sessions,
  languages,
  limit = 5
}: {
  sessions: ImmersionSession[];
  languages: TargetLanguage[];
  limit?: number;
}) {
  const visible = sessions.slice(0, limit);
  return (
    <section className="quiet-panel rounded-[1.5rem] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">最近记录</h2>
        <Button asChild variant="ghost" size="sm">
          <Link href="/history">
            <History className="h-4 w-4" />
            全部
          </Link>
        </Button>
      </div>
      <div className="grid gap-2">
        {visible.map((session) => (
          <div key={session.id} className="flex items-center justify-between rounded-2xl bg-white/[0.035] px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{session.workTitle ?? kindLabels[session.kind]}</p>
              <p className="text-xs text-muted-foreground">
                {formatShortDate(session.date)} · {languages.find((language) => language.id === session.languageId)?.name ?? "语言"} · {kindLabels[session.kind]}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-primary">{formatMinutes(session.minutes)}</p>
          </div>
        ))}
        {visible.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">还没有记录。</p>}
      </div>
    </section>
  );
}
