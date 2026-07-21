import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseUrl = url;
export const supabaseAnonKey = anonKey;

/**
 * Supabase включается только при заданных переменных окружения.
 * Без них приложение работает в чистом local-first режиме.
 */
export const isSupabaseEnabled = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseEnabled
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/** Таблица, где хранится всё пользовательское состояние (jsonb). */
export const STATE_TABLE = "studyfy_state";
