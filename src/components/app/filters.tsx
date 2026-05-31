"use client";

import type { ImmersionKind, TargetLanguage, TimeRange } from "@/types/domain";
import { kindLabels } from "@/types/domain";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LanguageSelect({
  languages,
  value,
  onValueChange,
  allLabel = "全部语言"
}: {
  languages: TargetLanguage[];
  value?: string;
  onValueChange: (value?: string) => void;
  allLabel?: string;
}) {
  return (
    <Select value={value ?? "all"} onValueChange={(next) => onValueChange(next === "all" ? undefined : next)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {languages.map((language) => (
          <SelectItem key={language.id} value={language.id}>
            {language.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function KindSelect({
  value,
  onValueChange,
  allLabel = "全部类型"
}: {
  value?: ImmersionKind;
  onValueChange: (value?: ImmersionKind) => void;
  allLabel?: string;
}) {
  return (
    <Select value={value ?? "all"} onValueChange={(next) => onValueChange(next === "all" ? undefined : (next as ImmersionKind))}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        <SelectItem value="listening">{kindLabels.listening}</SelectItem>
        <SelectItem value="reading">{kindLabels.reading}</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function RangeSelect({ value, onValueChange }: { value: TimeRange; onValueChange: (value: TimeRange) => void }) {
  return (
    <Select value={value} onValueChange={(next) => onValueChange(next as TimeRange)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7d">近 7 天</SelectItem>
        <SelectItem value="30d">近 30 天</SelectItem>
        <SelectItem value="90d">近 90 天</SelectItem>
        <SelectItem value="1y">近 1 年</SelectItem>
        <SelectItem value="all">全部</SelectItem>
      </SelectContent>
    </Select>
  );
}
