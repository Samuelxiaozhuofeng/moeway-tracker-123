"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDataMutation } from "@/lib/data/hooks";
import { updateSession } from "@/lib/db/sessions";
import { defaultProgressModeForKind, progressUnitLabel } from "@/lib/progress/units";
import type { ImmersionSession } from "@/types/domain";

export function SessionEditDialog({ session }: { session: ImmersionSession }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(session.date);
  const [minutes, setMinutes] = useState(session.minutes);
  const [units, setUnits] = useState(session.unitsCompleted);
  const [note, setNote] = useState(session.note ?? "");
  const unitLabel = progressUnitLabel(session.progressMode ?? defaultProgressModeForKind(session.kind));
  const mutation = useDataMutation(
    () => updateSession(session.id, { date, minutes, unitsCompleted: units, note }),
    "记录已更新"
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="编辑记录">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑记录</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="日期"><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="分钟"><Input type="number" min={1} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} /></Field>
            <Field label={`完成${unitLabel}`}><Input type="number" min={0} value={units} onChange={(event) => setUnits(Number(event.target.value))} /></Field>
          </div>
          <Field label="笔记"><Textarea value={note} onChange={(event) => setNote(event.target.value)} /></Field>
          <Button
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(undefined, { onSuccess: () => setOpen(false) })}
          >
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
