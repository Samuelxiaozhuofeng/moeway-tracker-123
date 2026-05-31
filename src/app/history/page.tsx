"use client";

import { Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { KindSelect, LanguageSelect } from "@/components/app/filters";
import { PageHeader } from "@/components/app/page-header";
import { SessionEditDialog } from "@/components/records/session-edit-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteSession } from "@/lib/db/sessions";
import { useInvalidateData, useLanguages, useSessions } from "@/lib/data/hooks";
import { defaultProgressModeForKind, progressUnitLabel } from "@/lib/progress/units";
import { formatMinutes, formatShortDate } from "@/lib/utils/format";
import { useFilterStore } from "@/store/filter-store";
import { kindLabels } from "@/types/domain";

export default function HistoryPage() {
  const { data: languages = [] } = useLanguages();
  const { data: sessions = [] } = useSessions();
  const { languageId, kind, setLanguage, setKind } = useFilterStore();
  const invalidate = useInvalidateData();
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      sessions
        .filter((session) => !languageId || session.languageId === languageId)
        .filter((session) => !kind || session.kind === kind)
        .filter((session) => !query || (session.workTitle ?? session.note ?? "").toLowerCase().includes(query.toLowerCase())),
    [kind, languageId, query, sessions]
  );

  return (
    <div className="mx-auto grid max-w-5xl gap-5">
      <PageHeader eyebrow="History" title="历史记录" description="搜索、编辑或删除记录；统计会根据当前记录自动重新计算。" />
      <div className="grid gap-3 sm:grid-cols-[1fr_11rem_11rem]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索作品或笔记" />
        </div>
        <LanguageSelect languages={languages} value={languageId} onValueChange={setLanguage} />
        <KindSelect value={kind} onValueChange={setKind} />
      </div>
      <section className="quiet-panel rounded-[1.5rem] p-3">
        <div className="grid gap-2">
          {filtered.map((session) => (
            <div key={session.id} className="grid gap-3 rounded-2xl bg-white/[0.035] p-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <p className="truncate font-medium">{session.workTitle ?? kindLabels[session.kind]}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatShortDate(session.date)} · {kindLabels[session.kind]} · {formatMinutes(session.minutes)} · {session.unitsCompleted}{" "}
                  {progressUnitLabel(session.progressMode ?? defaultProgressModeForKind(session.kind))}
                </p>
                {session.note && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{session.note}</p>}
              </div>
              <div className="flex justify-end gap-1">
                <SessionEditDialog session={session} />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="删除记录"
                  onClick={async () => {
                    await deleteSession(session.id);
                    await invalidate();
                    toast.success("记录已删除");
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">没有匹配的记录。</p>}
        </div>
      </section>
    </div>
  );
}
