-- Nickname login support for Supabase Auth email/password accounts.
--
-- Supabase Auth signs in with email/password, so the app resolves a nickname
-- to its email before calling auth.signInWithPassword().

create table if not exists public.studyfy_login_aliases (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null unique,
  email text not null,
  updated_at timestamptz not null default now()
);

create index if not exists studyfy_login_aliases_nickname_idx
  on public.studyfy_login_aliases(nickname);

alter table public.studyfy_login_aliases enable row level security;

drop policy if exists "studyfy_login_aliases_select_own" on public.studyfy_login_aliases;
create policy "studyfy_login_aliases_select_own"
  on public.studyfy_login_aliases for select
  using (auth.uid() = user_id);

drop policy if exists "studyfy_login_aliases_insert_own" on public.studyfy_login_aliases;
create policy "studyfy_login_aliases_insert_own"
  on public.studyfy_login_aliases for insert
  with check (auth.uid() = user_id);

drop policy if exists "studyfy_login_aliases_update_own" on public.studyfy_login_aliases;
create policy "studyfy_login_aliases_update_own"
  on public.studyfy_login_aliases for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "studyfy_login_aliases_delete_own" on public.studyfy_login_aliases;
create policy "studyfy_login_aliases_delete_own"
  on public.studyfy_login_aliases for delete
  using (auth.uid() = user_id);

drop trigger if exists studyfy_login_aliases_touch on public.studyfy_login_aliases;
create trigger studyfy_login_aliases_touch
  before update on public.studyfy_login_aliases
  for each row execute function public.studyfy_touch_updated_at();

create or replace function public.studyfy_resolve_login(login_value text)
returns text
language sql
security definer
set search_path = public
as $$
  select case
    when position('@' in login_value) > 0 then lower(trim(login_value))
    else (
      select email
      from public.studyfy_login_aliases
      where nickname = lower(trim(login_value))
      limit 1
    )
  end;
$$;

revoke all on function public.studyfy_resolve_login(text) from public;
grant execute on function public.studyfy_resolve_login(text) to anon, authenticated;
