-- =====================================================================
-- QbD Preformulation Research Assistant — Core Schema
-- Run this in Supabase SQL editor (or via `supabase db push`)
-- =====================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------
create type user_role as enum ('super_admin', 'researcher', 'reviewer');
create type confidence_level as enum ('high', 'medium', 'low');
create type risk_level as enum ('low', 'medium', 'high', 'critical', 'unknown');
create type evidence_source_type as enum (
  'official_database', 'regulatory_guideline', 'peer_reviewed_paper',
  'review_article', 'systematic_review', 'preprint', 'ai_inference'
);
create type review_status as enum ('pending', 'approved', 'rejected', 'needs_revision');

-- ---------------------------------------------------------------------
-- PROFILES (extends auth.users)
-- ---------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  institution text,
  role user_role not null default 'researcher',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- PROJECTS
-- ---------------------------------------------------------------------
create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  research_name text not null,
  research_title text not null,
  researcher_name text,
  institution text,
  target_api text,
  dosage_form text,
  route_of_administration text,
  formulation_objective text,
  therapeutic_target text,
  research_year int,
  notes text,
  status text not null default 'active', -- active | completed | archived
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_projects_owner on projects(owner_id) where deleted_at is null;

-- ---------------------------------------------------------------------
-- APIs (active pharmaceutical ingredients)
-- ---------------------------------------------------------------------
create table apis (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  generic_name text,
  synonyms text[],
  cas_number text,
  pubchem_cid text,
  smiles_canonical text,
  smiles_isomeric text,
  inchi text,
  inchikey text,
  molecular_formula text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_apis_project on apis(project_id);
create index idx_apis_cid on apis(pubchem_cid);

-- ---------------------------------------------------------------------
-- API PROPERTIES (physicochemical, from PubChem or literature)
-- Every row must carry a source — never store a value without one.
-- ---------------------------------------------------------------------
create table api_properties (
  id uuid primary key default gen_random_uuid(),
  api_id uuid not null references apis(id) on delete cascade,
  property_name text not null,          -- e.g. 'molecular_weight', 'xlogp', 'pka', 'solubility'
  property_value text,                  -- 'TIDAK DITEMUKAN' if unavailable — never fabricated
  unit text,
  condition_notes text,                 -- pH, temperature, medium, method, etc.
  is_predicted boolean not null default false, -- true if AI/computational prediction, not experimental
  source_name text not null,            -- e.g. 'PubChem', 'Author et al., 2021'
  source_url text,
  confidence confidence_level default 'medium',
  created_at timestamptz not null default now()
);
create index idx_api_properties_api on api_properties(api_id);

-- ---------------------------------------------------------------------
-- LITERATURE SOURCES (registry of external databases queried)
-- ---------------------------------------------------------------------
create table literature_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,                   -- PubMed, Europe PMC, Crossref, OpenAlex, Semantic Scholar
  base_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- LITERATURE (papers retrieved from external APIs)
-- ---------------------------------------------------------------------
create table literature (
  id uuid primary key default gen_random_uuid(),
  api_id uuid references apis(id) on delete set null,
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  authors text[],
  journal text,
  publication_year int,
  article_type text,                    -- research_article | review | systematic_review | guideline
  doi text,
  url text,
  abstract text,
  is_open_access boolean default false,
  source_id uuid references literature_sources(id),
  external_id text,                     -- PMID / OpenAlex ID / Crossref DOI etc.
  retrieved_at timestamptz not null default now(),
  is_saved boolean not null default false,
  notes text,
  tags text[],
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_literature_api on literature(api_id);
create index idx_literature_project on literature(project_id);
create index idx_literature_doi on literature(doi);

-- ---------------------------------------------------------------------
-- LITERATURE EVIDENCE (extracted claims — Claim -> Value -> Source -> DOI -> Year)
-- ---------------------------------------------------------------------
create table literature_evidence (
  id uuid primary key default gen_random_uuid(),
  literature_id uuid not null references literature(id) on delete cascade,
  api_id uuid references apis(id) on delete cascade,
  parameter text not null,              -- solubility | pKa | logP | melting_point | particle_size | ...
  claim text not null,
  value text,
  unit text,
  condition_notes text,
  confidence confidence_level not null default 'medium',
  source_type evidence_source_type not null default 'peer_reviewed_paper',
  is_ai_inference boolean not null default false,
  extracted_by text not null default 'ai', -- 'ai' | user id
  review_status review_status not null default 'pending',
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_evidence_literature on literature_evidence(literature_id);
create index idx_evidence_api on literature_evidence(api_id);
create index idx_evidence_parameter on literature_evidence(parameter);

-- ---------------------------------------------------------------------
-- QTPP
-- ---------------------------------------------------------------------
create table qtpp (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  attribute text not null,              -- e.g. 'Dosage form', 'Drug release', 'Stability'
  target text not null,
  justification text,
  source_evidence_id uuid references literature_evidence(id),
  ai_suggested boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_qtpp_project on qtpp(project_id);

-- ---------------------------------------------------------------------
-- CQA — linked back to QTPP for traceability
-- ---------------------------------------------------------------------
create table cqa (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  qtpp_id uuid references qtpp(id) on delete set null,
  attribute text not null,              -- e.g. 'Dissolution'
  importance text not null default 'medium', -- high | medium | low
  reason text,
  evidence_id uuid references literature_evidence(id),
  ai_suggested boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_cqa_project on cqa(project_id);

-- ---------------------------------------------------------------------
-- CMA — linked to CQA (CMA -> CQA relationship)
-- ---------------------------------------------------------------------
create table cma (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  cqa_id uuid references cqa(id) on delete set null,
  material text not null,               -- 'API' or excipient name
  attribute text not null,              -- e.g. 'Particle size', 'Polymorph'
  impact_description text,
  evidence_id uuid references literature_evidence(id),
  ai_suggested boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_cma_project on cma(project_id);
create index idx_cma_cqa on cma(cqa_id);

-- ---------------------------------------------------------------------
-- CPP — early development consideration only
-- ---------------------------------------------------------------------
create table cpp (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  process_step text not null,           -- e.g. 'Granulation', 'Compression'
  parameter text not null,              -- e.g. 'Drying temperature'
  note text not null default 'Process parameter for subsequent formulation/development stage.',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index idx_cpp_project on cpp(project_id);

-- ---------------------------------------------------------------------
-- RISK ASSESSMENTS (FMEA style)
-- ---------------------------------------------------------------------
create table risk_assessments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  cma_id uuid references cma(id) on delete set null,
  cqa_id uuid references cqa(id) on delete set null,
  risk_factor text not null,            -- e.g. 'API particle size -> Dissolution'
  severity int not null check (severity between 1 and 10),
  occurrence int not null check (occurrence between 1 and 10),
  detectability int not null check (detectability between 1 and 10),
  rpn int generated always as (severity * occurrence * detectability) stored,
  risk_level risk_level not null default 'unknown',
  rationale text,
  study_required text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_risk_project on risk_assessments(project_id);

-- ---------------------------------------------------------------------
-- EXCIPIENTS
-- ---------------------------------------------------------------------
create table excipients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,                        -- filler | binder | disintegrant | lubricant | ...
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- EXCIPIENT COMPATIBILITY
-- ---------------------------------------------------------------------
create table excipient_compatibility (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  api_id uuid not null references apis(id) on delete cascade,
  excipient_id uuid not null references excipients(id) on delete cascade,
  interaction_summary text not null default 'No adverse interaction reported in retrieved literature',
  risk risk_level not null default 'unknown',
  evidence_id uuid references literature_evidence(id),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index idx_compat_project on excipient_compatibility(project_id);
create index idx_compat_api on excipient_compatibility(api_id);

-- ---------------------------------------------------------------------
-- PREFORMULATION STUDIES (recommended study plan)
-- ---------------------------------------------------------------------
create table preformulation_studies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  study_name text not null,             -- e.g. 'Solubility study', 'DSC'
  objective text,
  why_needed text,
  parameter text,
  expected_output text,
  related_cqa_id uuid references cqa(id) on delete set null,
  related_cma_id uuid references cma(id) on delete set null,
  evidence_id uuid references literature_evidence(id),
  status text not null default 'planned', -- planned | in_progress | completed
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index idx_prefstudy_project on preformulation_studies(project_id);

-- ---------------------------------------------------------------------
-- RESEARCH NOTES
-- ---------------------------------------------------------------------
create table research_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  literature_id uuid references literature(id) on delete set null,
  author_id uuid not null references profiles(id),
  content text not null,
  created_at timestamptz not null default now()
);
create index idx_notes_project on research_notes(project_id);

-- ---------------------------------------------------------------------
-- REFERENCES (bibliography entries, generated or manual)
-- ---------------------------------------------------------------------
create table references_table (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  literature_id uuid references literature(id) on delete set null,
  authors text not null,
  year int,
  title text not null,
  journal text,
  volume text,
  issue text,
  pages text,
  doi text,                              -- must be real; 'DOI not available' if none
  style text not null default 'apa7',    -- apa7 | vancouver | harvard
  formatted_citation text,
  created_at timestamptz not null default now()
);
create index idx_refs_project on references_table(project_id);

-- ---------------------------------------------------------------------
-- SEARCH HISTORY
-- ---------------------------------------------------------------------
create table search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  query text not null,
  filters jsonb,
  api_name text,
  result_count int default 0,
  created_at timestamptz not null default now()
);
create index idx_search_history_user on search_history(user_id);

-- ---------------------------------------------------------------------
-- AUDIT LOG
-- ---------------------------------------------------------------------
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  table_name text not null,
  record_id uuid,
  action text not null,                 -- insert | update | delete
  ai_model text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_table on audit_log(table_name, record_id);

-- ---------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  for t in select unnest(array['profiles','projects','apis','qtpp','cqa','cma','risk_assessments'])
  loop
    execute format('create trigger trg_updated_at before update on %I for each row execute function set_updated_at()', t);
  end loop;
end $$;
