/**
 * Ficha financeira do projeto (meta, valor captado, participação oferecida...).
 *
 * Todos os campos são REAIS no backend (`ProjetoRequestDTO`/`ProjetoResponseDTO`):
 *  - `metaFinanceira` (obrigatório), `valorArrecadado`,
 *  - `investimentoMinimo` (obrigatório), `participacaoOferecida` (inteiro, obrigatório),
 *  - `usoRecursos`.
 * O `projeto.service` copia esses campos para `ficha`. Os riscos são uma lista do catálogo
 * (`riscoProjetoIds` / `riscos`) e não fazem parte da ficha.
 *
 * Projetos criados por versões antigas do front guardavam parte desses dados num bloco no
 * fim do `descricaoProjeto`:
 *
 *     Descrição livre do projeto...
 *
 *     <!--pitcherx:ficha {"v":1,"participacao":15}-->
 *
 * O bloco continua sendo lido (só vale quando o campo real vier vazio) e nunca é exibido —
 * toda tela usa `textoDaDescricao`. Ao salvar, o bloco deixa de ser gravado.
 */

import { parseValorMonetario } from "./validacao";

export interface FichaProjeto {
  /** Meta de captação em R$. */
  meta?: number;
  /** Valor já captado em R$. */
  captado?: number;
  /** Percentual de participação (equity) oferecido aos investidores. */
  participacao?: number;
  /** Investimento mínimo por aporte em R$. */
  investimentoMinimo?: number;
  /** Para que o dinheiro será usado (texto livre). */
  usoRecursos?: string;
}

const REGEX_BLOCO = /\s*<!--pitcherx:ficha (\{[\s\S]*?\})-->\s*$/;
export const USO_RECURSOS_MAX = 600;
/** DECIMAL(19,2) é o padrão de valores monetários do backend: usamos o mesmo teto. */
export const VALOR_MAXIMO = 99_999_999_999_999_999.99;

function numeroValido(v: unknown, max = VALOR_MAXIMO): number | undefined {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max ? v : undefined;
}

/** Remove campos vazios; devolve null se nada foi informado. */
export function normalizarFicha(f: FichaProjeto | null | undefined): FichaProjeto | null {
  if (!f) return null;
  const limpa: FichaProjeto = {};
  const meta = numeroValido(f.meta);
  const captado = numeroValido(f.captado);
  const participacao = numeroValido(f.participacao, 100);
  const minimo = numeroValido(f.investimentoMinimo);
  const uso = typeof f.usoRecursos === "string" ? f.usoRecursos.trim().slice(0, USO_RECURSOS_MAX) : "";
  if (meta !== undefined && meta > 0) limpa.meta = meta;
  if (captado !== undefined) limpa.captado = captado;
  if (participacao !== undefined && participacao > 0) limpa.participacao = participacao;
  if (minimo !== undefined && minimo > 0) limpa.investimentoMinimo = minimo;
  if (uso) limpa.usoRecursos = uso;
  return Object.keys(limpa).length > 0 ? limpa : null;
}

/** Separa o texto visível da ficha guardada na descrição. */
export function lerDescricaoProjeto(descricao: string | null | undefined): { texto: string; ficha: FichaProjeto | null } {
  const bruto = descricao ?? "";
  const achado = bruto.match(REGEX_BLOCO);
  if (!achado) return { texto: bruto.trim(), ficha: null };
  let ficha: FichaProjeto | null = null;
  try {
    const dados = JSON.parse(achado[1]) as Record<string, unknown>;
    ficha = normalizarFicha({
      meta: dados.meta as number,
      captado: dados.captado as number,
      participacao: dados.participacao as number,
      investimentoMinimo: dados.investimentoMinimo as number,
      usoRecursos: dados.usoRecursos as string,
    });
  } catch {
    ficha = null;
  }
  return { texto: bruto.slice(0, achado.index).trim(), ficha };
}

/** Texto da descrição sem a ficha (use em toda exibição/busca de projetos). */
export function textoDaDescricao(descricao: string | null | undefined): string {
  return lerDescricaoProjeto(descricao).texto;
}

/** Monta o `descricaoProjeto` para a API (o texto; os números vão nos campos próprios). */
export function montarDescricaoProjeto(texto: string, ficha?: FichaProjeto | null): string {
  void ficha; // mantido na assinatura: os números agora vão nos campos próprios do DTO
  return texto.trim();
}

/** Campos financeiros próprios do ProjetoRequestDTO. */
export function camposFinanceirosApi(ficha: FichaProjeto | null | undefined): {
  metaFinanceira: number;
  valorArrecadado: number | null;
  investimentoMinimo: number;
  participacaoOferecida: number;
  usoRecursos: string | null;
} {
  return {
    metaFinanceira: ficha?.meta ?? 0,
    valorArrecadado: ficha?.captado ?? null,
    investimentoMinimo: ficha?.investimentoMinimo ?? 0,
    participacaoOferecida: Math.round(ficha?.participacao ?? 0),
    usoRecursos: ficha?.usoRecursos?.trim() || null,
  };
}

/**
 * Junta os campos reais da resposta com o bloco legado lido da descrição. Os campos reais
 * têm prioridade; o bloco só vale para projetos criados antes desses campos existirem.
 */
export function combinarFicha(
  real: {
    metaFinanceira?: number | null;
    valorArrecadado?: number | null;
    investimentoMinimo?: number | null;
    participacaoOferecida?: number | null;
    usoRecursos?: string | null;
  },
  legado: FichaProjeto | null
): FichaProjeto | null {
  const positivo = (v: number | null | undefined) => (typeof v === "number" && v > 0 ? v : undefined);
  return normalizarFicha({
    meta: positivo(real.metaFinanceira) ?? legado?.meta,
    captado: typeof real.valorArrecadado === "number" ? real.valorArrecadado : legado?.captado,
    investimentoMinimo: positivo(real.investimentoMinimo) ?? legado?.investimentoMinimo,
    participacao: positivo(real.participacaoOferecida) ?? legado?.participacao,
    usoRecursos: real.usoRecursos?.trim() || legado?.usoRecursos,
  });
}

// ---------------------------------------------------------------------------
// Indicadores derivados (somente a partir do que foi informado)
// ---------------------------------------------------------------------------

export interface ResumoFinanceiro {
  meta: number | null;
  captado: number | null;
  /** meta − captado (nunca negativo). Só existe com meta e captado informados. */
  restante: number | null;
  /** captado / meta × 100. Pode passar de 100 quando a captação supera a meta. */
  percentual: number | null;
  metaAtingida: boolean;
}

export function resumoFinanceiro(ficha: FichaProjeto | null | undefined): ResumoFinanceiro {
  const meta = ficha?.meta ?? null;
  const captado = ficha?.captado ?? null;
  const temAmbos = meta !== null && captado !== null && meta > 0;
  return {
    meta,
    captado,
    restante: temAmbos ? Math.max(0, meta - captado) : null,
    percentual: temAmbos ? (captado / meta) * 100 : null,
    metaAtingida: temAmbos ? captado >= meta : false,
  };
}

// ---------------------------------------------------------------------------
// Formulário
// ---------------------------------------------------------------------------

export interface CamposFicha {
  meta: string;
  captado: string;
  participacao: string;
  investimentoMinimo: string;
  usoRecursos: string;
}

export const FICHA_VAZIA: CamposFicha = { meta: "", captado: "", participacao: "", investimentoMinimo: "", usoRecursos: "" };

function paraTexto(v: number | undefined) {
  return v === undefined ? "" : v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2, useGrouping: false });
}

export function camposDaFicha(ficha: FichaProjeto | null | undefined): CamposFicha {
  if (!ficha) return { ...FICHA_VAZIA };
  return {
    meta: paraTexto(ficha.meta),
    captado: paraTexto(ficha.captado),
    participacao: paraTexto(ficha.participacao),
    investimentoMinimo: paraTexto(ficha.investimentoMinimo),
    usoRecursos: ficha.usoRecursos ?? "",
  };
}

export type ErrosFicha = Partial<Record<keyof CamposFicha, string>>;

/** Valida os campos do formulário e devolve a ficha (ou os erros). */
export function validarCamposFicha(c: CamposFicha): { ficha: FichaProjeto | null; erros: ErrosFicha } {
  const erros: ErrosFicha = {};
  const ler = (campo: "meta" | "captado" | "investimentoMinimo") => {
    // Aceita também "100.000" (milhar com ponto, sem centavos) e "R$ 1.500,00".
    let bruto = c[campo].replace(/R\$\s*/i, "").trim();
    if (/^\d{1,3}(\.\d{3})+$/.test(bruto)) bruto = bruto.replace(/\./g, "");
    const v = parseValorMonetario(bruto);
    if (v === null) return undefined;
    if (Number.isNaN(v)) {
      erros[campo] = "Informe um valor válido (ex.: 150000 ou 150.000,00).";
      return undefined;
    }
    if (v > VALOR_MAXIMO) {
      erros[campo] = "Valor muito alto.";
      return undefined;
    }
    return v;
  };
  const meta = ler("meta");
  const captado = ler("captado");
  const minimo = ler("investimentoMinimo");
  if (meta !== undefined && meta <= 0) erros.meta = "A meta deve ser maior que zero.";
  if (captado !== undefined && meta === undefined && !erros.meta) erros.meta = "Informe a meta para registrar o valor captado.";
  if (minimo !== undefined && meta !== undefined && minimo > meta) erros.investimentoMinimo = "O investimento mínimo não pode ser maior que a meta.";

  let participacao: number | undefined;
  const p = c.participacao.trim().replace("%", "").replace(",", ".");
  if (p) {
    const n = Number(p);
    // participacaoOferecida é Integer no backend.
    if (!Number.isFinite(n) || n <= 0 || n > 100) erros.participacao = "Informe um percentual entre 1 e 100.";
    else if (!Number.isInteger(n)) erros.participacao = "Use um percentual inteiro (ex.: 15).";
    else participacao = n;
  }
  if (c.usoRecursos.length > USO_RECURSOS_MAX) erros.usoRecursos = `Use no máximo ${USO_RECURSOS_MAX} caracteres.`;

  if (Object.keys(erros).length > 0) return { ficha: null, erros };
  return {
    ficha: normalizarFicha({ meta, captado, participacao, investimentoMinimo: minimo, usoRecursos: c.usoRecursos }),
    erros,
  };
}
