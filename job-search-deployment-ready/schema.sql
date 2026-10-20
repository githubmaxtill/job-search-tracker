-- Run in Supabase SQL Editor before enabling cloud sync.
create table if not exists public.workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.workspaces enable row level security;
revoke all on public.workspaces from anon;
grant select, insert, update, delete on public.workspaces to authenticated;
create policy "Users read own workspace" on public.workspaces
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own workspace" on public.workspaces
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own workspace" on public.workspaces
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users delete own workspace" on public.workspaces
for delete to authenticated using ((select auth.uid()) = user_id);
