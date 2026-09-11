-- =====================================================================
-- Migration 005: project relationship integrity + RLS hardening
-- Run after schema.sql, rls.sql, and migrations 002-004.
--
-- RLS controls WHO can access rows. These triggers additionally control
-- WHETHER linked rows belong to the SAME project, preventing cross-project
-- references even when a caller has access to multiple projects.
-- =====================================================================

create or replace function assert_same_project(parent_project_id uuid, child_project_id uuid, relation_name text)
returns void as $$
begin
  if parent_project_id is null or child_project_id is null then
    return;
  end if;
  if parent_project_id is distinct from child_project_id then
    raise exception 'Cross-project relationship rejected: %', relation_name
      using errcode = '23514';
  end if;
end;
$$ language plpgsql immutable;

create or replace function validate_project_relationships()
returns trigger as $$
declare
  linked_project uuid;
begin
  if tg_table_name = 'literature' then
    if new.api_id is not null then
      select project_id into linked_project from apis where id = new.api_id;
      perform assert_same_project(new.project_id, linked_project, 'literature.api_id');
    end if;

  elsif tg_table_name = 'literature_evidence' then
    select project_id into linked_project from literature where id = new.literature_id;
    if not found then
      raise exception 'Referenced literature does not exist' using errcode = '23503';
    end if;
    perform assert_same_project(linked_project,
      (select project_id from literature where id = new.literature_id),
      'literature_evidence.literature_id');
    if new.api_id is not null then
      select project_id into linked_project from apis where id = new.api_id;
      perform assert_same_project(
        (select project_id from literature where id = new.literature_id),
        linked_project,
        'literature_evidence.api_id'
      );
    end if;

  elsif tg_table_name = 'api_properties' then
    select project_id into linked_project from apis where id = new.api_id;
    if not found then
      raise exception 'Referenced API does not exist' using errcode = '23503';
    end if;

  elsif tg_table_name = 'qtpp' then
    if new.source_evidence_id is not null then
      select l.project_id into linked_project
      from literature_evidence e join literature l on l.id = e.literature_id
      where e.id = new.source_evidence_id;
      perform assert_same_project(new.project_id, linked_project, 'qtpp.source_evidence_id');
    end if;

  elsif tg_table_name = 'cqa' then
    if new.qtpp_id is not null then
      select project_id into linked_project from qtpp where id = new.qtpp_id;
      perform assert_same_project(new.project_id, linked_project, 'cqa.qtpp_id');
    end if;
    if new.evidence_id is not null then
      select l.project_id into linked_project
      from literature_evidence e join literature l on l.id = e.literature_id
      where e.id = new.evidence_id;
      perform assert_same_project(new.project_id, linked_project, 'cqa.evidence_id');
    end if;

  elsif tg_table_name = 'cma' then
    if new.cqa_id is not null then
      select project_id into linked_project from cqa where id = new.cqa_id;
      perform assert_same_project(new.project_id, linked_project, 'cma.cqa_id');
    end if;
    if new.evidence_id is not null then
      select l.project_id into linked_project
      from literature_evidence e join literature l on l.id = e.literature_id
      where e.id = new.evidence_id;
      perform assert_same_project(new.project_id, linked_project, 'cma.evidence_id');
    end if;

  elsif tg_table_name = 'risk_assessments' then
    if new.cma_id is not null then
      select project_id into linked_project from cma where id = new.cma_id;
      perform assert_same_project(new.project_id, linked_project, 'risk_assessments.cma_id');
    end if;
    if new.cqa_id is not null then
      select project_id into linked_project from cqa where id = new.cqa_id;
      perform assert_same_project(new.project_id, linked_project, 'risk_assessments.cqa_id');
    end if;

  elsif tg_table_name = 'excipient_compatibility' then
    select project_id into linked_project from apis where id = new.api_id;
    perform assert_same_project(new.project_id, linked_project, 'excipient_compatibility.api_id');
    if new.evidence_id is not null then
      select l.project_id into linked_project
      from literature_evidence e join literature l on l.id = e.literature_id
      where e.id = new.evidence_id;
      perform assert_same_project(new.project_id, linked_project, 'excipient_compatibility.evidence_id');
    end if;

  elsif tg_table_name = 'preformulation_studies' then
    if new.related_cqa_id is not null then
      select project_id into linked_project from cqa where id = new.related_cqa_id;
      perform assert_same_project(new.project_id, linked_project, 'preformulation_studies.related_cqa_id');
    end if;
    if new.related_cma_id is not null then
      select project_id into linked_project from cma where id = new.related_cma_id;
      perform assert_same_project(new.project_id, linked_project, 'preformulation_studies.related_cma_id');
    end if;
    if new.evidence_id is not null then
      select l.project_id into linked_project
      from literature_evidence e join literature l on l.id = e.literature_id
      where e.id = new.evidence_id;
      perform assert_same_project(new.project_id, linked_project, 'preformulation_studies.evidence_id');
    end if;

  elsif tg_table_name = 'research_notes' then
    if new.literature_id is not null then
      select project_id into linked_project from literature where id = new.literature_id;
      perform assert_same_project(new.project_id, linked_project, 'research_notes.literature_id');
    end if;

  elsif tg_table_name = 'references_table' then
    if new.literature_id is not null then
      select project_id into linked_project from literature where id = new.literature_id;
      perform assert_same_project(new.project_id, linked_project, 'references_table.literature_id');
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

do $$
declare tbl text;
begin
  foreach tbl in array array[
    'literature','literature_evidence','api_properties','qtpp','cqa','cma',
    'risk_assessments','excipient_compatibility','preformulation_studies',
    'research_notes','references_table'
  ] loop
    execute format('drop trigger if exists trg_validate_project_relationships on %I', tbl);
    execute format(
      'create trigger trg_validate_project_relationships before insert or update on %I for each row execute function validate_project_relationships()',
      tbl
    );
  end loop;
end $$;

-- search_history must not be able to point at a project the submitting user
-- cannot access. This protects direct Supabase client writes too.
drop policy if exists search_history_insert on search_history;
create policy search_history_insert on search_history for insert
  with check (
    user_id = auth.uid()
    and (
      project_id is null
      or is_project_owner(project_id)
      or current_role_name() = 'super_admin'
    )
  );

-- Soft-deleted projects are hidden from normal project browsing. super_admin
-- retains visibility for administration/recovery workflows.
drop policy if exists projects_select on projects;
create policy projects_select on projects for select
  using (
    (deleted_at is null and (owner_id = auth.uid() or current_role_name() = 'reviewer'))
    or current_role_name() = 'super_admin'
  );

-- Global reference tables: authenticated users may read them, but only
-- super_admin may modify the shared catalogue/source registry.
alter table literature_sources enable row level security;
drop policy if exists literature_sources_select on literature_sources;
drop policy if exists literature_sources_write on literature_sources;
create policy literature_sources_select on literature_sources for select
  using (auth.uid() is not null);
create policy literature_sources_write on literature_sources for all
  using (current_role_name() = 'super_admin')
  with check (current_role_name() = 'super_admin');

alter table excipients enable row level security;
drop policy if exists excipients_select on excipients;
drop policy if exists excipients_write on excipients;
create policy excipients_select on excipients for select
  using (auth.uid() is not null);
create policy excipients_write on excipients for all
  using (current_role_name() = 'super_admin')
  with check (current_role_name() = 'super_admin');
