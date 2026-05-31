"use client";

import { Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { LanguageSelect } from "@/components/app/filters";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { vocabularyToAnkiCsv } from "@/lib/db/backup";
import { markVocabularyReviewed } from "@/lib/db/vocabulary";
import { useInvalidateData, useLanguages, useVocabulary } from "@/lib/data/hooks";
import { downloadText } from "@/lib/utils/download";
import { useFilterStore } from "@/store/filter-store";

export default function VocabPage() {
  const { data: languages = [] } = useLanguages();
  const { languageId, setLanguage } = useFilterStore();
  const { data: items = [] } = useVocabulary(languageId);
  const invalidate = useInvalidateData();

  return (
    <div className="mx-auto grid max-w-4xl gap-5">
      <PageHeader
        eyebrow="Vocabulary"
        title="生词回顾"
        description="每次记录里的新词和语块会自动聚合在这里，随时导出 Anki CSV。"
        action={
          <Button
            variant="outline"
            onClick={() => downloadText("immerselog-anki.csv", vocabularyToAnkiCsv(items), "text/csv;charset=utf-8")}
          >
            <Download className="h-4 w-4" />
            导出 Anki
          </Button>
        }
      />
      <div className="max-w-xs">
        <LanguageSelect languages={languages} value={languageId} onValueChange={setLanguage} />
      </div>
      <section className="grid gap-2">
        {items.map((item) => (
          <article key={item.id} className="quiet-panel rounded-[1.5rem] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{item.phrase}</h2>
                {(item.reading || item.meaning) && <p className="mt-1 text-sm text-muted-foreground">{item.reading} {item.meaning}</p>}
                {item.context && <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.context}</p>}
                {item.sourceTitle && <p className="mt-2 text-xs text-primary/80">{item.sourceTitle}</p>}
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="标记复习"
                onClick={async () => {
                  await markVocabularyReviewed(item.id);
                  await invalidate();
                  toast.success("已标记复习");
                }}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </article>
        ))}
        {items.length === 0 && <p className="quiet-panel rounded-[1.5rem] py-12 text-center text-sm text-muted-foreground">还没有生词。</p>}
      </section>
    </div>
  );
}
