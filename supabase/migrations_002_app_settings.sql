-- =====================================================================
-- Migration: app_settings — singleton row holding app-wide branding
-- that super_admin can edit at runtime (no redeploy needed).
-- Run this AFTER schema.sql and rls.sql.
-- =====================================================================

create table if not exists app_settings (
  id boolean primary key default true,          -- singleton row, always id = true
  app_name text not null default 'QbD Preformulation',
  tagline text not null default 'Research Assistant',
  hero_headline text not null default 'Dari struktur molekul hingga risk assessment, dalam satu alur kerja.',
  hero_body text not null default 'Susun profil fisikokimia, telusuri literatur lintas sumber, dan bangun QTPP–CQA–CMA yang tertelusuri ke bukti ilmiahnya — sebelum Anda masuk ke tahap formulasi.',
  color_primary text not null default '#D6246F',
  color_primary_dark text not null default '#A81856',
  color_primary_soft text not null default '#FCE4EF',
  color_accent text not null default '#FF6FA5',
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id = true)
);

insert into app_settings (id) values (true)
on conflict (id) do nothing;

alter table app_settings enable row level security;

-- Everyone (including logged-out visitors on /login) can read branding.
create policy app_settings_select on app_settings for select
  using (true);

-- Only super_admin can change it.
create policy app_settings_update on app_settings for update
  using (current_role_name() = 'super_admin');

create trigger trg_app_settings_updated_at
  before update on app_settings
  for each row execute function set_updated_at();
