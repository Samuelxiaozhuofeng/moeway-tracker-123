"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { progressUnitNoun } from "@/lib/progress/units";
import type { WorkProgressMode } from "@/types/domain";

interface SessionRangeFieldsProps {
  enabled: boolean;
  progressMode: WorkProgressMode;
  totalUnits?: number;
  unitStart?: number;
  unitEnd?: number;
  unitsCompleted: number;
  allowDuplicateUnits: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onUnitStartChange: (value?: number) => void;
  onUnitEndChange: (value?: number) => void;
  onAllowDuplicateUnitsChange: (value: boolean) => void;
}

export function SessionRangeFields({
  enabled,
  progressMode,
  totalUnits,
  unitStart,
  unitEnd,
  unitsCompleted,
  allowDuplicateUnits,
  onEnabledChange,
  onUnitStartChange,
  onUnitEndChange,
  onAllowDuplicateUnitsChange
}: SessionRangeFieldsProps) {
  const unitNoun = progressUnitNoun(progressMode);

  return (
    <div className="grid gap-3 rounded-2xl border border-white/[0.08] p-3">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={enabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
        />
        连续{unitNoun}补录
      </label>

      {enabled && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={`起始${unitNoun}`}>
              <Input
                type="number"
                min={1}
                max={totalUnits}
                value={unitStart ?? ""}
                onChange={(event) => onUnitStartChange(optionalNumber(event.target.value))}
              />
            </Field>
            <Field label={`结束${unitNoun}`}>
              <Input
                type="number"
                min={1}
                max={totalUnits}
                value={unitEnd ?? ""}
                onChange={(event) => onUnitEndChange(optionalNumber(event.target.value))}
              />
            </Field>
            <Field label="完成数量">
              <Input value={unitsCompleted} readOnly />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={allowDuplicateUnits}
              onChange={(event) => onAllowDuplicateUnitsChange(event.target.checked)}
            />
            允许重复补录已完成进度
          </label>
        </>
      )}
    </div>
  );
}

function optionalNumber(value: string) {
  return value === "" ? undefined : Number(value);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
