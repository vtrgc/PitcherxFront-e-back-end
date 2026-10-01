import { Pagina } from "../types/Conexao";

/**
 * Normaliza um `Page<T>` do Spring Data. Dependendo da configuração, o backend serializa:
 *  - formato clássico (PageImpl): { content, totalElements, totalPages, number, last, ... }
 *  - formato PagedModel (padrão nas versões recentes): { content, page: { size, number, totalElements, totalPages } }
 * A tela trabalha sempre com o formato normalizado.
 */
export function normalizarPagina<T>(bruto: unknown): Pagina<T> {
  if (Array.isArray(bruto)) {
    return { itens: bruto as T[], total: bruto.length, pagina: 0, totalPaginas: 1, ultima: true };
  }
  const dados = (bruto ?? {}) as Record<string, unknown>;
  const itens = Array.isArray(dados.content) ? (dados.content as T[]) : [];
  const meta = (dados.page && typeof dados.page === "object" ? dados.page : dados) as Record<string, unknown>;
  const numero = (v: unknown, padrao: number) => (typeof v === "number" && Number.isFinite(v) ? v : padrao);
  const pagina = numero(meta.number, 0);
  const totalPaginas = numero(meta.totalPages, itens.length > 0 ? 1 : 0);
  const total = numero(meta.totalElements, itens.length);
  const ultima = typeof dados.last === "boolean" ? dados.last : pagina + 1 >= totalPaginas;
  return { itens, total, pagina, totalPaginas, ultima };
}

/** Lê `{ "quantidade": n }` (contadores de /conexao). */
export function lerQuantidade(bruto: unknown): number {
  const valor = (bruto as { quantidade?: unknown } | null)?.quantidade;
  const n = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
