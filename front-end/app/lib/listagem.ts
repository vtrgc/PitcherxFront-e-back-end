/**
 * Busca e paginação no cliente para as listas que o backend devolve inteiras.
 *
 * Os endpoints de cadastro (GET /area, /subarea, /especialidade, /endereco, /termo,
 * /tipo-projeto, /usuario, /projeto, /postagem, /proposta...) devolvem `List<T>` sem
 * parâmetros de página nem de busca — a única paginação do servidor é a de /conexao.
 * Por isso a lista é carregada uma vez e filtrada/paginada aqui.
 */

/** Minúsculas e sem acentos, para comparar "Área" com "area". */
export function normalizarTexto(valor: unknown): string {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** true quando todas as palavras do termo aparecem em algum dos campos. */
export function correspondeBusca(termo: string, ...campos: unknown[]): boolean {
  const palavras = normalizarTexto(termo).split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return true;
  const alvo = campos.map(normalizarTexto).join(" ");
  return palavras.every((p) => alvo.includes(p));
}

export const TAMANHOS_PAGINA = [10, 20, 50] as const;

export interface FatiaPagina<T> {
  itens: T[];
  /** Página atual (começa em 1), já ajustada ao total. */
  pagina: number;
  totalPaginas: number;
  total: number;
  /** Posição (1-based) do primeiro e do último item exibidos; 0 quando vazio. */
  inicio: number;
  fim: number;
}

export function paginar<T>(itens: T[], pagina: number, tamanho: number): FatiaPagina<T> {
  const total = itens.length;
  const tam = Math.max(1, Math.floor(tamanho) || 10);
  const totalPaginas = Math.max(1, Math.ceil(total / tam));
  const atual = Math.min(Math.max(1, Math.floor(pagina) || 1), totalPaginas);
  const desde = (atual - 1) * tam;
  const fatia = itens.slice(desde, desde + tam);
  return {
    itens: fatia,
    pagina: atual,
    totalPaginas,
    total,
    inicio: total === 0 ? 0 : desde + 1,
    fim: desde + fatia.length,
  };
}

/** Números de página a exibir, com "…" entre faixas (ex.: 1 … 4 5 6 … 12). */
export function paginasVisiveis(atual: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const paginas = new Set([1, total, atual - 1, atual, atual + 1]);
  const ordenadas = [...paginas].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const resultado: (number | "…")[] = [];
  ordenadas.forEach((p, i) => {
    if (i > 0 && p - ordenadas[i - 1] > 1) resultado.push("…");
    resultado.push(p);
  });
  return resultado;
}
