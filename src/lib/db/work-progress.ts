import { getDb } from "@/lib/db/database";
import { getSessionUnitNumbers, normalizeUnitNumbers } from "@/lib/progress/units";

export async function listCompletedUnitNumbers(workId: string, excludingSessionId?: string) {
  const sessions = await getDb().sessions.where("workId").equals(workId).toArray();
  const unitNumbers = sessions
    .filter((session) => !session.deletedAt)
    .filter((session) => session.id !== excludingSessionId)
    .flatMap((session) => getSessionUnitNumbers(session));

  return normalizeUnitNumbers(unitNumbers);
}
