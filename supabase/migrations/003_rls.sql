-- Enable RLS on all app tables
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_items enable row level security;
alter table public.events enable row level security;
alter table public.reminders enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.user_settings enable row level security;
alter table public.github_repos enable row level security;
alter table public.github_task_rules enable row level security;
alter table public.github_events_log enable row level security;
alter table public.github_matches enable row level security;
alter table public.task_automation_audit enable row level security;

-- projects: user owns
create policy projects_select on public.projects for select using (auth.uid() = user_id);
create policy projects_insert on public.projects for insert with check (auth.uid() = user_id);
create policy projects_update on public.projects for update using (auth.uid() = user_id);
create policy projects_delete on public.projects for delete using (auth.uid() = user_id);

-- tasks: user owns
create policy tasks_select on public.tasks for select using (auth.uid() = user_id);
create policy tasks_insert on public.tasks for insert with check (auth.uid() = user_id);
create policy tasks_update on public.tasks for update using (auth.uid() = user_id);
create policy tasks_delete on public.tasks for delete using (auth.uid() = user_id);

-- task_items: via task ownership
create policy task_items_select on public.task_items for select
  using (exists (select 1 from public.tasks t where t.id = task_items.task_id and t.user_id = auth.uid()));
create policy task_items_insert on public.task_items for insert
  with check (exists (select 1 from public.tasks t where t.id = task_items.task_id and t.user_id = auth.uid()));
create policy task_items_update on public.task_items for update
  using (exists (select 1 from public.tasks t where t.id = task_items.task_id and t.user_id = auth.uid()));
create policy task_items_delete on public.task_items for delete
  using (exists (select 1 from public.tasks t where t.id = task_items.task_id and t.user_id = auth.uid()));

-- events: user owns
create policy events_select on public.events for select using (auth.uid() = user_id);
create policy events_insert on public.events for insert with check (auth.uid() = user_id);
create policy events_update on public.events for update using (auth.uid() = user_id);
create policy events_delete on public.events for delete using (auth.uid() = user_id);

-- reminders: user owns
create policy reminders_select on public.reminders for select using (auth.uid() = user_id);
create policy reminders_insert on public.reminders for insert with check (auth.uid() = user_id);
create policy reminders_update on public.reminders for update using (auth.uid() = user_id);
create policy reminders_delete on public.reminders for delete using (auth.uid() = user_id);

-- push_subscriptions: user owns
create policy push_subscriptions_select on public.push_subscriptions for select using (auth.uid() = user_id);
create policy push_subscriptions_insert on public.push_subscriptions for insert with check (auth.uid() = user_id);
create policy push_subscriptions_update on public.push_subscriptions for update using (auth.uid() = user_id);
create policy push_subscriptions_delete on public.push_subscriptions for delete using (auth.uid() = user_id);

-- user_settings: user owns
create policy user_settings_select on public.user_settings for select using (auth.uid() = user_id);
create policy user_settings_insert on public.user_settings for insert with check (auth.uid() = user_id);
create policy user_settings_update on public.user_settings for update using (auth.uid() = user_id);
create policy user_settings_delete on public.user_settings for delete using (auth.uid() = user_id);

-- github_repos: user owns
create policy github_repos_select on public.github_repos for select using (auth.uid() = user_id);
create policy github_repos_insert on public.github_repos for insert with check (auth.uid() = user_id);
create policy github_repos_update on public.github_repos for update using (auth.uid() = user_id);
create policy github_repos_delete on public.github_repos for delete using (auth.uid() = user_id);

-- github_task_rules: user owns
create policy github_task_rules_select on public.github_task_rules for select using (auth.uid() = user_id);
create policy github_task_rules_insert on public.github_task_rules for insert with check (auth.uid() = user_id);
create policy github_task_rules_update on public.github_task_rules for update using (auth.uid() = user_id);
create policy github_task_rules_delete on public.github_task_rules for delete using (auth.uid() = user_id);

-- github_events_log: service role / edge function only; no direct user access for insert
-- Allow read for users who have the repo (for integrations UI history)
create policy github_events_log_select on public.github_events_log for select
  using (exists (
    select 1 from public.github_repos r
    where r.full_name = github_events_log.repo_full_name and r.user_id = auth.uid()
  ));

-- github_matches: read for rule owner
create policy github_matches_select on public.github_matches for select
  using (exists (
    select 1 from public.github_task_rules gtr
    where gtr.id = github_matches.github_task_rule_id and gtr.user_id = auth.uid()
  ));
create policy github_matches_update on public.github_matches for update
  using (exists (
    select 1 from public.github_task_rules gtr
    where gtr.id = github_matches.github_task_rule_id and gtr.user_id = auth.uid()
  ));

-- task_automation_audit: user owns
create policy task_automation_audit_select on public.task_automation_audit for select using (auth.uid() = user_id);
create policy task_automation_audit_insert on public.task_automation_audit for insert with check (auth.uid() = user_id);
