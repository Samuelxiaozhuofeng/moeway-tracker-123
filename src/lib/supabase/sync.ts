import type { Table } from "dexie";
import { getDb } from "@/lib/db/database";
import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  Achievement,
  GoalSettings,
  ImmersionSession,
  LibraryWork,
  SyncableEntity,
  TargetLanguage,
  UserSettings,
  VocabularyItem
} from "@/types/domain";

type EntityType = "languages" | "goals" | "works" | "sessions" | "vocabulary" | "achievements" | "settings";

interface RemoteEntity {
  id: string;
  entity_type: EntityType;
  payload: SyncableEntity;
  deleted_at: string | null;
  updated_at: string;
}

const entityTypes: EntityType[] = ["languages", "goals", "works", "sessions", "vocabulary", "achievements", "settings"];

export async function syncWithSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, reason: "missing-env" as const };

  const { data: sessionData, error: authError } = await supabase.auth.getSession();
  if (authError) throw authError;
  const user = sessionData.session?.user;
  if (!user) return { ok: false, reason: "signed-out" as const };

  const db = getDb();
  await pushDirtyEntities(user.id);

  const { data, error } = await supabase
    .from("immerselog_entities")
    .select("id, entity_type, payload, deleted_at, updated_at")
    .eq("user_id", user.id);
  if (error) throw error;

  await db.transaction(
    "rw",
    [db.languages, db.goals, db.works, db.sessions, db.vocabulary, db.achievements, db.settings],
    async () => {
      for (const row of (data ?? []) as RemoteEntity[]) {
        await applyRemoteEntity(row);
      }
    }
  );

  return { ok: true as const };
}

async function pushDirtyEntities(userId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  for (const entityType of entityTypes) {
    const table = tableFor(entityType);
    const dirty = await table.where("syncState").anyOf("dirty", "deleted").toArray();
    if (dirty.length === 0) continue;

    const payload = dirty.map((entity) => ({
      id: entity.id,
      user_id: userId,
      entity_type: entityType,
      payload: { ...entity, userId, syncState: "synced" },
      deleted_at: entity.deletedAt ?? null,
      updated_at: entity.updatedAt
    }));

    const { error } = await supabase.from("immerselog_entities").upsert(payload, {
      onConflict: "user_id,entity_type,id"
    });
    if (error) throw error;

    await Promise.all(
      dirty.map((entity) =>
        table.put({
          ...entity,
          userId,
          syncState: "synced"
        })
      )
    );
  }
}

async function applyRemoteEntity(row: RemoteEntity) {
  const table = tableFor(row.entity_type);
  const local = await table.get(row.id);
  if (local && local.syncState === "dirty" && local.updatedAt > row.updated_at) return;
  await table.put({
    ...row.payload,
    id: row.id,
    deletedAt: row.deleted_at,
    updatedAt: row.updated_at,
    syncState: "synced"
  });
}

function tableFor(entityType: "languages"): Table<TargetLanguage, string>;
function tableFor(entityType: "goals"): Table<GoalSettings, string>;
function tableFor(entityType: "works"): Table<LibraryWork, string>;
function tableFor(entityType: "sessions"): Table<ImmersionSession, string>;
function tableFor(entityType: "vocabulary"): Table<VocabularyItem, string>;
function tableFor(entityType: "achievements"): Table<Achievement, string>;
function tableFor(entityType: "settings"): Table<UserSettings, string>;
function tableFor(entityType: EntityType): Table<SyncableEntity, string>;
function tableFor(entityType: EntityType): Table<SyncableEntity, string> {
  return getDb()[entityType] as Table<SyncableEntity, string>;
}
