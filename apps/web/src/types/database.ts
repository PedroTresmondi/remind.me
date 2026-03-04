/** Database enums (match Supabase) */
export type AppProjectCategory = "work" | "college" | "personal";
export type AppTaskStatus = "pending" | "done";
export type AppPriority = "low" | "medium" | "high";
export type AppEntityType = "task" | "event";
export type AppReminderStatus = "pending" | "sent" | "failed";
export type AppGitHubEventType = "push" | "release";
export type AppGitHubMatchMode = "explicit_tag" | "contains" | "all_tokens" | "fuzzy";
export type AppMatchAction = "auto_tick" | "suggest_only";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  category: AppProjectCategory;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: AppTaskStatus;
  priority: AppPriority;
  starts_at: string | null;
  due_at: string | null;
  completed_at: string | null;
  pinned_at: string | null;
  source_text: string | null;
  parsed_datetime_confidence: number | null;
  created_at: string;
  updated_at: string;
  task_items?: TaskItem[];
  project?: Project | null;
}

export interface TaskItem {
  id: string;
  task_id: string;
  title: string;
  normalized_title: string | null;
  is_done: boolean;
  done_at: string | null;
  position: number;
  created_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  location: string | null;
  starts_at: string;
  ends_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  entity_type: AppEntityType;
  entity_id: string;
  trigger_at: string;
  status: AppReminderStatus;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

export interface UserSettings {
  id: string;
  user_id: string;
  default_reminder_time: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface GithubRepo {
  id: string;
  user_id: string;
  owner: string;
  repo: string;
  full_name: string;
  default_branch: string | null;
  webhook_secret_hash: string | null;
  webhook_enabled: boolean;
  created_at: string;
}

export interface GithubTaskRule {
  id: string;
  user_id: string;
  task_id: string | null;
  task_item_id: string | null;
  github_repo_id: string;
  allow_push: boolean;
  allow_release: boolean;
  target_phrase: string;
  normalized_target_phrase: string;
  match_mode: AppGitHubMatchMode;
  min_score: number;
  action_mode: AppMatchAction;
  branch_filter: string | null;
  tag_prefix_filter: string | null;
  is_active: boolean;
  created_at: string;
}

export interface GithubMatch {
  id: string;
  github_event_log_id: string;
  github_task_rule_id: string;
  matched_text: string;
  score: number;
  applied: boolean;
  applied_at: string | null;
  reason: string | null;
  created_at: string;
}

/** Insert/Update helpers (optional fields) */
export type ProjectInsert = Omit<Project, "id" | "created_at" | "updated_at"> &
  Partial<Pick<Project, "id" | "created_at" | "updated_at">>;
export type TaskInsert = Omit<Task, "id" | "created_at" | "updated_at"> &
  Partial<Pick<Task, "id" | "created_at" | "updated_at" | "completed_at" | "source_text" | "parsed_datetime_confidence" | "starts_at" | "pinned_at">>;
export type TaskItemInsert = Omit<TaskItem, "id" | "created_at"> &
  Partial<Pick<TaskItem, "id" | "normalized_title" | "created_at">>;
