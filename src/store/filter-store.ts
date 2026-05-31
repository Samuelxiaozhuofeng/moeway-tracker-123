"use client";

import { create } from "zustand";
import type { ImmersionKind, TimeRange } from "@/types/domain";

interface FilterState {
  languageId?: string;
  kind?: ImmersionKind;
  range: TimeRange;
  setLanguage: (languageId?: string) => void;
  setKind: (kind?: ImmersionKind) => void;
  setRange: (range: TimeRange) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  range: "30d",
  setLanguage: (languageId) => set({ languageId }),
  setKind: (kind) => set({ kind }),
  setRange: (range) => set({ range })
}));
