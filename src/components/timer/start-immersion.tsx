"use client";

import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguages, useWorks } from "@/lib/data/hooks";
import { useTimerStore } from "@/store/timer-store";
import type { ImmersionKind } from "@/types/domain";

const isDev = process.env.NODE_ENV !== "production";

function debugLanguageSelection(message: string, payload: Record<string, unknown>) {
  if (!isDev) return;
  console.debug(`[StartImmersion] ${message}`, payload);
}

export function StartImmersion({ compact = false }: { compact?: boolean }) {
  const { data: languages = [] } = useLanguages();
  const [languageId, setLanguageId] = useState<string>();
  const [kind, setKind] = useState<ImmersionKind>("listening");
  const [workId, setWorkId] = useState("none");
  const selectedLanguageId = languages.some((language) => language.id === languageId)
    ? languageId
    : languages[0]?.id;
  const { data: works = [] } = useWorks({ languageId: selectedLanguageId, kind });
  const startTimer = useTimerStore((state) => state.startTimer);

  useEffect(() => {
    debugLanguageSelection("language state", {
      requestedLanguageId: languageId,
      selectedLanguageId,
      fallbackApplied: Boolean(languageId && selectedLanguageId !== languageId),
      languages: languages.map((language) => ({
        id: language.id,
        code: language.code,
        name: language.name
      }))
    });
  }, [languageId, languages, selectedLanguageId]);

  const selectedWork = works.find((work) => work.id === workId);

  return (
    <section className={compact ? "grid gap-3" : "surface grid gap-4 rounded-[2rem] p-5 sm:p-6"}>
      {!compact && (
        <div>
          <p className="text-sm text-muted-foreground">开始沉浸</p>
          <h2 className="mt-1 text-2xl font-semibold">现在就记一段</h2>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          value={selectedLanguageId}
          onValueChange={(nextLanguageId) => {
            debugLanguageSelection("language selected", {
              previousLanguageId: selectedLanguageId,
              nextLanguageId
            });
            setLanguageId(nextLanguageId);
          }}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {languages.map((language) => <SelectItem key={language.id} value={language.id}>{language.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={kind} onValueChange={(value) => setKind(value as ImmersionKind)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="listening">听力</SelectItem>
            <SelectItem value="reading">阅读</SelectItem>
          </SelectContent>
        </Select>
        <Select value={workId} onValueChange={setWorkId}>
          <SelectTrigger><SelectValue placeholder="选择作品" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">自由沉浸</SelectItem>
            {works.map((work) => <SelectItem key={work.id} value={work.id}>{work.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button
        size="lg"
        className="h-16 rounded-[1.35rem] text-lg"
        disabled={!selectedLanguageId}
        onClick={() => {
          if (!selectedLanguageId) throw new Error("Cannot start immersion without a selected language.");
          startTimer({
            languageId: selectedLanguageId,
            kind,
            workId: selectedWork?.id ?? null,
            workTitle: selectedWork?.title
          });
        }}
      >
        <Play className="h-5 w-5" />
        开始沉浸
      </Button>
    </section>
  );
}
