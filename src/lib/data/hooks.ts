"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listLanguages } from "@/lib/db/languages";
import { listGoals } from "@/lib/db/settings";
import { listSessions } from "@/lib/db/sessions";
import { listVocabulary } from "@/lib/db/vocabulary";
import { getWork, listWorks } from "@/lib/db/works";
import type { ImmersionKind, WorkStatus } from "@/types/domain";

export const queryKeys = {
  languages: ["languages"] as const,
  goals: ["goals"] as const,
  work: (id?: string) => ["work", id] as const,
  works: (filters?: unknown) => ["works", filters] as const,
  sessions: (filters?: unknown) => ["sessions", filters] as const,
  vocabulary: (languageId?: string) => ["vocabulary", languageId] as const
};

export function useLanguages() {
  return useQuery({ queryKey: queryKeys.languages, queryFn: listLanguages });
}

export function useGoals() {
  return useQuery({ queryKey: queryKeys.goals, queryFn: listGoals });
}

export function useWorks(filters?: { languageId?: string; kind?: ImmersionKind; status?: WorkStatus }) {
  return useQuery({ queryKey: queryKeys.works(filters), queryFn: () => listWorks(filters) });
}

export function useWork(id?: string) {
  return useQuery({ queryKey: queryKeys.work(id), queryFn: () => getWork(id), enabled: Boolean(id) });
}

export function useSessions(filters?: { languageId?: string; kind?: ImmersionKind; workId?: string; from?: string; to?: string }) {
  return useQuery({ queryKey: queryKeys.sessions(filters), queryFn: () => listSessions(filters) });
}

export function useVocabulary(languageId?: string) {
  return useQuery({ queryKey: queryKeys.vocabulary(languageId), queryFn: () => listVocabulary(languageId) });
}

export function useInvalidateData() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.languages }),
      queryClient.invalidateQueries({ queryKey: ["work"] }),
      queryClient.invalidateQueries({ queryKey: ["works"] }),
      queryClient.invalidateQueries({ queryKey: ["sessions"] }),
      queryClient.invalidateQueries({ queryKey: ["vocabulary"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.goals })
    ]);
}

export function useDataMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  successMessage?: string
) {
  const invalidate = useInvalidateData();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await invalidate();
      if (successMessage) toast.success(successMessage);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "操作失败")
  });
}
