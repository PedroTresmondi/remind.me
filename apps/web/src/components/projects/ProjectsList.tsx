"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Project = { id: string; name: string; category: string; color: string };

export function ProjectsList({ initialProjects }: { initialProjects: Project[] }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"work" | "college" | "personal">("personal");
  const [color, setColor] = useState("#22c55e");
  const [adding, setAdding] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function addProject(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    const { error } = await supabase.from("projects").insert({
      name: name.trim(),
      category,
      color,
    });
    setAdding(false);
    if (error) {
      console.error(error);
      return;
    }
    setName("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addProject} className="flex gap-2 flex-wrap items-end">
        <input
          type="text"
          placeholder="Nome do projeto"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-[140px] px-3 py-2 border rounded-lg bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Project["category"])}
          className="px-3 py-2 border rounded-lg bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
        >
          <option value="personal">Pessoal</option>
          <option value="work">Trabalho</option>
          <option value="college">Faculdade</option>
        </select>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer"
        />
        <button
          type="submit"
          disabled={adding || !name.trim()}
          className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
        >
          Novo projeto
        </button>
      </form>
      <ul className="space-y-2">
        {initialProjects.map((p) => (
          <li key={p.id}>
            <Link
              href={`/dashboard/projects/${p.id}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            >
              <span
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <span>{p.name}</span>
              <span className="text-xs text-neutral-400 capitalize">{p.category}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
