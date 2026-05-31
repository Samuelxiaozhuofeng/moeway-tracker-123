"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { WorkSearchResult } from "@/types/domain";

const SEARCH_DEBOUNCE_MS = 350;

function normalizeSearchQuery(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function useWorkSearch() {
  const [draftQuery, setDraftQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedDraftQuery = useMemo(() => normalizeSearchQuery(draftQuery), [draftQuery]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchQuery(normalizedDraftQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [normalizedDraftQuery]);

  const search = useQuery({
    queryKey: ["media-search", searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const json = (await response.json()) as { results: WorkSearchResult[] };

      if (!response.ok) {
        throw new Error("搜索失败。");
      }

      return json.results;
    },
    enabled: searchQuery.length > 1
  });

  function submitSearch() {
    setSearchQuery(normalizedDraftQuery);

    if (normalizedDraftQuery.length > 1 && normalizedDraftQuery === searchQuery) {
      void search.refetch();
    }
  }

  return {
    draftQuery,
    setDraftQuery,
    isSearchable: normalizedDraftQuery.length > 1,
    search,
    submitSearch
  };
}
