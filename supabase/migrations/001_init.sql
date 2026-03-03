-- Enums
create type app_project_category as enum ('work', 'college', 'personal');
create type app_task_status as enum ('pending', 'done');
create type app_priority as enum ('low', 'medium', 'high');
create type app_entity_type as enum ('task', 'event');
create type app_reminder_status as enum ('pending', 'sent', 'failed');

-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category app_project_category not null default 'personal',
  color text not null default '#22c55e',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_user_id_idx on public.projects(user_id);

-- Trigger: set user_id for projects
create or replace function public.set_project_user_id()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$;
create trigger projects_set_user_id
  before insert on public.projects for each row execute function public.set_project_user_id();

-- Tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  status app_task_status not null default 'pending',
  priority app_priority not null default 'medium',
  due_at timestamptz,
  completed_at timestamptz,
  source_text text,
  parsed_datetime_confidence numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_user_id_idx on public.tasks(user_id);
create index tasks_project_id_idx on public.tasks(project_id);
create index tasks_due_at_idx on public.tasks(due_at);
create index tasks_status_due_idx on public.tasks(user_id, status, due_at);

-- Task checklist items
create table public.task_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  normalized_title text,
  is_done boolean not null default false,
  done_at timestamptz,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index task_items_task_id_idx on public.task_items(task_id);
create index task_items_norm_title_idx on public.task_items(normalized_title);

-- Events (calendário)
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index events_user_id_idx on public.events(user_id);
create index events_starts_at_idx on public.events(starts_at);

-- Reminders
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type app_entity_type not null,
  entity_id uuid not null,
  trigger_at timestamptz not null,
  status app_reminder_status not null default 'pending',
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);
create index reminders_due_idx on public.reminders(status, trigger_at);
create index reminders_user_idx on public.reminders(user_id);

-- Trigger: set user_id for reminders
create or replace function public.set_reminder_user_id()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$;
create trigger reminders_set_user_id
  before insert on public.reminders for each row execute function public.set_reminder_user_id();

-- Push subscriptions (Web Push PWA)
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  unique (user_id, endpoint)
);
create index push_subscriptions_user_idx on public.push_subscriptions(user_id);

-- Trigger: set user_id from auth.uid() on insert (tasks)
create or replace function public.set_task_user_id()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$;
create trigger tasks_set_user_id
  before insert on public.tasks for each row execute function public.set_task_user_id();

-- Trigger: set user_id for push_subscriptions
create or replace function public.set_push_subscription_user_id()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$;
create trigger push_subscriptions_set_user_id
  before insert on public.push_subscriptions for each row execute function public.set_push_subscription_user_id();

-- User settings (e.g. default reminder time)
create table public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  default_reminder_time time not null default '09:00',
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
