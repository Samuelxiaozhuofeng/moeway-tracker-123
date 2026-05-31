"use client";

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

type AuthState =
  | { status: "loading"; session: null; error: null }
  | { status: "missing-env"; session: null; error: null }
  | { status: "signed-out"; session: null; error: null }
  | { status: "signed-in"; session: Session; error: null }
  | { status: "error"; session: null; error: Error };

export function useSupabaseSession(): AuthState & { supabase: SupabaseClient | null } {
  const supabase = getSupabaseClient();
  const [state, setState] = useState<AuthState>({ status: "loading", session: null, error: null });

  useEffect(() => {
    if (!supabase) {
      setState({ status: "missing-env", session: null, error: null });
      return;
    }

    let active = true;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setState({ status: "error", session: null, error });
          return;
        }
        setState(sessionState(data.session));
      })
      .catch((error) => {
        if (active) setState({ status: "error", session: null, error: normalizeError(error) });
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(sessionState(session));
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  return { ...state, supabase };
}

function sessionState(session: Session | null): AuthState {
  return session
    ? { status: "signed-in", session, error: null }
    : { status: "signed-out", session: null, error: null };
}

function normalizeError(error: unknown) {
  return error instanceof Error ? error : new Error("读取登录状态失败。");
}
