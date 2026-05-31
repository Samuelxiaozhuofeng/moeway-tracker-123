"use client";

import { Library } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { KindSelect, LanguageSelect } from "@/components/app/filters";
import { PageHeader } from "@/components/app/page-header";
import { WorkCard } from "@/components/library/work-card";
import { WorkDialog } from "@/components/library/work-dialog";
import { Button } from "@/components/ui/button";
import { useLanguages, useWorks } from "@/lib/data/hooks";
import { useFilterStore } from "@/store/filter-store";

export default function LibraryPage() {
  const { data: languages = [] } = useLanguages();
  const { languageId, kind, setLanguage, setKind } = useFilterStore();
  const { data: works = [] } = useWorks({ languageId, kind });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Library"
        title="作品架"
        description="把长期沉浸拆成一部部可继续的作品。添加已完成集数时会自动导入历史时长。"
        action={<WorkDialog />}
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
        <LanguageSelect languages={languages} value={languageId} onValueChange={setLanguage} />
        <KindSelect value={kind} onValueChange={setKind} />
      </div>
      {works.length === 0 ? (
        <EmptyState
          icon={Library}
          title="作品架还是空的"
          description="先添加一部正在看的 anime 或 manga。半路开始也没关系，填已完成进度即可。"
          action={<WorkDialog trigger={<Button>添加第一部作品</Button>} />}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {works.map((work) => (
            <WorkCard key={work.id} work={work} language={languages.find((language) => language.id === work.languageId)} />
          ))}
        </div>
      )}
    </div>
  );
}
