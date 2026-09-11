-- =====================================================================
-- Migration: CQA importance as percentage (0-100) instead of
-- high/medium/low text; add Design of Experiments (DOE) module.
-- =====================================================================

-- --- CQA importance -> percentage ------------------------------------
alter table cqa add column if not exists importance_pct integer;

update cqa set importance_pct = case importance
  when 'high' then 90
  when 'medium' then 60
  when 'low' then 30
  else 50
end
where importance_pct is null;

alter table cqa alter column importance_pct set default 50;
alter table cqa alter column importance_pct set not null;
alter table cqa add constraint cqa_importance_pct_range check (importance_pct between 0 and 100);

alter table cqa drop column if exists importance;
alter table cqa rename column importance_pct to importance;

-- --- Design of Experiments (DOE) --------------------------------------
-- Flexible schema: factors/runs stored as JSONB so any number of
-- factor columns and run rows can be captured (Box-Behnken, D-Optimal,
-- Mixture design, CCD, etc.) without needing dynamic SQL columns.
create table if not exists doe_designs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  design_name text not null,
  design_type text,                     -- e.g. 'D-Optimal', 'Box-Behnken', 'Mixture (SLD)', 'CCD'
  response_variable text,               -- what's being optimized, e.g. 'Particle size, PDI'
  factors jsonb not null default '[]',  -- [{ "name": "Soy phosphatidylcholine (%)", "unit": "%" }, ...]
  runs jsonb not null default '[]',     -- [{ "run": 1, "values": { "Soy phosphatidylcholine (%)": "5.009", ... } }, ...]
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_doe_project on doe_designs(project_id);

alter table doe_designs enable row level security;

create policy doe_designs_select on doe_designs for select
  using (is_project_owner(project_id) or current_role_name() in ('reviewer','super_admin'));
create policy doe_designs_insert on doe_designs for insert
  with check (is_project_owner(project_id) or current_role_name() = 'super_admin');
create policy doe_designs_update on doe_designs for update
  using (is_project_owner(project_id) or current_role_name() = 'super_admin');
create policy doe_designs_delete on doe_designs for delete
  using (is_project_owner(project_id) or current_role_name() = 'super_admin');

create trigger trg_doe_designs_updated_at
  before update on doe_designs
  for each row execute function set_updated_at();
