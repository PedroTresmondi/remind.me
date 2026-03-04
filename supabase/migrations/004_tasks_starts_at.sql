-- Horário de início para tarefas (fim = due_at). Permite bloco início–fim sempre.
alter table public.tasks
  add column if not exists starts_at timestamptz;

create index if not exists tasks_starts_at_idx on public.tasks(starts_at);

comment on column public.tasks.starts_at is 'Início do bloco de tempo da tarefa; due_at é o fim.';
