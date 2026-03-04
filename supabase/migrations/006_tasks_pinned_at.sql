-- Fixados / Top 3 do dia (melhorias 4.3)
alter table public.tasks
  add column if not exists pinned_at timestamptz;

create index if not exists tasks_pinned_at_idx on public.tasks(pinned_at) where pinned_at is not null;

comment on column public.tasks.pinned_at is 'Quando preenchido, tarefa aparece no bloco Top 3 do dia no hub.';
