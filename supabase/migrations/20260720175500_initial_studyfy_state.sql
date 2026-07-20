-- ============================================================================
-- Studyfy — схема для клиент-only PWA (Supabase Auth + прямой доступ с RLS).
-- Одна таблица состояния, доступ строго к своей строке через Row Level Security.
-- ============================================================================

create table if not exists public.studyfy_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  nickname text unique,
  updated_at timestamptz not null default now()
);

create index if not exists studyfy_state_updated_idx on public.studyfy_state(updated_at);

alter table public.studyfy_state enable row level security;

drop policy if exists "studyfy_state_select_own" on public.studyfy_state;
create policy "studyfy_state_select_own"
  on public.studyfy_state for select
  using (auth.uid() = user_id);

drop policy if exists "studyfy_state_insert_own" on public.studyfy_state;
create policy "studyfy_state_insert_own"
  on public.studyfy_state for insert
  with check (auth.uid() = user_id);

drop policy if exists "studyfy_state_update_own" on public.studyfy_state;
create policy "studyfy_state_update_own"
  on public.studyfy_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "studyfy_state_delete_own" on public.studyfy_state;
create policy "studyfy_state_delete_own"
  on public.studyfy_state for delete
  using (auth.uid() = user_id);

create or replace function public.studyfy_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists studyfy_state_touch on public.studyfy_state;
create trigger studyfy_state_touch
  before update on public.studyfy_state
  for each row execute function public.studyfy_touch_updated_at();
