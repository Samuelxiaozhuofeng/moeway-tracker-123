"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkSearch } from "@/components/library/use-work-search";
import type { WorkSearchResult } from "@/types/domain";

interface WorkSearchBoxProps {
  onSelect: (result: WorkSearchResult) => void;
}

export function WorkSearchBox({ onSelect }: WorkSearchBoxProps) {
  const { draftQuery, setDraftQuery, isSearchable, search, submitSearch } = useWorkSearch();

  return (
    <div className="grid gap-3">
      <Label htmlFor="ai-search">AI 智能添加</Label>
      <div className="flex gap-2">
        <Input
          id="ai-search"
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitSearch();
            }
          }}
          placeholder="输入中文 / 日文 / 英文作品名"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="搜索"
          disabled={!isSearchable || search.isFetching}
          onClick={submitSearch}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {search.isError && <p className="text-xs text-destructive">搜索失败，请稍后重试。</p>}

      {search.data && search.data.length > 0 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          {search.data.map((result) => (
            <button
              key={`${result.source}-${result.externalId}`}
              type="button"
              onClick={() => onSelect(result)}
              className="quiet-panel w-36 shrink-0 rounded-2xl p-2 text-left transition hover:border-primary/40"
            >
              <div className="relative mb-2 aspect-[3/4] overflow-hidden rounded-xl bg-white/[0.05]">
                {result.coverUrl ? <Image src={result.coverUrl} alt="" fill className="object-cover" /> : null}
              </div>
              <p className="line-clamp-2 text-xs font-medium">{result.title}</p>
              <p className="mt-1 text-[0.68rem] text-muted-foreground">{result.source}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
