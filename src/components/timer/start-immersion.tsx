"use client";

import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActivities, useLanguages, useWorks } from "@/lib/data/hooks";
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
  const [activityId, setActivityId] = useState("none");
  const [workId, setWorkId] = useState("none");
  const selectedLanguageId = languages.some((language) => language.id === languageId)
    ? languageId
    : languages[0]?.id;
  const { data: activities = [] } = useActivities();
  const { data: works = [] } = useWorks({ languageId: selectedLanguageId, kind });
  const startTimer = useTimerStore((state) => state.startTimer);

  useEffect(() => {
    if (workId === "none" || works.some((work) => work.id === workId)) return;
    setWorkId("none");
  }, [workId, works]);

  useEffect(() => {
    if (activityId === "none" || activities.some((activity) => activity.id === activityId)) return;
    setActivityId("none");
  }, [activities, activityId]);

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

  const selectedActivity = activities.find((activity) => activity.id === activityId);
  const selectedWork = works.find((work) => work.id === workId);

  return (
    <section className={compact ? "grid gap-3" : "surface grid gap-4 rounded-[2rem] p-5 sm:p-6"}>
      {!compact && (
        <div>
          <p className="text-sm text-muted-foreground">开始沉浸</p>
          <h2 className="mt-1 text-2xl font-semibold">现在就记一段</h2>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
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
        <Select
          value={activityId}
          onValueChange={(value) => {
            const activity = activities.find((item) => item.id === value);
            setActivityId(value);
            if (!activity) return;
            if (activity.languageId) setLanguageId(activity.languageId);
            setKind(activity.kind);
            setWorkId("none");
          }}
        >
          <SelectTrigger><SelectValue placeholder="选择活动" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">不使用活动</SelectItem>
            {activities.map((activity) => <SelectItem key={activity.id} value={activity.id}>{activity.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select
          value={workId}
          onValueChange={(value) => {
            setWorkId(value);
            if (value !== "none") setActivityId("none");
          }}
        >
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
            activityId: selectedActivity?.id ?? null,
            workId: selectedWork?.id ?? null,
            workTitle: selectedWork?.title ?? selectedActivity?.name
          });
        }}
      >
        <Play className="h-5 w-5" />
        开始沉浸
      </Button>
    </section>
  );
}
