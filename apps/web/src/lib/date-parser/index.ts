const TIMEZONE = "America/Sao_Paulo";

/** Resultado do parser de data/hora em linguagem natural (PT-BR) */
export interface ParsedDateTime {
  /** Data/hora em ISO (UTC) */
  iso: string;
  /** Texto restante após remover trechos de data/hora */
  title: string;
  /** Confiança 0–1 */
  confidence: number;
  /** Preview legível (ex: "11/03/2026 20:00") */
  preview: string;
}

const WEEKDAY_NAMES = [
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
] as const;

/** Retorna o offset em dias para "esta semana" (0=domingo..6=sábado) */
function weekdayOffset(dayName: string): number {
  const idx = WEEKDAY_NAMES.indexOf(dayName as (typeof WEEKDAY_NAMES)[number]);
  return idx >= 0 ? idx : -1;
}

/** Converte data/hora local America/Sao_Paulo (BRT, UTC-3) para ISO UTC */
function toUtcISO(year: number, month: number, day: number, hour: number, minute: number): string {
  const BRT_OFFSET_HOURS = 3;
  const d = new Date(Date.UTC(year, month - 1, day, hour + BRT_OFFSET_HOURS, minute, 0, 0));
  if (isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

/** Formata para preview (dd/mm/yyyy HH:mm) em America/Sao_Paulo (UTC-3) */
function formatPreview(iso: string): string {
  const d = new Date(iso);
  const utc = d.getTime();
  const brt = new Date(utc - 3 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(brt.getUTCDate())}/${pad(brt.getUTCMonth() + 1)}/${brt.getUTCFullYear()} ${pad(brt.getUTCHours())}:${pad(brt.getUTCMinutes())}`;
}

/** Extrai e interpreta data/hora em PT-BR. Timezone fixo America/Sao_Paulo. */
export function extractDateTimePtBr(
  input: string,
  defaultHour = 9,
  defaultMinute = 0
): ParsedDateTime {
  const normalized = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ");
  let title = input.trim();
  let year: number | null = null;
  let month: number | null = null;
  let day: number | null = null;
  let hour = defaultHour;
  let minute = defaultMinute;
  let confidence = 0.5;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Horário: 20h, 20:30, às 19h
  const timeMatch = normalized.match(
    /\b(?:as\s+)?(\d{1,2})(?::(\d{2}))?(?:\s*h(?:oras?)?)?\b/
  );
  if (timeMatch) {
    hour = parseInt(timeMatch[1], 10);
    minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    title = title.replace(
      new RegExp(timeMatch[0].replace(/\s+/g, "\\s+"), "i"),
      " "
    );
  }

  // hoje / amanhã / depois de amanhã
  if (/\bhoje\b/.test(normalized)) {
    const d = new Date(today);
    year = d.getFullYear();
    month = d.getMonth() + 1;
    day = d.getDate();
    confidence = 0.95;
    title = title.replace(/\bhoje\b/gi, " ").trim();
  } else if (/\bamanha\b/.test(normalized)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    year = d.getFullYear();
    month = d.getMonth() + 1;
    day = d.getDate();
    confidence = 0.95;
    title = title.replace(/\bamanha\b/gi, " ").trim();
  } else if (/\bdepois\s+de\s+amanha\b/.test(normalized)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    year = d.getFullYear();
    month = d.getMonth() + 1;
    day = d.getDate();
    confidence = 0.95;
    title = title.replace(/\bdepois\s+de\s+amanha\b/gi, " ").trim();
  }

  // dias da semana: "quarta", "esta quarta-feira", "próxima quarta-feira"
  if (day === null) {
    for (const name of WEEKDAY_NAMES) {
      if (name === "domingo") continue;
      const thisWeek = new RegExp(`(?:esta|esta\\s+${name}(?:-feira)?)\\s+${name}(?:-feira)?`, "i");
      const nextWeek = new RegExp(`proxima\\s+${name}(?:-feira)?`, "i");
      const plain = new RegExp(`\\b${name}(?:-feira)?\\b`, "i");
      const currentDay = now.getDay();
      const targetOffset = weekdayOffset(name);
      if (targetOffset < 0) continue;

      if (thisWeek.test(normalized)) {
        let diff = targetOffset - currentDay;
        if (diff < 0) diff += 7;
        const d = new Date(today);
        d.setDate(d.getDate() + diff);
        year = d.getFullYear();
        month = d.getMonth() + 1;
        day = d.getDate();
        confidence = 0.9;
        title = title.replace(thisWeek, " ").trim();
        break;
      }
      if (nextWeek.test(normalized)) {
        let diff = targetOffset - currentDay;
        if (diff <= 0) diff += 7;
        diff += 7;
        const d = new Date(today);
        d.setDate(d.getDate() + diff);
        year = d.getFullYear();
        month = d.getMonth() + 1;
        day = d.getDate();
        confidence = 0.9;
        title = title.replace(nextWeek, " ").trim();
        break;
      }
      if (plain.test(normalized)) {
        let diff = targetOffset - currentDay;
        if (diff <= 0) diff += 7;
        const d = new Date(today);
        d.setDate(d.getDate() + diff);
        year = d.getFullYear();
        month = d.getMonth() + 1;
        day = d.getDate();
        confidence = 0.85;
        title = title.replace(plain, " ").trim();
        break;
      }
    }
  }

  // dd/mm ou dd/mm/aaaa
  if (day === null) {
    const dateMatch = normalized.match(
      /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/
    );
    if (dateMatch) {
      day = parseInt(dateMatch[1], 10);
      month = parseInt(dateMatch[2], 10);
      year = dateMatch[3]
        ? parseInt(dateMatch[3], 10) > 100
          ? parseInt(dateMatch[3], 10)
          : 2000 + parseInt(dateMatch[3], 10)
        : now.getFullYear();
      confidence = 0.9;
      title = title.replace(/\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/, " ").trim();
    }
  }

  title = title.replace(/\s+/g, " ").trim();

  if (year === null || month === null || day === null) {
    year = now.getFullYear();
    month = now.getMonth() + 1;
    day = now.getDate();
    confidence = 0.3;
  }

  const iso = toUtcISO(year, month, day, hour, minute);
  const preview = formatPreview(iso);

  return { iso, title, confidence, preview };
}
