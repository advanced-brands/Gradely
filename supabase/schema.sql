create table if not exists public.workspaces (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null
    check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;

revoke all on public.workspaces from anon, public;

grant select, insert, update, delete
  on public.workspaces
  to authenticated;

drop policy if exists "Users can read their own workspace" on public.workspaces;
create policy "Users can read their own workspace"
  on public.workspaces
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own workspace" on public.workspaces;
create policy "Users can create their own workspace"
  on public.workspaces
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own workspace" on public.workspaces;
create policy "Users can update their own workspace"
  on public.workspaces
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own workspace" on public.workspaces;
create policy "Users can delete their own workspace"
  on public.workspaces
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
