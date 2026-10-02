/**
 * Indicadores do projeto calculados a partir dos dados reais da API (datas e `active`).
 * A entidade StatusProjeto existe no banco, mas não tem endpoint: o status exibido é
 * derivado das datas de início/término e do campo `active`.
 */

import { parseApiDate } from "./date";
import { Projeto } from "../types/Projeto";

export type SituacaoProjeto = "inativo" | "nao_iniciado" | "em_andamento" | "encerrado";

export const ROTULO_SITUACAO: Record<SituacaoProjeto, string> = {
  inativo: "Inativo",
  nao_iniciado: "Ainda não iniciado",
  em_andamento: "Em andamento",
  encerrado: "Encerrado",
};

const DIA_MS = 24 * 60 * 60 * 1000;

function inicioDoDia(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function diasEntre(a: Date, b: Date) {
  return Math.round((inicioDoDia(b).getTime() - inicioDoDia(a).getTime()) / DIA_MS);
}

export interface LinhaDoTempo {
  situacao: SituacaoProjeto;
  /** Duração total em dias (término − início), ou null sem datas válidas. */
  duracaoDias: number | null;
  /** Dias até o início (se ainda não começou). */
  diasParaComecar: number | null;
  /** Dias até o término (se está em andamento). */
  diasRestantes: number | null;
  /** Percentual do prazo já decorrido (0–100), só em andamento/encerrado. */
  prazoDecorrido: number | null;
}

export function linhaDoTempo(projeto: Pick<Projeto, "active" | "dataInicioProjeto" | "dataFimProjeto">, hoje = new Date()): LinhaDoTempo {
  const inicio = parseApiDate(projeto.dataInicioProjeto);
  const fim = parseApiDate(projeto.dataFimProjeto);
  const duracaoDias = inicio && fim ? Math.max(0, diasEntre(inicio, fim)) : null;

  let situacao: SituacaoProjeto = "em_andamento";
  if (projeto.active === false) situacao = "inativo";
  else if (inicio && diasEntre(hoje, inicio) > 0) situacao = "nao_iniciado";
  else if (fim && diasEntre(fim, hoje) > 0) situacao = "encerrado";

  const diasParaComecar = inicio && diasEntre(hoje, inicio) > 0 ? diasEntre(hoje, inicio) : null;
  const diasRestantes = fim && situacao === "em_andamento" ? Math.max(0, diasEntre(hoje, fim)) : null;
  let prazoDecorrido: number | null = null;
  if (inicio && fim && duracaoDias && diasEntre(inicio, hoje) >= 0) {
    prazoDecorrido = Math.min(100, Math.max(0, (diasEntre(inicio, hoje) / duracaoDias) * 100));
  }
  return { situacao, duracaoDias, diasParaComecar, diasRestantes, prazoDecorrido };
}

export function formatarDias(dias: number | null): string {
  if (dias === null) return "—";
  if (dias >= 60) {
    const meses = Math.round(dias / 30);
    return `${dias.toLocaleString("pt-BR")} dias (~${meses} meses)`;
  }
  return `${dias.toLocaleString("pt-BR")} dia${dias === 1 ? "" : "s"}`;
}
