"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDataMutation, useLanguages } from "@/lib/data/hooks";
import { createActivity, updateActivity } from "@/lib/db/activities";
import type { ActivityTemplate, ImmersionKind } from "@/types/domain";

const activitySchema = z.object({
  name: z.string().min(1, "请输入活动名称"),
  languageId: z.string().optional(),
  kind: z.enum(["listening", "reading"]),
  defaultMinutes: z.coerce.number().int().min(1, "至少 1 分钟"),
  note: z.string().optional()
});

type ActivityFormValues = z.infer<typeof activitySchema>;

export function ActivityForm({ activity, onDone }: { activity?: ActivityTemplate; onDone?: () => void }) {
  const { data: languages = [] } = useLanguages();
  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      name: activity?.name ?? "",
      languageId: activity?.languageId ?? languages[0]?.id ?? "any",
      kind: activity?.kind ?? "listening",
      defaultMinutes: activity?.defaultMinutes ?? 15,
      note: activity?.note ?? ""
    }
  });

  useEffect(() => {
    if (!activity && languages[0]?.id) form.setValue("languageId", languages[0].id);
  }, [activity, form, languages]);

  const mutation = useDataMutation(async (values: ActivityFormValues) => {
    const input = {
      name: values.name,
      languageId: values.languageId === "any" ? null : values.languageId,
      kind: values.kind,
      defaultMinutes: values.defaultMinutes,
      note: values.note
    };
    return activity ? updateActivity(activity.id, input) : createActivity(input);
  }, activity ? "活动已更新" : "活动已添加");

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values, { onSuccess: onDone }))}>
      <Field label="活动名称" error={form.formState.errors.name?.message}>
        <Input {...form.register("name")} placeholder="例如：Anki / YouTube 听力" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="默认语言">
          <Select value={form.watch("languageId")} onValueChange={(value) => form.setValue("languageId", value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">记录时选择</SelectItem>
              {languages.map((language) => <SelectItem key={language.id} value={language.id}>{language.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="默认类型">
          <Select value={form.watch("kind")} onValueChange={(value) => form.setValue("kind", value as ImmersionKind)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="listening">听力</SelectItem>
              <SelectItem value="reading">阅读</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="默认分钟" error={form.formState.errors.defaultMinutes?.message}>
        <Input type="number" min={1} {...form.register("defaultMinutes")} />
      </Field>
      <Field label="备注">
        <Textarea {...form.register("note")} placeholder="可选，例如使用的牌组、频道或方法" />
      </Field>
      <Button disabled={mutation.isPending} size="lg">
        {mutation.isPending ? "保存中..." : activity ? "保存活动" : "添加活动"}
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
