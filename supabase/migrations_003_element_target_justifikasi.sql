-- =====================================================================
-- Migration: align CQA / CMA / CPP with the Element | Target | Justifikasi
-- structure used in real QbD research documents (QTPP already matches).
-- Safe to run multiple times (IF NOT EXISTS guards).
-- =====================================================================

alter table cqa add column if not exists target text;
alter table cma add column if not exists target text;
alter table cpp add column if not exists target text;

-- cpp.note had a forced default sentence before; make it freely editable
-- so it can hold a real "Justifikasi" like the other tables.
alter table cpp alter column note drop not null;
alter table cpp alter column note drop default;
