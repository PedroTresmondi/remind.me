"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type { ListKey } from "@/components/dashboard/DashboardLists";
import { QuickAddForm } from "@/components/quick-add/QuickAddForm";
import { HubSmartCards } from "@/components/hub/HubSmartCards";
import { TaskListWithActions } from "@/components/tasks/TaskListWithActions";
import { TaskDetailDrawer } from "@/components/hub/TaskDetailDrawer";
import { ProjectsDrawer } from "@/components/hub/ProjectsDrawer";
import { MiniAgendaStrip } from "@/components/hub/MiniAgendaStrip";
import type { AgendaEventRow } from "@/components/dashboard/DashboardLists";
import { createClient } from "@/lib/supabase/client";
import { Top3Block, usePinUnpin } from "@/components/hub/Top3Block";
import { Fab } from "@/components/hub/Fab";
import { Sheet } from "@/components/ui/Sheet";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ToastProvider, useToast } from "@/components/ui/Toast";

const LIST_LABELS: Record<ListKey, string> = {
  hoje: "Hoje",
  programado: "Programado",
  todos: "Todos",
  atrasados: "Atrasados",
  inbox: "Inbox",
  sem_data: "Sem data",
  concluidos: "Concluídos",
};

type TaskRow = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  completed_at?: string | null;
  pinned_at?: string | null;
  priority: string;
  project_id: string | null;
  project: { id: string; name: string; color: string } | null;
};

function TestToastButton() {
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={() =>
        toast.show({
          message: "Item concluído.",
          undoLabel: "Desfazer",
          onUndo: () => alert("Desfazer funcionou!"),
        })
      }
      className="text-xs px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--muted)]/10 hover:text-[var(--foreground)] transition-colors"
    >
      Testar notificação
    </button>
  );
}

export function HubView({ initialTasks }: { initialTasks: TaskRow[] }) {
  const { setPinned } = usePinUnpin();
  const [activeList, setActiveList] = useState<ListKey | null>("hoje");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [projectsDrawerOpen, setProjectsDrawerOpen] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [addSheetType, setAddSheetType] = useState<"task" | "event" | null>(null);
  const [addSheetReminder, setAddSheetReminder] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [upcomingEvents, setUpcomingEvents] = useState<AgendaEventRow[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 280);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const supabase = createClient();
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 365);
    end.setHours(23, 59, 59, 999);

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, starts_at, ends_at")
        .gte("starts_at", start.toISOString())
        .lte("starts_at", end.toISOString())
        .order("starts_at");
      if (!cancelled) setUpcomingEvents((data ?? []) as AgendaEventRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [initialTasks]);

  const tasksFiltered = useMemo(() => {
    if (!debouncedSearch) return initialTasks;
    const q = debouncedSearch.toLowerCase();
    return initialTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.project?.name && t.project.name.toLowerCase().includes(q))
    );
  }, [initialTasks, debouncedSearch]);

  const effectiveList = activeList ?? "hoje";
  const vistaLabel = LIST_LABELS[effectiveList];

  const top3Pinned = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return initialTasks
      .filter(
        (t) =>
          t.status === "pending" &&
          t.pinned_at &&
          t.due_at &&
          new Date(t.due_at) >= start &&
          new Date(t.due_at) <= end
      )
      .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime())
      .slice(0, 3);
  }, [initialTasks]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const inInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (e.key === "Escape") {
        if (addSheetOpen) {
          e.preventDefault();
          setAddSheetOpen(false);
          setAddSheetType(null);
          setAddSheetReminder(false);
        } else if (selectedTaskId) {
          e.preventDefault();
          setSelectedTaskId(null);
        } else if (projectsDrawerOpen) {
          e.preventDefault();
          setProjectsDrawerOpen(false);
        }
        return;
      }
      if (inInput) return;
      if (e.key === "/" || e.key.toLowerCase() === "q") {
        e.preventDefault();
        document.getElementById("quick-add-input")?.focus();
        return;
      }
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        setAddSheetType(null);
        setAddSheetReminder(false);
        setAddSheetOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addSheetOpen, selectedTaskId, projectsDrawerOpen]);

  return (
    <ToastProvider>
    <div className="max-w-5xl mx-auto">
      {/* Sticky top: Quick Add + chips + search */}
      <div className="sticky top-0 z-30 -mx-2 px-2 py-3 bg-[var(--background)]/95 backdrop-blur border-b border-[var(--card-border)] mb-4">
        <div className="space-y-3">
          <QuickAddForm
            defaultHour={9}
            defaultMinute={0}
            placeholder="Reunião amanhã 14h · / ou Q focar · N novo"
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              placeholder="Buscar (título ou projeto)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base max-w-xs"
              aria-label="Buscar tarefas por título ou projeto"
              title="Busca com debounce. Atalhos: / ou Q focar campo rápido, N novo item, Esc fechar."
            />
            <Link
              href="/dashboard/shortcuts"
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] px-2 py-1.5 rounded-[var(--radius-sm)] border border-[var(--card-border)] bg-[var(--card)] transition-colors"
              title="Ver atalhos de teclado"
            >
              Atalhos (?)
            </Link>
            <TestToastButton />
          </div>
        </div>
      </div>

      {/* Smart list cards */}
      <section className="mb-4">
        <HubSmartCards
          tasks={initialTasks}
          events={upcomingEvents}
          activeList={activeList}
          onSelectList={setActiveList}
          onOpenProjects={() => setProjectsDrawerOpen(true)}
        />
      </section>

      {/* Top 3 do dia (fixados) */}
      <section className="mb-6">
        <Top3Block
          tasks={top3Pinned}
          onTaskClick={setSelectedTaskId}
          onUnpin={(id) => setPinned(id, false)}
        />
        {top3Pinned.length === 0 && (
          <p className="text-xs text-[var(--muted)] mt-1">
            Fixe tarefas de Hoje (ícone ↑ na lista) para ver suas prioridades aqui.
          </p>
        )}
      </section>

      {/* Mini agenda: próximos dias com tarefas e eventos, clique abre drawer */}
      <section className="mb-6">
        <MiniAgendaStrip
          tasks={initialTasks}
          events={upcomingEvents}
          onTaskClick={setSelectedTaskId}
        />
      </section>

      {/* Vista ativa: dynamic list com animação na troca */}
      <section className="min-h-[200px]" aria-live="polite" aria-label={`Vista ativa: ${vistaLabel}`}>
        <SectionHeader title="Vista ativa:" subtitle={vistaLabel} />
        <div key={effectiveList} className="hub-vista-in">
          <TaskListWithActions
            tasks={tasksFiltered}
            events={upcomingEvents}
            list={effectiveList}
            onTaskClick={setSelectedTaskId}
            onPinToggle={(id, pinned) => setPinned(id, pinned)}
            hideTitle
          />
        </div>
      </section>

      <TaskDetailDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
      <ProjectsDrawer
        open={projectsDrawerOpen}
        onClose={() => setProjectsDrawerOpen(false)}
      />

      <Sheet
        open={addSheetOpen}
        onClose={() => {
          setAddSheetOpen(false);
          setAddSheetType(null);
          setAddSheetReminder(false);
        }}
        title="Adicionar"
        headerLeft={<span className="text-sm font-medium text-[var(--foreground)]">Adicionar</span>}
      >
        <div className="p-4">
          <QuickAddForm
            defaultHour={9}
            defaultMinute={0}
            placeholder="Reunião amanhã 14h ; Entregar layout sexta 18h"
            compact
            initialTypeOverride={addSheetType}
            initialMoreOptionsOpen={addSheetReminder}
            onCloseAfterAdd={() => setAddSheetOpen(false)}
          />
        </div>
      </Sheet>

      <Fab
        actions={[
          {
            id: "task",
            label: "Tarefa",
            icon: (
              <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            ),
            onClick: () => {
              setAddSheetType("task");
              setAddSheetReminder(false);
              setAddSheetOpen(true);
            },
          },
          {
            id: "event",
            label: "Evento",
            icon: (
              <svg className="w-5 h-5 text-[var(--info)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
            onClick: () => {
              setAddSheetType("event");
              setAddSheetReminder(false);
              setAddSheetOpen(true);
            },
          },
          {
            id: "reminder",
            label: "Lembrete",
            icon: (
              <svg className="w-5 h-5 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            ),
            onClick: () => {
              setAddSheetType("task");
              setAddSheetReminder(true);
              setAddSheetOpen(true);
            },
          },
          {
            id: "quick",
            label: "Captura rápida",
            icon: (
              <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ),
            onClick: () => {
              setAddSheetType(null);
              setAddSheetReminder(false);
              setAddSheetOpen(true);
            },
          },
        ]}
      />
    </div>
    </ToastProvider>
  );
}
