/**
 * Pesquisa e paginação feitas no cliente para as telas administrativas.
 *
 * Os endpoints de listagem do backend (`GET /area`, `/subarea`, `/especialidade`, `/endereco`,
 * `/tipo-projeto`, `/termo`, `/termo-postagem`, `/termo-vinculo`, `/usuario`, `/projeto`,
 * `/postagem`, `/comentario`) devolvem `List<...>` completas — sem `Pageable` nem filtro.
 * Por isso a tela recebe a lista inteira e pesquisa/pagina localmente.
 */

/** Minúsculas e sem acentos: "Área" e "area" casam. */
export function normalizarTexto(texto: unknown): string {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Filtra itens cujo texto (vários campos concatenados) contém TODAS as palavras do termo.
 * Termo vazio devolve a lista inteira.
 */
export function filtrarPorTermo<T>(itens: T[], termo: string, campos: (item: T) => unknown[]): T[] {
  const palavras = normalizarTexto(termo).split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return itens;
  return itens.filter((item) => {
    const texto = normalizarTexto(campos(item).filter((v) => v !== null && v !== undefined).join(" "));
    return palavras.every((p) => texto.includes(p));
  });
}

/** true quando todas as palavras do termo aparecem em algum dos campos (usado por `CrudAdmin`). */
export function correspondeBusca(termo: string, ...campos: unknown[]): boolean {
  return filtrarPorTermo([campos], termo, (c) => c).length > 0;
}

export const OPCOES_POR_PAGINA = [10, 20, 50] as const;
/** Mesmo valor de `OPCOES_POR_PAGINA` (nome usado por `components/ui/Paginacao`). */
export const TAMANHOS_PAGINA = OPCOES_POR_PAGINA;
export const POR_PAGINA_PADRAO = 10;
/** Listas em grade do usuário (Projetos, Propostas, Contratos): múltiplos de 2, 3 e 4 colunas. */
export const OPCOES_POR_PAGINA_GRADE = [12, 24, 48] as const;

export interface FatiaPaginada<T> {
  itens: T[];
  pagina: number;
  totalPaginas: number;
  total: number;
  /** Posição (1-based) do primeiro e do último item exibidos; 0 quando vazio. */
  inicio: number;
  fim: number;
}

/** Recorta a página pedida, corrigindo páginas fora do intervalo (ex.: após excluir). */
export function paginar<T>(itens: T[], pagina: number, porPagina: number): FatiaPaginada<T> {
  const tamanho = Math.max(1, Math.floor(porPagina) || POR_PAGINA_PADRAO);
  const total = itens.length;
  const totalPaginas = Math.max(1, Math.ceil(total / tamanho));
  const atual = Math.min(Math.max(1, Math.floor(pagina) || 1), totalPaginas);
  const inicioIdx = (atual - 1) * tamanho;
  const fatia = itens.slice(inicioIdx, inicioIdx + tamanho);
  return {
    itens: fatia,
    pagina: atual,
    totalPaginas,
    total,
    inicio: total === 0 ? 0 : inicioIdx + 1,
    fim: inicioIdx + fatia.length,
  };
}

/**
 * Números de página a exibir, com reticências: [1, "…", 4, 5, 6, "…", 12].
 * Sempre mostra a primeira, a última e `vizinhos` páginas ao redor da atual.
 */
export function paginasVisiveis(atual: number, total: number, vizinhos = 1): (number | "…")[] {
  if (total <= 1) return [1];
  const paginas = new Set<number>([1, total]);
  for (let p = atual - vizinhos; p <= atual + vizinhos; p++) if (p >= 1 && p <= total) paginas.add(p);
  const ordenadas = [...paginas].sort((a, b) => a - b);
  const resultado: (number | "…")[] = [];
  ordenadas.forEach((p, i) => {
    const anterior = ordenadas[i - 1];
    if (anterior !== undefined && p - anterior === 2) resultado.push(anterior + 1);
    else if (anterior !== undefined && p - anterior > 2) resultado.push("…");
    resultado.push(p);
  });
  return resultado;
}
