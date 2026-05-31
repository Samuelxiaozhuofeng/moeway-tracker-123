"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ImmersionKind } from "@/types/domain";

export interface TimerDraft {
  languageId: string;
  kind: ImmersionKind;
  workId?: string | null;
  workTitle?: string;
}

interface ActiveTimer extends TimerDraft {
  startedAt?: string;
  pausedAt?: string;
  accumulatedSeconds: number;
  status: "idle" | "running" | "paused";
}

interface TimerState {
  timer: ActiveTimer | null;
  startTimer: (draft: TimerDraft) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      timer: null,
      startTimer: (draft) =>
        set({
          timer: {
            ...draft,
            startedAt: new Date().toISOString(),
            accumulatedSeconds: 0,
            status: "running"
          }
        }),
      pauseTimer: () => {
        const timer = get().timer;
        if (!timer || timer.status !== "running" || !timer.startedAt) return;
        const elapsed = Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000);
        set({
          timer: {
            ...timer,
            startedAt: undefined,
            pausedAt: new Date().toISOString(),
            accumulatedSeconds: timer.accumulatedSeconds + elapsed,
            status: "paused"
          }
        });
      },
      resumeTimer: () => {
        const timer = get().timer;
        if (!timer || timer.status !== "paused") return;
        set({
          timer: {
            ...timer,
            startedAt: new Date().toISOString(),
            pausedAt: undefined,
            status: "running"
          }
        });
      },
      resetTimer: () => set({ timer: null })
    }),
    { name: "immerselog-active-timer" }
  )
);

export function getTimerSeconds(timer: ActiveTimer | null) {
  if (!timer) return 0;
  if (timer.status !== "running" || !timer.startedAt) return timer.accumulatedSeconds;
  return timer.accumulatedSeconds + Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000);
}
