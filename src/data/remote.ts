import { STATE_TABLE, supabase } from "../lib/supabase";
import type { UserState } from "./types";
import { defaultState } from "./store";

/**
 * Синхронизация UserState с Supabase.
 * Всё состояние хранится в одной jsonb-колонке строки пользователя (RLS).
 */

export async function loadRemoteState(userId: string): Promise<UserState | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(STATE_TABLE)
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data?.state) return null;
  // склеиваем с дефолтом на случай новых полей
  return { ...defaultState(), ...(data.state as Partial<UserState>), authed: true };
}

export async function saveRemoteState(userId: string, state: UserState): Promise<void> {
  if (!supabase) return;
  await supabase.from(STATE_TABLE).upsert(
    {
      user_id: userId,
      state: { ...state, authed: true },
      nickname: state.profile.nickname || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

export async function deleteRemoteState(userId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from(STATE_TABLE).delete().eq("user_id", userId);
}
