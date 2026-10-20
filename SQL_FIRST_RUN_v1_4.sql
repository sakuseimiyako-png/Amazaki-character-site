-- 物語之終幕 v1.4 / SQLは保存してから実行する
-- 既存の記事・管理者3アカウント・プロフィールは消しません。
-- Cloud記事の分類を追加（世界観・関係・都での歴史）。
begin;

alter table public.site_entries
  drop constraint if exists site_entries_category_check;
alter table public.site_entries
  add constraint site_entries_category_check
  check (category in ('item','ability','technique','world','relation','history'));

-- DB管理へ切り替えた区画の記録。最後の記事を削除しても古い文が復活しないために使います。
create table if not exists public.site_section_state (
  section_key text primary key check (section_key in (
    'item:normal','item:awakened',
    'ability:normal','ability:awakened',
    'technique:normal','technique:awakened',
    'world:normal','relation:normal','history:normal'
  )),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.site_section_state enable row level security;

drop policy if exists "amasaki_section_read" on public.site_section_state;
create policy "amasaki_section_read"
  on public.site_section_state for select to anon, authenticated
  using (true);

drop policy if exists "amasaki_section_admin_insert" on public.site_section_state;
create policy "amasaki_section_admin_insert"
  on public.site_section_state for insert to authenticated
  with check (exists (select 1 from public.site_admins
    where user_id = (select auth.uid())));

drop policy if exists "amasaki_section_admin_update" on public.site_section_state;
create policy "amasaki_section_admin_update"
  on public.site_section_state for update to authenticated
  using (exists (select 1 from public.site_admins
    where user_id = (select auth.uid())))
  with check (exists (select 1 from public.site_admins
    where user_id = (select auth.uid())));

revoke all on public.site_section_state from anon, authenticated;
grant select on public.site_section_state to anon, authenticated;
grant insert, update on public.site_section_state to authenticated;

commit;

-- 確認用：site_entries_category_check と site_section_state があれば成功。
select conname from pg_constraint
where conrelid = 'public.site_entries'::regclass
  and conname = 'site_entries_category_check';
select tablename from pg_tables
where schemaname = 'public' and tablename = 'site_section_state';
