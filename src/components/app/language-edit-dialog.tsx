"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TargetLanguage } from "@/types/domain";

interface LanguageEditDialogProps {
  language?: TargetLanguage;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: { name: string; code: string; nativeName?: string; accent: string }) => Promise<void>;
}

export function LanguageEditDialog({ language, isSaving, onOpenChange, onSave }: LanguageEditDialogProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [nativeName, setNativeName] = useState("");
  const [accent, setAccent] = useState("#77e5cf");

  useEffect(() => {
    if (!language) return;
    setName(language.name);
    setCode(language.code);
    setNativeName(language.nativeName ?? "");
    setAccent(language.accent);
  }, [language]);

  return (
    <Dialog open={Boolean(language)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑{language?.name}</DialogTitle>
          <DialogDescription>保存后会同步到云端，并用于作品、记录和目标里的语言显示。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="语言名称">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="语言代码">
            <Input value={code} onChange={(event) => setCode(event.target.value)} />
          </Field>
          <Field label="原文名称">
            <Input value={nativeName} onChange={(event) => setNativeName(event.target.value)} />
          </Field>
          <Field label="颜色">
            <div className="flex gap-2">
              <Input type="color" className="w-14 p-1" value={accent} onChange={(event) => setAccent(event.target.value)} />
              <Input value={accent} onChange={(event) => setAccent(event.target.value)} />
            </div>
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              disabled={isSaving || !name.trim() || !code.trim()}
              onClick={() => onSave({ name, code, nativeName: nativeName.trim() || undefined, accent })}
            >
              保存语言
            </Button>
          </div>
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
