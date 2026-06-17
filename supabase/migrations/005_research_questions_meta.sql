-- Optional: dedicated columns for question ordering and source.
-- The app also stores this metadata in research_questions.normalized_scope._questionMeta
-- so this migration is not required for the wizard to work.

alter table public.research_questions
  add column if not exists sort_order integer not null default 0,
  add column if not exists status text not null default 'active',
  add column if not exists source text not null default 'client';

create index if not exists research_questions_project_sort_idx
  on public.research_questions(project_id, sort_order);
