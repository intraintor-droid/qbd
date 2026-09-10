-- =====================================================================
-- Row Level Security — run after schema.sql
-- Roles: super_admin (manage everything), researcher (own projects only),
--        reviewer (read + review/comment across projects)
-- =====================================================================

create or replace function current_role_name() returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function is_project_owner(p_project_id uuid) returns boolean as $$
  select exists (
    select 1 from projects where id = p_project_id and owner_id = auth.uid()
  );
$$ language sql stable security definer;

-- Enable RLS on every domain table
alter table profiles enable row level security;
alter table projects enable row level security;
alter table apis enable row level security;
alter table api_properties enable row level security;
alter table literature enable row level security;
alter table literature_evidence enable row level security;
alter table qtpp enable row level security;
alter table cqa enable row level security;
alter table cma enable row level security;
alter table cpp enable row level security;
alter table risk_assessments enable row level security;
alter table excipient_compatibility enable row level security;
alter table preformulation_studies enable row level security;
alter table research_notes enable row level security;
alter table references_table enable row level security;
alter table search_history enable row level security;
alter table audit_log enable row level security;

-- PROFILES: everyone can read their own; super_admin reads all
create policy profiles_self_read on profiles for select
  using (id = auth.uid() or current_role_name() = 'super_admin');
create policy profiles_self_update on profiles for update
  using (id = auth.uid() or current_role_name() = 'super_admin');

-- PROJECTS: researcher sees only own; reviewer & super_admin see all
create policy projects_select on projects for select
  using (
    owner_id = auth.uid()
    or current_role_name() in ('reviewer', 'super_admin')
  );
create policy projects_insert on projects for insert
  with check (owner_id = auth.uid());
create policy projects_update on projects for update
  using (owner_id = auth.uid() or current_role_name() = 'super_admin');
create policy projects_delete on projects for delete
  using (owner_id = auth.uid() or current_role_name() = 'super_admin');

-- Generic pattern for project-scoped child tables:
-- readable if you own the parent project, are a reviewer, or super_admin;
-- writable only by the project owner (researcher) or super_admin.
do $$
declare
  tbl text;
  project_fk text;
begin
  for tbl, project_fk in
    select * from (values
      ('apis','project_id'),
      ('literature','project_id'),
      ('qtpp','project_id'),
      ('cqa','project_id'),
      ('cma','project_id'),
      ('cpp','project_id'),
      ('risk_assessments','project_id'),
      ('excipient_compatibility','project_id'),
      ('preformulation_studies','project_id'),
      ('research_notes','project_id'),
      ('references_table','project_id')
    ) as x(tbl, project_fk)
  loop
    execute format(
      'create policy %I_select on %I for select using (is_project_owner(%I) or current_role_name() in (''reviewer'',''super_admin''));',
      tbl, tbl, project_fk
    );
    execute format(
      'create policy %I_write on %I for insert with check (is_project_owner(%I) or current_role_name() = ''super_admin'');',
      tbl, tbl, project_fk
    );
    execute format(
      'create policy %I_update on %I for update using (is_project_owner(%I) or current_role_name() = ''super_admin'');',
      tbl, tbl, project_fk
    );
    execute format(
      'create policy %I_delete on %I for delete using (is_project_owner(%I) or current_role_name() = ''super_admin'');',
      tbl, tbl, project_fk
    );
  end loop;
end $$;

-- api_properties inherits visibility from the parent api's project
create policy api_properties_select on api_properties for select
  using (
    exists (
      select 1 from apis a
      where a.id = api_properties.api_id
        and (is_project_owner(a.project_id) or current_role_name() in ('reviewer','super_admin'))
    )
  );
create policy api_properties_write on api_properties for insert
  with check (
    exists (
      select 1 from apis a
      where a.id = api_properties.api_id
        and (is_project_owner(a.project_id) or current_role_name() = 'super_admin')
    )
  );

-- literature_evidence inherits visibility from parent literature -> project
create policy literature_evidence_select on literature_evidence for select
  using (
    exists (
      select 1 from literature l
      where l.id = literature_evidence.literature_id
        and (is_project_owner(l.project_id) or current_role_name() in ('reviewer','super_admin'))
    )
  );
create policy literature_evidence_write on literature_evidence for insert
  with check (
    exists (
      select 1 from literature l
      where l.id = literature_evidence.literature_id
        and (is_project_owner(l.project_id) or current_role_name() = 'super_admin')
    )
  );
create policy literature_evidence_review on literature_evidence for update
  using (current_role_name() in ('reviewer', 'super_admin') or
    exists (select 1 from literature l where l.id = literature_evidence.literature_id and is_project_owner(l.project_id)));

-- search_history: user sees only their own
create policy search_history_select on search_history for select
  using (user_id = auth.uid() or current_role_name() = 'super_admin');
create policy search_history_insert on search_history for insert
  with check (user_id = auth.uid());

-- audit_log: read-only for super_admin; system inserts via service role (bypasses RLS)
create policy audit_log_select on audit_log for select
  using (current_role_name() = 'super_admin');

-- Auto-create profile row on signup
create or replace function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'researcher');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
