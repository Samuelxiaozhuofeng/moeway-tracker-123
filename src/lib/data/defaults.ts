import type { GoalSettings, TargetLanguage, UserSettings } from "@/types/domain";
import { createId } from "@/lib/utils/id";

const now = () => new Date().toISOString();

export function createDefaultLanguages(): TargetLanguage[] {
  return [
    {
      id: "lang_ja",
      code: "ja",
      name: "日语",
      nativeName: "日本語",
      accent: "#77e5cf",
      isCustom: false,
      createdAt: now(),
      updatedAt: now(),
      syncState: "local"
    },
    {
      id: "lang_es",
      code: "es",
      name: "西班牙语",
      nativeName: "Español",
      accent: "#f7b267",
      isCustom: false,
      createdAt: now(),
      updatedAt: now(),
      syncState: "local"
    },
    {
      id: "lang_en",
      code: "en",
      name: "英语",
      nativeName: "English",
      accent: "#c6b6ff",
      isCustom: false,
      createdAt: now(),
      updatedAt: now(),
      syncState: "local"
    }
  ];
}

export function createDefaultGoal(languageId?: string | null): GoalSettings {
  return {
    id: createId("goal"),
    languageId: languageId ?? null,
    dailyListeningMinutes: 60,
    dailyReadingMinutes: 30,
    weeklyListeningMinutes: 420,
    weeklyReadingMinutes: 210,
    createdAt: now(),
    updatedAt: now(),
    syncState: "local"
  };
}

export function createDefaultSettings(): UserSettings {
  return {
    id: "settings_local",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notificationsEnabled: false,
    keepAwakeHintDismissed: false,
    onboardingCompleted: false,
    createdAt: now(),
    updatedAt: now(),
    syncState: "local"
  };
}
