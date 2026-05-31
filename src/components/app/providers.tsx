"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { toast, Toaster } from "sonner";
import { ensureLocalSeed } from "@/lib/db/seed";
import { syncWithSupabase } from "@/lib/supabase/sync";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 8_000,
            gcTime: 1000 * 60 * 30,
            refetchOnWindowFocus: false
          }
        }
      }),
    []
  );

  useEffect(() => {
    ensureLocalSeed()
      .then(() => queryClient.invalidateQueries())
      .then(() => syncWithSupabase())
      .then(() => queryClient.invalidateQueries())
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "初始化同步失败");
      });

    const handleOnline = () => {
      syncWithSupabase()
        .then(() => queryClient.invalidateQueries())
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : "联网同步失败");
        });
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        theme="dark"
        richColors
        toastOptions={{
          style: {
            background: "rgba(21, 24, 39, 0.96)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#f9f3e8"
          }
        }}
      />
    </QueryClientProvider>
  );
}
