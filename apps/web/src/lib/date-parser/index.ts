const TIMEZONE = "America/Sao_Paulo";

/** Resultado do parser de data/hora em linguagem natural (PT-BR) */
export interface ParsedDateTime {
  /** Data/hora início em ISO (UTC) */
  iso: string;
  /** Data/hora fim em ISO (UTC) — quando há intervalo (ex.: "das 10h até 13h") */
  isoEnd?: string;
  /** Texto restante após remover trechos de data/hora */
  title: string;
  /** Confiança 0–1 */
  confidence: number;
  /** Preview legível início (ex: "11/03/2026 10:00") */
  preview: string;
  /** Preview legível fim quando há intervalo (ex: "11/03/2026 13:00") */
  previewEnd?: string;
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

/** Converte período (manhã/tarde/noite) em hora 0-23 */
function applyPeriod(h: number, m: number, period: string | undefined): { h: number; m: number } {
  if (!period) return { h, m };
  const p = period.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  if (p === "tarde") return { h: h <= 5 ? h + 12 : h, m };
  if (p === "noite") return { h: h <= 11 ? h + 12 : h, m };
  return { h, m };
}

/** Extrai intervalo de horário: "das 10h até 13h", "do meio-dia até às 1:00 da tarde". */
function extractTimeRange(
  title: string
): { startHour: number; startMinute: number; endHour: number; endMinute: number; title: string; matched: boolean } {
  // "do meio-dia até às 1:00 da tarde" → 12:00 até 13:00
  const meioDiaAte = /(?:do\s+)?meio[- ]?dia\s+at[eé]\s+(?:[aà]s\s+)?(\d{1,2})(?::(\d{2})|\s*h(?:oras?)?\s*(\d{2})?)?\s*(?:horas?\s+da\s+)?(manh[aã]|tarde|noite)?/gi;
  let m = meioDiaAte.exec(title);
  if (m && m[0]) {
    const endH = parseInt(m[1], 10);
    const endM = m[2] ? parseInt(m[2], 10) : m[3] ? parseInt(m[3], 10) : 0;
    const end = applyPeriod(endH, endM, m[4]);
    if (end.h >= 0 && end.h <= 23 && end.m >= 0 && end.m <= 59) {
      const newTitle = title.replace(m[0], " ").replace(/\s+/g, " ").trim();
      return { startHour: 12, startMinute: 0, endHour: end.h, endMinute: end.m, title: newTitle, matched: true };
    }
  }

  // "meia-noite até X"
  const meiaNoiteAte = /(?:do\s+)?meia[- ]?noite\s+at[eé]\s+(?:[aà]s\s+)?(\d{1,2})(?::(\d{2})|\s*h(?:oras?)?\s*(\d{2})?)?\s*(?:horas?\s+da\s+)?(manh[aã]|tarde|noite)?/gi;
  m = meiaNoiteAte.exec(title);
  if (m && m[0]) {
    const endH = parseInt(m[1], 10);
    const endM = m[2] ? parseInt(m[2], 10) : m[3] ? parseInt(m[3], 10) : 0;
    const end = applyPeriod(endH, endM, m[4]);
    if (end.h >= 0 && end.h <= 23 && end.m >= 0 && end.m <= 59) {
      const newTitle = title.replace(m[0], " ").replace(/\s+/g, " ").trim();
      return { startHour: 0, startMinute: 0, endHour: end.h, endMinute: end.m, title: newTitle, matched: true };
    }
  }

  // "das 10h até meio-dia" / "de 9h até meio-dia" → início X, fim 12:00
  const ateMeioDia = /(?:das?\s+)?(\d{1,2})(?::(\d{2})|\s*h(?:oras?)?\s*(\d{2})?)?\s*(?:horas?\s+da\s+)?(manh[aã]|tarde|noite)?\s+at[eé]\s+meio[- ]?dia/gi;
  m = ateMeioDia.exec(title);
  if (m && m[0]) {
    const startH = parseInt(m[1], 10);
    const startM = m[2] ? parseInt(m[2], 10) : m[3] ? parseInt(m[3], 10) : 0;
    const start = applyPeriod(startH, startM, m[4]);
    if (start.h >= 0 && start.h <= 23 && start.m >= 0 && start.m <= 59) {
      const newTitle = title.replace(m[0], " ").replace(/\s+/g, " ").trim();
      return { startHour: start.h, startMinute: start.m, endHour: 12, endMinute: 0, title: newTitle, matched: true };
    }
  }

  // "das 22h até meia-noite" → início X, fim 0:00 (meia-noite)
  const ateMeiaNoite = /(?:das?\s+)?(\d{1,2})(?::(\d{2})|\s*h(?:oras?)?\s*(\d{2})?)?\s*(?:horas?\s+da\s+)?(manh[aã]|tarde|noite)?\s+at[eé]\s+meia[- ]?noite/gi;
  m = ateMeiaNoite.exec(title);
  if (m && m[0]) {
    const startH = parseInt(m[1], 10);
    const startM = m[2] ? parseInt(m[2], 10) : m[3] ? parseInt(m[3], 10) : 0;
    const start = applyPeriod(startH, startM, m[4]);
    if (start.h >= 0 && start.h <= 23 && start.m >= 0 && start.m <= 59) {
      const newTitle = title.replace(m[0], " ").replace(/\s+/g, " ").trim();
      return { startHour: start.h, startMinute: start.m, endHour: 0, endMinute: 0, title: newTitle, matched: true };
    }
  }
  const rangeWithPeriod = /(?:das?\s+)?(\d{1,2})(?::(\d{2})|\s*h(?:oras?)?\s*(\d{2})?)?\s*(?:horas?\s+da\s+)?(manh[aã]|tarde|noite)?\s+at[eé]\s+(?:[aà]s\s+)?(\d{1,2})(?::(\d{2})|\s*h(?:oras?)?\s*(\d{2})?)?\s*(?:horas?\s+da\s+)?(manh[aã]|tarde|noite)?/gi;
  m = rangeWithPeriod.exec(title);
  if (m && m[0]) {
    const startH = parseInt(m[1], 10);
    const startM = m[2] ? parseInt(m[2], 10) : m[3] ? parseInt(m[3], 10) : 0;
    const endH = parseInt(m[5], 10);
    const endM = m[6] ? parseInt(m[6], 10) : m[7] ? parseInt(m[7], 10) : 0;
    const start = applyPeriod(startH, startM, m[4]);
    const end = applyPeriod(endH, endM, m[8]);
    if (start.h >= 0 && start.h <= 23 && end.h >= 0 && end.h <= 23 &&
        start.m >= 0 && start.m <= 59 && end.m >= 0 && end.m <= 59) {
      const newTitle = title.replace(m[0], " ").replace(/\s+/g, " ").trim();
      return { startHour: start.h, startMinute: start.m, endHour: end.h, endMinute: end.m, title: newTitle, matched: true };
    }
  }

  // "de 10h às 13h" / "das 10h às 13h" (às em vez de até)
  const rangeComAte = /(?:de\s+|das?\s+)?(\d{1,2})(?::(\d{2})|\s*h(?:oras?)?\s*(\d{2})?)?\s*(?:horas?\s+da\s+)?(manh[aã]|tarde|noite)?\s+[aà]s\s+(\d{1,2})(?::(\d{2})|\s*h(?:oras?)?\s*(\d{2})?)?\s*(?:horas?\s+da\s+)?(manh[aã]|tarde|noite)?/gi;
  m = rangeComAte.exec(title);
  if (m && m[0]) {
    const startH = parseInt(m[1], 10);
    const startM = m[2] ? parseInt(m[2], 10) : m[3] ? parseInt(m[3], 10) : 0;
    const endH = parseInt(m[5], 10);
    const endM = m[6] ? parseInt(m[6], 10) : m[7] ? parseInt(m[7], 10) : 0;
    const start = applyPeriod(startH, startM, m[4]);
    const end = applyPeriod(endH, endM, m[8]);
    if (start.h >= 0 && start.h <= 23 && end.h >= 0 && end.h <= 23 &&
        start.m >= 0 && start.m <= 59 && end.m >= 0 && end.m <= 59) {
      const newTitle = title.replace(m[0], " ").replace(/\s+/g, " ").trim();
      return { startHour: start.h, startMinute: start.m, endHour: end.h, endMinute: end.m, title: newTitle, matched: true };
    }
  }

  // Fallback: intervalo simples "das 10h até 13h", "10:15 até 12h40", "10h-13h"
  const rangeRegex = /(?:das?\s+)?(\d{1,2})(?::(\d{2})|\s*h(\d{2})?|\s*h(?:oras?)?)?\s+at[eé]\s+(?:[aà]s\s+)?(\d{1,2})(?::(\d{2})|\s*h(\d{2})?|\s*h(?:oras?)?)?/gi;
  m = rangeRegex.exec(title);
  if (m && m[0]) {
    const startHour = parseInt(m[1], 10);
    const startMinute = m[2] ? parseInt(m[2], 10) : m[3] ? parseInt(m[3], 10) : 0;
    const endHour = parseInt(m[4], 10);
    const endMinute = m[5] ? parseInt(m[5], 10) : m[6] ? parseInt(m[6], 10) : 0;
    if (startHour >= 0 && startHour <= 23 && endHour >= 0 && endHour <= 23 && startMinute >= 0 && startMinute <= 59 && endMinute >= 0 && endMinute <= 59) {
      const newTitle = title.replace(m[0], " ").replace(/\s+/g, " ").trim();
      return { startHour, startMinute, endHour, endMinute, title: newTitle, matched: true };
    }
  }
  const rangeHyphen = /(\d{1,2})(?::(\d{2})|\s*h(\d{2})?)?\s*-\s*(\d{1,2})(?::(\d{2})|\s*h(\d{2})?)?\s*h?/gi;
  m = rangeHyphen.exec(title);
  if (m && m[0]) {
    const startHour = parseInt(m[1], 10);
    const startMinute = m[2] ? parseInt(m[2], 10) : m[3] ? parseInt(m[3], 10) : 0;
    const endHour = parseInt(m[4], 10);
    const endMinute = m[5] ? parseInt(m[5], 10) : m[6] ? parseInt(m[6], 10) : 0;
    if (startHour >= 0 && startHour <= 23 && endHour >= 0 && endHour <= 23 && startMinute >= 0 && startMinute <= 59 && endMinute >= 0 && endMinute <= 59) {
      const newTitle = title.replace(m[0], " ").replace(/\s+/g, " ").trim();
      return { startHour, startMinute, endHour, endMinute, title: newTitle, matched: true };
    }
  }
  return { startHour: 0, startMinute: 0, endHour: 0, endMinute: 0, title, matched: false };
}

function extractTime(
  title: string,
  normalized: string,
  defaultHour: number,
  defaultMinute: number
): { hour: number; minute: number; title: string; matched: boolean } {
  let hour = defaultHour;
  let minute = defaultMinute;
  let newTitle = title;
  let matched = false;

  const patterns: Array<{
    regex: RegExp;
    get: (m: RegExpExecArray) => { h: number; m: number };
  }> = [
    { regex: /at[eé]\s+(?:[aà]s\s+)?(\d{1,2})(?::(\d{2})|\s*h(\d{2})?|\s*h(?:oras?)?|h(\d{2})?|h(?:oras?)?)?/gi, get: (m) => ({ h: parseInt(m[1], 10), m: m[2] ? parseInt(m[2], 10) : m[3] ? parseInt(m[3], 10) : m[4] ? parseInt(m[4], 10) : 0 }) },
    { regex: /(?:para|pra)\s+(?:[aà]s\s+)?(\d{1,2})(?::(\d{2})|\s*h(\d{2})?|\s*h(?:oras?)?|h(\d{2})?|h(?:oras?)?)?/gi, get: (m) => ({ h: parseInt(m[1], 10), m: m[2] ? parseInt(m[2], 10) : m[3] ? parseInt(m[3], 10) : m[4] ? parseInt(m[4], 10) : 0 }) },
    { regex: /[aà]s\s+(\d{1,2})(?::(\d{2})|\s*h(\d{2})?|\s*h(?:oras?)?|h(\d{2})?|h(?:oras?)?)?/gi, get: (m) => ({ h: parseInt(m[1], 10), m: m[2] ? parseInt(m[2], 10) : m[3] ? parseInt(m[3], 10) : m[4] ? parseInt(m[4], 10) : 0 }) },
    { regex: /por\s+volta\s+(?:das?\s+)?(\d{1,2})(?::(\d{2})|\s*h(\d{2})?|\s*h(?:oras?)?|h(?:oras?)?)?/gi, get: (m) => ({ h: parseInt(m[1], 10), m: m[2] ? parseInt(m[2], 10) : m[3] ? parseInt(m[3], 10) : 0 }) },
    { regex: /(?:antes|depois)\s+(?:das?\s+)?(\d{1,2})(?::(\d{2})|\s*h(\d{2})?|\s*h(?:oras?)?|h(?:oras?)?)?/gi, get: (m) => ({ h: parseInt(m[1], 10), m: m[2] ? parseInt(m[2], 10) : m[3] ? parseInt(m[3], 10) : 0 }) },
    { regex: /(?:lembrete|notificar|avisar|lembrar)\s+(?:[aà]s\s+)?(\d{1,2})(?::(\d{2})|\s*h(\d{2})?|\s*h(?:oras?)?|h(?:oras?)?)?/gi, get: (m) => ({ h: parseInt(m[1], 10), m: m[2] ? parseInt(m[2], 10) : m[3] ? parseInt(m[3], 10) : 0 }) },
    { regex: /(?:prazo|deadline)\s+(?:[aà]s\s+)?(\d{1,2})(?::(\d{2})|\s*h(\d{2})?|\s*h(?:oras?)?|h(?:oras?)?)?/gi, get: (m) => ({ h: parseInt(m[1], 10), m: m[2] ? parseInt(m[2], 10) : m[3] ? parseInt(m[3], 10) : 0 }) },
    { regex: /(?:no\s+)?hor[aá]rio\s+(?:de\s+)?(\d{1,2})(?::(\d{2})|\s*h(\d{2})?|\s*h(?:oras?)?|h(?:oras?)?)?/gi, get: (m) => ({ h: parseInt(m[1], 10), m: m[2] ? parseInt(m[2], 10) : m[3] ? parseInt(m[3], 10) : 0 }) },
    { regex: /meio[- ]?dia/gi, get: () => ({ h: 12, m: 0 }) },
    { regex: /meia[- ]?noite/gi, get: () => ({ h: 0, m: 0 }) },
    { regex: /(\d{1,2})\s+da\s+(manh[aã]|tarde|noite)/gi, get: (m) => {
      const n = parseInt(m[1], 10);
      const p = (m[2] || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
      if (p === "tarde") return { h: n <= 5 ? n + 12 : n, m: 0 };
      if (p === "noite") return { h: n <= 11 ? n + 12 : n, m: 0 };
      return { h: n, m: 0 };
    }},
    { regex: /(\d{1,2})\s*h\s*(\d{2})?/gi, get: (m) => ({ h: parseInt(m[1], 10), m: m[2] ? parseInt(m[2], 10) : 0 }) },
    { regex: /(\d{1,2}):(\d{2})\s*h?(?:oras?)?/gi, get: (m) => ({ h: parseInt(m[1], 10), m: parseInt(m[2], 10) }) },
    { regex: /\b(\d{1,2})(?::(\d{2}))?(?:\s*h(?:oras?)?)?\b/gi, get: (m) => ({ h: parseInt(m[1], 10), m: m[2] ? parseInt(m[2], 10) : 0 }) },
  ];

  for (const { regex, get } of patterns) {
    const m = regex.exec(title);
    if (m && m[0]) {
      const { h, m: min } = get(m);
      if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
        hour = h;
        minute = min;
        newTitle = title.replace(m[0], " ").replace(/\s+/g, " ").trim();
        matched = true;
        break;
      }
    }
    regex.lastIndex = 0;
  }

  return { hour, minute, title: newTitle, matched };
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
  defaultMinute = 0,
  /** Quando fornecido, usa esta data como "hoje" (ex.: dia selecionado no calendário). */
  baseDate?: Date
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

  const now = baseDate ?? new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const defaultH = baseDate ? baseDate.getHours() : defaultHour;
  const defaultM = baseDate ? baseDate.getMinutes() : defaultMinute;
  let rangeEnd: { hour: number; minute: number } | null = null;

  const rangeResult = extractTimeRange(title);
  if (rangeResult.matched) {
    title = rangeResult.title;
    hour = rangeResult.startHour;
    minute = rangeResult.startMinute;
    rangeEnd = { hour: rangeResult.endHour, minute: rangeResult.endMinute };
  } else {
    const timeResult = extractTime(title, normalized, defaultH, defaultM);
    title = timeResult.title;
    hour = timeResult.hour;
    minute = timeResult.minute;
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

  // Intervalo explícito (ex.: "do meio-dia até 13h") → confiança mínima para não marcar "baixa"
  if (rangeEnd && confidence < 0.85) confidence = 0.85;

  const iso = toUtcISO(year, month, day, hour, minute);
  const preview = formatPreview(iso);

  let isoEnd: string | undefined;
  let previewEnd: string | undefined;
  if (rangeEnd) {
    isoEnd = toUtcISO(year, month, day, rangeEnd.hour, rangeEnd.minute);
    previewEnd = formatPreview(isoEnd);
  }

  return { iso, ...(isoEnd && { isoEnd }), title, confidence, preview, ...(previewEnd && { previewEnd }) };
}
