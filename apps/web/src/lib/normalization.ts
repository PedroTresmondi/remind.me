/** Normaliza texto PT-BR para matching e parsing: lowercase, sem acentos, espaços colapsados */
export function normalizePtBr(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Slug simples para #todo:slug (remove acentos, espaços -> hífen) */
export function toSlug(text: string): string {
  return normalizePtBr(text).replace(/\s+/g, "-");
}
