"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getAverageMinutesLabel,
  isSeasonalListeningFormat,
  progressUnitNoun
} from "@/lib/progress/units";
import type { ImmersionKind, WorkFormat, WorkProgressMode } from "@/types/domain";

type WorkStructureValues = {
  kind: ImmersionKind;
  format: WorkFormat;
  progressMode: WorkProgressMode;
  totalUnits?: number;
  completedUnits: number;
  averageCleanMinutes: number;
  seasonCount?: number;
  seasonLabel?: string;
};

type WorkStructureEditableField =
  | "progressMode"
  | "totalUnits"
  | "completedUnits"
  | "averageCleanMinutes"
  | "seasonCount"
  | "seasonLabel";

interface WorkStructureFieldsProps {
  values: WorkStructureValues;
  onChange: <TField extends WorkStructureEditableField>(
    field: TField,
    value: WorkStructureValues[TField]
  ) => void;
}

export function WorkStructureFields({ values, onChange }: WorkStructureFieldsProps) {
  const unitNoun = progressUnitNoun(values.progressMode);
  const showSeasonFields = isSeasonalListeningFormat(values.kind, values.format);

  return (
    <div className="grid gap-3">
      {values.kind === "reading" && (
        <Field label="阅读进度模式">
          <Select
            value={values.progressMode}
            onValueChange={(value) => onChange("progressMode", value as WorkProgressMode)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="chapters">章节</SelectItem>
              <SelectItem value="pages">页数</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      )}

      {showSeasonFields && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="季数">
            <Input
              type="number"
              min={1}
              value={values.seasonCount ?? ""}
              onChange={(event) => onChange("seasonCount", optionalNumber(event.target.value))}
            />
          </Field>
          <Field label="Season 信息">
            <Input
              value={values.seasonLabel ?? ""}
              onChange={(event) => onChange("seasonLabel", event.target.value)}
              placeholder="例如 S2 / Part 1"
            />
          </Field>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={`总${unitNoun}`}>
          <Input
            type="number"
            min={0}
            value={values.totalUnits ?? ""}
            onChange={(event) => onChange("totalUnits", optionalNumber(event.target.value))}
          />
        </Field>
        <Field label={`已完成${unitNoun}`}>
          <Input
            type="number"
            min={0}
            value={values.completedUnits}
            onChange={(event) => onChange("completedUnits", Number(event.target.value))}
          />
        </Field>
        <Field label={getAverageMinutesLabel(values)}>
          <Input
            type="number"
            min={1}
            value={values.averageCleanMinutes}
            onChange={(event) => onChange("averageCleanMinutes", Number(event.target.value))}
          />
        </Field>
      </div>
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
