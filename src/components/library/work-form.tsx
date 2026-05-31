"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WorkStructureFields } from "@/components/library/work-structure-fields";
import { WorkSearchBox } from "@/components/library/work-search-box";
import { createWork, updateWork, type WorkInput } from "@/lib/db/works";
import { useDataMutation, useLanguages } from "@/lib/data/hooks";
import { defaultProgressModeForKind } from "@/lib/progress/units";
import type { LibraryWork, WorkFormat, WorkProgressMode, WorkSearchResult, WorkStatus } from "@/types/domain";
import { workFormatLabels, workStatusLabels } from "@/types/domain";

const optionalPositiveInt = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce.number().int().min(1).optional()
);

const optionalUnitCount = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce.number().int().min(0).optional()
);

const workSchema = z.object({
  title: z.string().min(1, "请输入作品名"),
  originalTitle: z.string().optional(),
  languageId: z.string().min(1, "请选择语言"),
  kind: z.enum(["listening", "reading"]),
  format: z.enum(["anime", "podcast", "youtube", "manga", "light_novel", "web_novel", "book", "other"]),
  status: z.enum(["planned", "active", "completed", "dropped"]),
  coverUrl: z.string().url("封面需要是 URL").optional().or(z.literal("")),
  totalUnits: optionalUnitCount,
  completedUnits: z.coerce.number().int().min(0).default(0),
  averageCleanMinutes: z.coerce.number().int().min(1).default(21),
  progressMode: z.enum(["episodes", "chapters", "pages"]),
  seasonCount: optionalPositiveInt,
  seasonLabel: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  externalSource: z.enum(["jikan", "anilist", "manual"]).default("manual"),
  externalId: z.string().optional()
}).superRefine((values, context) => {
  if (values.totalUnits !== undefined && values.completedUnits > values.totalUnits) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["completedUnits"],
      message: "已完成不能超过总数"
    });
  }
});

type WorkFormValues = z.infer<typeof workSchema>;

export function WorkForm({ work, onDone }: { work?: LibraryWork; onDone?: () => void }) {
  const { data: languages = [] } = useLanguages();
  const form = useForm<WorkFormValues>({
    resolver: zodResolver(workSchema),
    defaultValues: {
      title: work?.title ?? "",
      originalTitle: work?.originalTitle ?? "",
      languageId: work?.languageId ?? languages[0]?.id ?? "lang_ja",
      kind: work?.kind ?? "listening",
      format: work?.format ?? "anime",
      status: work?.status ?? "active",
      coverUrl: work?.coverUrl ?? "",
      totalUnits: work?.totalUnits ?? 12,
      completedUnits: work?.completedUnits ?? 0,
      averageCleanMinutes: work?.averageCleanMinutes ?? 21,
      progressMode: work?.progressMode ?? defaultProgressModeForKind(work?.kind ?? "listening"),
      seasonCount: work?.seasonCount,
      seasonLabel: work?.seasonLabel ?? "",
      description: work?.description ?? "",
      notes: work?.notes ?? "",
      externalSource: work?.externalSource ?? "manual",
      externalId: work?.externalId ?? ""
    }
  });

  useEffect(() => {
    if (!work && languages[0]?.id) form.setValue("languageId", languages[0].id);
  }, [form, languages, work]);

  const kind = form.watch("kind");
  const format = form.watch("format");
  const progressMode = form.watch("progressMode");

  useEffect(() => {
    if (kind === "listening" && progressMode !== "episodes") form.setValue("progressMode", "episodes");
    if (kind === "reading" && progressMode === "episodes") form.setValue("progressMode", "chapters");
  }, [form, kind, progressMode]);

  const mutation = useDataMutation(async (values: WorkFormValues) => {
    const input: WorkInput = {
      ...values,
      coverUrl: values.coverUrl || undefined,
      totalUnits: values.totalUnits || undefined,
      seasonCount: values.seasonCount || undefined,
      seasonLabel: values.seasonLabel || undefined,
      externalId: values.externalId || undefined
    };
    return work ? updateWork(work.id, input) : createWork(input);
  }, work ? "作品已更新" : "作品已加入作品架");

  const previewCover = form.watch("coverUrl");
  const title = form.watch("title");
  const completedUnits = form.watch("completedUnits");
  const averageCleanMinutes = form.watch("averageCleanMinutes");
  const historyMinutes = useMemo(() => completedUnits * averageCleanMinutes, [averageCleanMinutes, completedUnits]);

  function applySearchResult(result: WorkSearchResult) {
    form.setValue("title", result.title);
    form.setValue("originalTitle", result.originalTitle ?? "");
    form.setValue("kind", result.kind);
    form.setValue("format", result.format);
    form.setValue("progressMode", defaultProgressModeForKind(result.kind));
    form.setValue("coverUrl", result.coverUrl ?? "");
    form.setValue("totalUnits", result.totalUnits ?? 12);
    form.setValue("averageCleanMinutes", result.averageMinutes ?? (result.kind === "listening" ? 21 : 8));
    form.setValue("description", result.description ?? "");
    form.setValue("externalSource", result.source);
    form.setValue("externalId", result.externalId);
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values, { onSuccess: onDone }))}
    >
      <WorkSearchBox onSelect={applySearchResult} />

      <div className="grid grid-cols-[5.5rem_1fr] gap-4">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-white/[0.06]">
          {previewCover ? <Image src={previewCover} alt={title || "封面"} fill className="object-cover" /> : null}
        </div>
        <div className="grid gap-3">
          <Field label="作品名" error={form.formState.errors.title?.message}>
            <Input {...form.register("title")} placeholder="例如：ゆるキャン△" />
          </Field>
          <Field label="原名">
            <Input {...form.register("originalTitle")} placeholder="可选" />
          </Field>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="语言">
          <Select value={form.watch("languageId")} onValueChange={(value) => form.setValue("languageId", value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {languages.map((language) => <SelectItem key={language.id} value={language.id}>{language.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="类型">
          <Select value={kind} onValueChange={(value) => form.setValue("kind", value as WorkFormValues["kind"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="listening">听力</SelectItem>
              <SelectItem value="reading">阅读</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="媒介">
          <Select value={format} onValueChange={(value) => form.setValue("format", value as WorkFormat)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(workFormatLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="状态">
          <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value as WorkStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(workStatusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <WorkStructureFields
        values={{
          kind,
          format,
          progressMode: progressMode as WorkProgressMode,
          totalUnits: form.watch("totalUnits"),
          completedUnits,
          averageCleanMinutes,
          seasonCount: form.watch("seasonCount"),
          seasonLabel: form.watch("seasonLabel")
        }}
        onChange={(field, value) => {
          if (field === "progressMode") form.setValue("progressMode", value as WorkProgressMode, { shouldDirty: true, shouldValidate: true });
          if (field === "totalUnits") form.setValue("totalUnits", value as number | undefined, { shouldDirty: true, shouldValidate: true });
          if (field === "completedUnits") form.setValue("completedUnits", value as number, { shouldDirty: true, shouldValidate: true });
          if (field === "averageCleanMinutes") form.setValue("averageCleanMinutes", value as number, { shouldDirty: true, shouldValidate: true });
          if (field === "seasonCount") form.setValue("seasonCount", value as number | undefined, { shouldDirty: true, shouldValidate: true });
          if (field === "seasonLabel") form.setValue("seasonLabel", value as string | undefined, { shouldDirty: true, shouldValidate: true });
        }}
      />

      {!work && completedUnits > 0 && (
        <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
          <Sparkles className="mr-2 inline h-4 w-4" />
          将自动导入约 {historyMinutes} 分钟历史沉浸时间。
        </div>
      )}

      <Field label="封面 URL">
        <Input {...form.register("coverUrl")} placeholder="https://..." />
      </Field>
      <Field label="简介">
        <Textarea {...form.register("description")} placeholder="可选" />
      </Field>
      <Field label="笔记">
        <Textarea {...form.register("notes")} placeholder="适合写版本、字幕、阅读顺序等" />
      </Field>

      <Button disabled={mutation.isPending} size="lg">
        {mutation.isPending ? "保存中..." : work ? "保存作品" : "加入作品架"}
      </Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
