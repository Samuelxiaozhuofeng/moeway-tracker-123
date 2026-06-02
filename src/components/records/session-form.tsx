"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ActivityDialog } from "@/components/activities/activity-dialog";
import { Field } from "@/components/records/form-field";
import { SessionRangeFields } from "@/components/records/session-range-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActivities, useDataMutation, useLanguages, useWorks } from "@/lib/data/hooks";
import { createSession } from "@/lib/db/sessions";
import { createVocabularyFromPhrases } from "@/lib/db/vocabulary";
import {
  calculateRangeProgress,
  defaultProgressModeForKind,
  progressUnitLabel,
  resolveWorkProgressMode
} from "@/lib/progress/units";
import { formatIsoDate } from "@/lib/utils/format";
import { splitListText } from "@/lib/utils/text";
import type { ImmersionKind } from "@/types/domain";

const optionalPositiveInt = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce.number().int().min(1).optional()
);

const sessionSchema = z.object({
  date: z.string().min(1),
  languageId: z.string().min(1),
  kind: z.enum(["listening", "reading"]),
  activityId: z.string().optional(),
  workId: z.string().optional(),
  workTitle: z.string().optional(),
  minutes: z.coerce.number().int().min(1, "至少记录 1 分钟"),
  unitsCompleted: z.coerce.number().int().min(0).default(0),
  unitStart: optionalPositiveInt,
  unitEnd: optionalPositiveInt,
  allowDuplicateUnits: z.boolean().default(false),
  note: z.string().optional(),
  phrasesText: z.string().optional()
}).superRefine((values, context) => {
  const hasRangeValue = values.unitStart !== undefined || values.unitEnd !== undefined;
  if (!hasRangeValue) return;
  if (values.unitStart === undefined || values.unitEnd === undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["unitStart"],
      message: "请同时填写起始和结束进度"
    });
    return;
  }
  if (values.unitStart > values.unitEnd) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["unitStart"],
      message: "起始进度不能大于结束进度"
    });
  }
});

type SessionFormValues = z.infer<typeof sessionSchema>;

export function SessionForm({
  defaults,
  onDone
}: {
  defaults?: Partial<SessionFormValues>;
  onDone?: () => void;
}) {
  const { data: languages = [] } = useLanguages();
  const [rangeEnabled, setRangeEnabled] = useState(false);
  const [manualMinutes, setManualMinutes] = useState(false);
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      date: defaults?.date ?? formatIsoDate(),
      languageId: defaults?.languageId ?? languages[0]?.id ?? "lang_ja",
      kind: defaults?.kind ?? "listening",
      activityId: defaults?.activityId ?? "none",
      workId: defaults?.workId ?? "none",
      workTitle: defaults?.workTitle ?? "",
      minutes: defaults?.minutes ?? 25,
      unitsCompleted: defaults?.unitsCompleted ?? 0,
      allowDuplicateUnits: false,
      note: defaults?.note ?? "",
      phrasesText: defaults?.phrasesText ?? ""
    }
  });

  const languageId = form.watch("languageId");
  const kind = form.watch("kind");
  const activityId = form.watch("activityId");
  const { data: activities = [] } = useActivities();
  const { data: works = [] } = useWorks({ languageId, kind });
  const selectedActivity = activities.find((activity) => activity.id === activityId);
  const selectedWork = works.find((work) => work.id === form.watch("workId"));
  const progressMode = selectedWork
    ? resolveWorkProgressMode(selectedWork, selectedWork.kind)
    : defaultProgressModeForKind(kind);
  const unitStart = form.watch("unitStart");
  const unitEnd = form.watch("unitEnd");
  const allowDuplicateUnits = form.watch("allowDuplicateUnits");

  useEffect(() => {
    if (!defaults?.languageId && languages[0]?.id) form.setValue("languageId", languages[0].id);
  }, [defaults?.languageId, form, languages]);

  useEffect(() => {
    if (!selectedWork || !rangeEnabled) return;
    const nextUnit = Math.min(selectedWork.totalUnits ?? selectedWork.completedUnits + 1, selectedWork.completedUnits + 1);
    form.setValue("unitStart", nextUnit, { shouldValidate: true });
    form.setValue("unitEnd", nextUnit, { shouldValidate: true });
    form.setValue("unitsCompleted", 1, { shouldValidate: true });
    form.setValue("minutes", selectedWork.averageCleanMinutes, { shouldValidate: true });
  }, [form, rangeEnabled, selectedWork]);

  useEffect(() => {
    if (!selectedWork || !rangeEnabled) return;
    if (!Number.isInteger(unitStart) || !Number.isInteger(unitEnd) || !unitStart || !unitEnd || unitStart > unitEnd) return;
    const progress = calculateRangeProgress({
      unitStart,
      unitEnd,
      averageCleanMinutes: selectedWork.averageCleanMinutes
    });
    form.setValue("unitsCompleted", progress.unitsCompleted, { shouldValidate: true });
    if (!manualMinutes) form.setValue("minutes", progress.minutes, { shouldValidate: true });
  }, [form, manualMinutes, rangeEnabled, selectedWork, unitEnd, unitStart]);

  const mutation = useDataMutation(async (values: SessionFormValues) => {
    const phrases = splitListText(values.phrasesText);
    const session = await createSession({
      date: values.date,
      languageId: values.languageId,
      kind: values.kind,
      activityId: values.activityId === "none" ? null : values.activityId,
      workId: values.workId === "none" ? null : values.workId,
      workTitle: selectedWork?.title ?? selectedActivity?.name ?? values.workTitle,
      minutes: values.minutes,
      unitsCompleted: values.unitsCompleted,
      progressMode,
      unitStart: rangeEnabled ? values.unitStart : undefined,
      unitEnd: rangeEnabled ? values.unitEnd : undefined,
      allowDuplicateUnits: rangeEnabled ? values.allowDuplicateUnits : undefined,
      note: values.note,
      phrases
    });
    await createVocabularyFromPhrases({
      sessionId: session.id,
      languageId: values.languageId,
      sourceTitle: selectedWork?.title ?? selectedActivity?.name ?? values.workTitle,
      phrases
    });
    return session;
  }, "记录已保存");

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values, { onSuccess: onDone }))}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="日期">
          <Input type="date" {...form.register("date")} />
        </Field>
        <Field label="语言">
          <Select value={languageId} onValueChange={(value) => form.setValue("languageId", value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {languages.map((language) => <SelectItem key={language.id} value={language.id}>{language.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="类型">
          <Select value={kind} onValueChange={(value) => form.setValue("kind", value as ImmersionKind)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="listening">听力</SelectItem>
              <SelectItem value="reading">阅读</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="活动">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Select
            value={activityId}
            onValueChange={(value) => {
              const activity = activities.find((item) => item.id === value);
              form.setValue("activityId", value);
              if (!activity) {
                form.setValue("workTitle", "");
                return;
              }
              if (activity.languageId) form.setValue("languageId", activity.languageId);
              form.setValue("kind", activity.kind);
              form.setValue("minutes", activity.defaultMinutes, { shouldDirty: true, shouldValidate: true });
              form.setValue("workId", "none");
              form.setValue("workTitle", activity.name);
              setManualMinutes(false);
              setRangeEnabled(false);
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">不使用活动</SelectItem>
              {activities.map((activity) => (
                <SelectItem key={activity.id} value={activity.id}>
                  {activity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ActivityDialog />
        </div>
      </Field>

      <Field label="作品">
        <Select
          value={form.watch("workId")}
          onValueChange={(value) => {
            const work = works.find((item) => item.id === value);
            form.setValue("workId", value);
            form.setValue("activityId", "none");
            form.setValue("workTitle", work?.title ?? "");
            setManualMinutes(false);
            setRangeEnabled(false);
          }}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">临时记录</SelectItem>
            {works.map((work) => <SelectItem key={work.id} value={work.id}>{work.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      {form.watch("workId") === "none" && (
        <Field label="临时标题">
          <Input {...form.register("workTitle")} placeholder="例如：YouTube shadowing" />
        </Field>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="分钟">
          <Input
            type="number"
            min={1}
            value={form.watch("minutes")}
            onChange={(event) => {
              setManualMinutes(true);
              form.setValue("minutes", Number(event.target.value), { shouldDirty: true, shouldValidate: true });
            }}
          />
        </Field>
        <Field label={`完成${progressUnitLabel(progressMode)}`}>
          <Input type="number" min={0} disabled={rangeEnabled} {...form.register("unitsCompleted")} />
        </Field>
      </div>

      {selectedWork && (
        <SessionRangeFields
          enabled={rangeEnabled}
          progressMode={progressMode}
          totalUnits={selectedWork.totalUnits}
          unitStart={unitStart}
          unitEnd={unitEnd}
          unitsCompleted={form.watch("unitsCompleted")}
          allowDuplicateUnits={allowDuplicateUnits}
          onEnabledChange={(enabled) => {
            setRangeEnabled(enabled);
            setManualMinutes(false);
          }}
          onUnitStartChange={(value) => form.setValue("unitStart", value, { shouldDirty: true, shouldValidate: true })}
          onUnitEndChange={(value) => form.setValue("unitEnd", value, { shouldDirty: true, shouldValidate: true })}
          onAllowDuplicateUnitsChange={(value) => form.setValue("allowDuplicateUnits", value)}
        />
      )}

      <Field label="笔记">
        <Textarea {...form.register("note")} placeholder="心得、语法点、理解度..." />
      </Field>
      <Field label="新词 / 语块">
        <Textarea {...form.register("phrasesText")} placeholder="一行一个，后续可导出 Anki CSV" />
      </Field>

      <Button disabled={mutation.isPending} size="lg">
        <Save className="h-4 w-4" />
        {mutation.isPending ? "保存中..." : "保存记录"}
      </Button>
    </form>
  );
}
