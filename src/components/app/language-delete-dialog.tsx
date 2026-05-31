"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import type { LanguageUsageSummary } from "@/lib/db/languages";
import type { TargetLanguage } from "@/types/domain";

interface LanguageDeleteDialogProps {
  target?: {
    language: TargetLanguage;
    usage: LanguageUsageSummary;
  };
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function LanguageDeleteDialog({ target, isDeleting, onOpenChange, onConfirm }: LanguageDeleteDialogProps) {
  return (
    <Dialog open={Boolean(target)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>删除{target?.language.name}</DialogTitle>
          <DialogDescription>
            语言会从选择器和目标设置中隐藏；已有作品、记录和生词仍保留在本地与云端历史里。
          </DialogDescription>
        </DialogHeader>
        {target && (
          <div className="grid gap-3">
            <div className="rounded-2xl bg-white/[0.045] p-3 text-sm text-muted-foreground">
              <p>关联作品：{target.usage.works}</p>
              <p>关联记录：{target.usage.sessions}</p>
              <p>关联生词：{target.usage.vocabulary}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button variant="destructive" disabled={isDeleting} onClick={onConfirm}>
                删除语言
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
