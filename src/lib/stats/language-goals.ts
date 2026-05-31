import type { GoalSettings, ImmersionSession, TargetLanguage } from "@/types/domain";
import { createDefaultGoal } from "@/lib/data/defaults";
import { isGoalScheduledOnDate, scheduledGoalMinutesForDate } from "@/lib/goals/schedule";
import { formatIsoDate } from "@/lib/utils/format";

export interface LanguageDailyGoalProgress {
  language: TargetLanguage;
  goal: GoalSettings;
  listeningMinutes: number;
  readingMinutes: number;
  listeningGoalMinutes: number;
  readingGoalMinutes: number;
  isListeningScheduledToday: boolean;
  isReadingScheduledToday: boolean;
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
      const goal = goalsByLanguage.get(language.id) ?? createDefaultGoal(language.id);
      const listeningGoalMinutes = scheduledGoalMinutesForDate(goal.dailyListeningMinutes, goal.listeningGoalIntervalDays ?? 1, date);
      const readingGoalMinutes = scheduledGoalMinutesForDate(goal.dailyReadingMinutes, goal.readingGoalIntervalDays ?? 1, date);
      return {
        language,
        goal,
        listeningMinutes: sumMinutes(todaySessions, "listening"),
        readingMinutes: sumMinutes(todaySessions, "reading"),
        listeningGoalMinutes,
        readingGoalMinutes,
        isListeningScheduledToday: isGoalScheduledOnDate(goal.listeningGoalIntervalDays ?? 1, date),
        isReadingScheduledToday: isGoalScheduledOnDate(goal.readingGoalIntervalDays ?? 1, date)
      };
    });
}

function sumMinutes(sessions: ImmersionSession[], kind: "listening" | "reading") {
  return sessions
    .filter((session) => session.kind === kind)
    .reduce((sum, session) => sum + session.minutes, 0);
}
