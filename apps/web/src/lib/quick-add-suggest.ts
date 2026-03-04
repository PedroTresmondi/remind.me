/**
 * Sugere tipo (tarefa vs evento) a partir do texto.
 * "reunião", "aula", "consulta", "evento" → evento
 * "*" no início ou " *evento" → evento
 * default → tarefa
 */
export function suggestQuickAddType(text: string): "task" | "event" {
  const t = text.trim();
  if (/^\*\s*/.test(t) || /\s+\*\s*$/.test(t) || /\s+\*evento\b/i.test(t)) return "event";
  const n = text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const eventWords = [
    "reuniao", "aula", "consulta", "evento", "palestra",
    "workshop", "encontro", "entrevista", "call",
    "videoconferencia", "curso", "prova", "seminario",
  ];
  for (const w of eventWords) {
    const wNorm = w.normalize("NFD").replace(/\p{Diacritic}/gu, "");
    if (n.includes(wNorm)) return "event";
  }
  return "task";
}

/**
 * Extrai possível projeto do texto: "projeto: título" ou "#projeto título".
 */
export function parseProjectFromText(text: string): { projectSlug: string | null; titleWithoutProject: string } {
  const t = text.trim();
  const hashMatch = t.match(/^#(\S+)\s+([\s\S]+)$/);
  if (hashMatch) {
    return { projectSlug: hashMatch[1].toLowerCase(), titleWithoutProject: hashMatch[2].trim() };
  }
  const colonMatch = t.match(/^([^:]+):\s*([\s\S]+)$/);
  if (colonMatch) {
    const slug = colonMatch[1].trim().toLowerCase().replace(/\s+/g, "-");
    const rest = colonMatch[2].trim();
    if (slug.length > 0 && rest.length > 0) return { projectSlug: slug, titleWithoutProject: rest };
  }
  return { projectSlug: null, titleWithoutProject: t };
}

export function matchProjectSlug(slug: string, projects: { id: string; name: string }[]): string | null {
  const norm = slug.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/\s+/g, "-");
  for (const p of projects) {
    const pNorm = p.name.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/\s+/g, "-");
    if (pNorm === norm || pNorm.includes(norm) || norm.includes(pNorm)) return p.id;
  }
  return null;
}

/** Extrai prioridade do texto: !alta, !média, !baixa (ou !high, !low). Remove do título. */
export function parsePriorityFromText(text: string): {
  priority: "low" | "medium" | "high";
  titleWithoutPriority: string;
} {
  const n = text.toLowerCase().trim();
  const high = /\b!?(alta|high|alta prioridade)\b/i;
  const low = /\b!?(baixa|low|baixa prioridade)\b/i;
  const medium = /\b!?(media|média|medium)\b/i;
  let title = text.trim();
  let priority: "low" | "medium" | "high" = "medium";
  if (high.test(n)) {
    priority = "high";
    title = title.replace(high, " ").replace(/\s+/g, " ").trim();
  } else if (low.test(n)) {
    priority = "low";
    title = title.replace(low, " ").replace(/\s+/g, " ").trim();
  } else if (medium.test(n)) {
    priority = "medium";
    title = title.replace(medium, " ").replace(/\s+/g, " ").trim();
  }
  return { priority, titleWithoutPriority: title };
}
