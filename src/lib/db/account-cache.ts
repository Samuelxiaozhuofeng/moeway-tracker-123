import { ensureLocalSeed } from "@/lib/db/seed";
import { getDb } from "@/lib/db/database";

const cacheUserKey = "immerselog:cache-user-id";

export async function prepareLocalCacheForUser(userId: string) {
  const previousUserId = window.localStorage.getItem(cacheUserKey);
  if (previousUserId && previousUserId !== userId) {
    await clearLocalAccountCache();
  }
  window.localStorage.setItem(cacheUserKey, userId);
  await ensureLocalSeed();
}

export async function clearLocalAccountCache() {
  const db = getDb();
  await db.transaction("rw", db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
  });
}

export function forgetLocalCacheUser() {
  window.localStorage.removeItem(cacheUserKey);
}
