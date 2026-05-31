import type { GoalSettings, ImmersionSession, TargetLanguage } from "@/types/domain";
import { createDefaultGoal } from "@/lib/data/defaults";
import { formatIsoDate } from "@/lib/utils/format";

export interface LanguageDailyGoalProgress {
  language: TargetLanguage;
  goal: GoalSettings;
  listeningMinutes: number;
  readingMinutes: number;
}

export function buildLanguageDailyGoals(
  sessions: ImmersionSession[],
  languages: TargetLanguage[],
  goals: GoalSettings[],
  date = formatIsoDate()
): LanguageDailyGoalProgress[] {
  const goalsByLanguage = new Map(goals.filter((goal) => !goal.deletedAt).map((goal) => [goal.languageId, goal]));

  return languages
    .filter((language) => !language.deletedAt)
    .map((language) => {
      const todaySessions = sessions.filter((session) => !session.deletedAt && session.languageId === language.id && session.date === date);
      return {
        language,
        goal: goalsByLanguage.get(language.id) ?? createDefaultGoal(language.id),
        listeningMinutes: sumMinutes(todaySessions, "listening"),
        readingMinutes: sumMinutes(todaySessions, "reading")
      };
    });
}

function sumMinutes(sessions: ImmersionSession[], kind: "listening" | "reading") {
  return sessions
    .filter((session) => session.kind === kind)
    .reduce((sum, session) => sum + session.minutes, 0);
}
