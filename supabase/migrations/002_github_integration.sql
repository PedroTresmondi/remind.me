-- GitHub integration enums
create type app_github_event_type as enum ('push', 'release');
create type app_github_match_mode as enum ('explicit_tag', 'contains', 'all_tokens', 'fuzzy');
create type app_match_action as enum ('auto_tick', 'suggest_only');

-- Repositories linked by user
create table public.github_repos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  owner text not null,
  repo text not null,
  full_name text generated always as (owner || '/' || repo) stored,
  default_branch text,
  webhook_secret_hash text,
  webhook_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, owner, repo)
);
create index github_repos_user_idx on public.github_repos(user_id);
create index github_repos_full_name_idx on public.github_repos(full_name);

-- Rules: task or task_item + repo + match config
create table public.github_task_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  task_item_id uuid references public.task_items(id) on delete cascade,
  github_repo_id uuid not null references public.github_repos(id) on delete cascade,
  allow_push boolean not null default true,
  allow_release boolean not null default true,
  target_phrase text not null,
  normalized_target_phrase text not null,
  match_mode app_github_match_mode not null default 'fuzzy',
  min_score int not null default 80,
  action_mode app_match_action not null default 'auto_tick',
  branch_filter text,
  tag_prefix_filter text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check ((task_id is not null) or (task_item_id is not null))
);
create index github_task_rules_user_idx on public.github_task_rules(user_id);
create index github_task_rules_repo_idx on public.github_task_rules(github_repo_id);
create index github_task_rules_active_idx on public.github_task_rules(is_active);
create index github_task_rules_norm_target_idx on public.github_task_rules(normalized_target_phrase);

-- Incoming webhook events log
create table public.github_events_log (
  id uuid primary key default gen_random_uuid(),
  github_delivery_id text not null,
  github_event app_github_event_type not null,
  repo_full_name text not null,
  action text,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (github_delivery_id)
);
create index github_events_repo_idx on public.github_events_log(repo_full_name);
create index github_events_received_idx on public.github_events_log(received_at desc);

-- Matches applied or suggested
create table public.github_matches (
  id uuid primary key default gen_random_uuid(),
  github_event_log_id uuid not null references public.github_events_log(id) on delete cascade,
  github_task_rule_id uuid not null references public.github_task_rules(id) on delete cascade,
  matched_text text not null,
  score int not null,
  applied boolean not null default false,
  applied_at timestamptz,
  reason text,
  created_at timestamptz not null default now(),
  unique (github_event_log_id, github_task_rule_id)
);
create index github_matches_event_idx on public.github_matches(github_event_log_id);

-- Automation audit
create table public.task_automation_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  task_item_id uuid references public.task_items(id) on delete cascade,
  source text not null,
  message text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index task_automation_audit_user_idx on public.task_automation_audit(user_id);
