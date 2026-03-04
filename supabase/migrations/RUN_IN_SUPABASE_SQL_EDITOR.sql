-- Cole este conteúdo no SQL Editor do Supabase e execute (Run).
-- Equivale às migrations 004 e 005, para quando o db push falha por histórico diferente.

-- === 004: coluna starts_at em tasks ===
alter table public.tasks
  add column if not exists starts_at timestamptz;

create index if not exists tasks_starts_at_idx on public.tasks(starts_at);

comment on column public.tasks.starts_at is 'Início do bloco de tempo da tarefa; due_at é o fim.';

-- === 005: updated_at automático + índice ===
create or replace function public.set_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks for each row execute function public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects for each row execute function public.set_updated_at();

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings for each row execute function public.set_updated_at();

create index if not exists tasks_user_project_idx on public.tasks(user_id, project_id);
