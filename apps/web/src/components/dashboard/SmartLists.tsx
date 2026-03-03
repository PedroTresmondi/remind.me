"use client";

import { useState } from "react";
import { extractDateTimePtBr } from "@/lib/date-parser";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type SmartListKey = "today" | "week" | "overdue" | "no_date";

const SMART_LIST_LABELS: Record<SmartListKey, string> = {
  today: "Hoje",
  week: "Esta semana",
  overdue: "Atrasados",
  no_date: "Sem data",
};

function getSmartListKey(task: { due_at: string | null }): SmartListKey | null {
  if (!task.due_at) return "no_date";
  const d = new Date(task.due_at);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endToday = new Date(today);
  endToday.setHours(23, 59, 59, 999);
  const startWeek = new Date(today);
  startWeek.setDate(startWeek.getDate() - today.getDay());
  const endWeek = new Date(startWeek);
  endWeek.setDate(endWeek.getDate() + 6);
  endWeek.setHours(23, 59, 59, 999);
  if (d >= today && d <= endToday) return "today";
  if (d < today) return "overdue";
  if (d >= startWeek && d <= endWeek) return "week";
  return null;
}

type TaskRow = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  priority: string;
  project_id: string | null;
  project: { id: string; name: string; color: string } | null;
};

export function SmartLists({ tasks }: { tasks: TaskRow[] }) {
  const pending = tasks.filter((t) => t.status === "pending");
  const grouped: Partial<Record<SmartListKey, TaskRow[]>> = {
    today: [],
    week: [],
    overdue: [],
    no_date: [],
  };
  for (const t of pending) {
    const key = getSmartListKey(t);
    if (key && grouped[key]) grouped[key]!.push(t);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {(Object.keys(SMART_LIST_LABELS) as SmartListKey[]).map((key) => (
        <div
          key={key}
          className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4"
        >
          <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
            {SMART_LIST_LABELS[key]}
          </h3>
          <ul className="space-y-1">
            {(grouped[key] ?? []).map((t) => (
              <li key={t.id}>
                <a
                  href={`/dashboard/tasks/${t.id}`}
                  className="block text-sm truncate text-teal-700 dark:text-teal-400 hover:underline"
                >
                  {t.title}
                </a>
              </li>
            ))}
            {(!grouped[key] || grouped[key]!.length === 0) && (
              <li className="text-sm text-neutral-400">Nenhuma</li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
