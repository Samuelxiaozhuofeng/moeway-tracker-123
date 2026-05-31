"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LanguageDeleteDialog } from "@/components/app/language-delete-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createLanguage, deleteLanguage, getLanguageUsageSummary, type LanguageUsageSummary } from "@/lib/db/languages";
import { useInvalidateData, useLanguages } from "@/lib/data/hooks";
import { syncWithSupabase } from "@/lib/supabase/sync";
import type { TargetLanguage } from "@/types/domain";

export function LanguageSettings() {
  const { data: languages = [] } = useLanguages();
  const invalidate = useInvalidateData();
  const [name, setName] = useState("");
  const [pendingDeletion, setPendingDeletion] = useState<{
    language: TargetLanguage;
    usage: LanguageUsageSummary;
  }>();
  const [isDeleting, setIsDeleting] = useState(false);
  const canDelete = languages.length > 1;

  return (
    <section className="quiet-panel rounded-[1.5rem] p-4">
      <h2 className="font-semibold">目标语言</h2>
      <div className="mt-3 grid gap-2">
        {languages.map((language) => (
          <div key={language.id} className="flex items-center justify-between rounded-2xl bg-white/[0.045] px-3 py-2">
            <div className="min-w-0 text-sm">
              <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: language.accent }} />
              <span className="font-medium">{language.name}</span>
              {language.nativeName && <span className="ml-2 text-muted-foreground">{language.nativeName}</span>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`删除${language.name}`}
              disabled={!canDelete}
              onClick={async () => {
                try {
                  const usage = await getLanguageUsageSummary(language.id);
                  setPendingDeletion({ language, usage });
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "读取语言使用情况失败");
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="添加自定义语言" />
        <Button
          variant="outline"
          size="icon"
          aria-label="添加语言"
          onClick={async () => {
            if (!name.trim()) return;
            try {
              await createLanguage({ name, code: name.toLowerCase().slice(0, 5), accent: "#f7b267" });
              setName("");
              await invalidate();
              void syncWithSupabase().catch((error) => {
                toast.error(error instanceof Error ? error.message : "云同步失败");
              });
              toast.success("语言已添加");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "语言添加失败");
            }
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <LanguageDeleteDialog
        target={pendingDeletion}
        isDeleting={isDeleting}
        onOpenChange={(open) => !open && setPendingDeletion(undefined)}
        onConfirm={async () => {
          if (!pendingDeletion) return;
          setIsDeleting(true);
          try {
            await deleteLanguage(pendingDeletion.language.id);
            setPendingDeletion(undefined);
            await invalidate();
            void syncWithSupabase().catch((error) => {
              toast.error(error instanceof Error ? error.message : "云同步失败");
            });
            toast.success("语言已删除");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "删除失败");
          } finally {
            setIsDeleting(false);
          }
        }}
      />
    </section>
  );
}
