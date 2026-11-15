/**
 * Situação de uma negociação (proposta + contrapropostas), sempre derivada dos status reais
 * devolvidos pela API. O rótulo muda conforme o papel de quem está vendo.
 *
 * Regras do backend levadas em conta:
 *  - só o CRIADOR do projeto cria contraproposta; só o AUTOR da proposta aceita/rejeita;
 *  - o autor não edita nem cancela a proposta enquanto houver contraproposta PENDENTE;
 *  - o servidor NÃO impede duas contrapropostas pendentes ao mesmo tempo — o front impede.
 */
import type { ContraProposta } from "../types/ContraProposta";
import type { Proposta } from "../types/Proposta";

export type PapelNegociacao = "dono" | "autor" | "outro";

export type CodigoSituacao =
  | "aguardando_dono" // proposta pendente, sem contraproposta em aberto
  | "contra_pendente" // há contraproposta aguardando o autor
  | "contra_aceita" // a última contraproposta foi aceita; falta o aceite final da proposta
  | "contra_rejeitada" // a última contraproposta foi rejeitada; o dono pode responder de novo
  | "aceita"
  | "recusada";

export type TomSituacao = "pendente" | "acao" | "positivo" | "negativo";

export interface SituacaoNegociacao {
  codigo: CodigoSituacao;
  rotulo: string;
  /** Texto curto explicando o próximo passo para quem está vendo. */
  dica: string;
  tom: TomSituacao;
  /** O papel de quem vê precisa agir agora. */
  minhaVez: boolean;
}

export function statusContra(c: Pick<ContraProposta, "status">): string {
  return c.status || "PENDENTE";
}

/** Contrapropostas da proposta em ordem cronológica. */
export function contrapropostasDa(propostaId: number, todas: ContraProposta[]): ContraProposta[] {
  return todas
    .filter((c) => c.propostaId === propostaId)
    .sort((a, b) => (a.dataCriacao ?? "").localeCompare(b.dataCriacao ?? "") || a.idContraProposta - b.idContraProposta);
}

export function temContraPendente(contras: ContraProposta[]): boolean {
  return contras.some((c) => statusContra(c) === "PENDENTE");
}

export function situacaoNegociacao(proposta: Proposta, contras: ContraProposta[], papel: PapelNegociacao): SituacaoNegociacao {
  const status = proposta.statusProposta || "PENDENTE";
  if (status === "ACEITA") {
    return {
      codigo: "aceita",
      rotulo: "Proposta aceita",
      dica: papel === "autor" ? "Você agora é sócio do projeto." : "O autor passou a ser sócio do projeto.",
      tom: "positivo",
      minhaVez: false,
    };
  }
  if (status === "RECUSADA") {
    return { codigo: "recusada", rotulo: "Proposta recusada", dica: "A negociação foi encerrada.", tom: "negativo", minhaVez: false };
  }
  const ultima = contras[contras.length - 1];
  if (temContraPendente(contras)) {
    return {
      codigo: "contra_pendente",
      rotulo: papel === "autor" ? "Contraproposta recebida" : papel === "dono" ? "Contraproposta enviada" : "Contraproposta em análise",
      dica:
        papel === "autor"
          ? "Aceite ou rejeite a contraproposta do criador do projeto."
          : papel === "dono"
          ? "Aguardando a resposta do autor da proposta."
          : "Aguardando a resposta do autor da proposta.",
      tom: papel === "autor" ? "acao" : "pendente",
      minhaVez: papel === "autor",
    };
  }
  if (ultima && statusContra(ultima) === "ACEITA") {
    return {
      codigo: "contra_aceita",
      rotulo: "Contraproposta aceita",
      dica: papel === "dono" ? "Os termos foram acordados: finalize aceitando a proposta." : "Aguardando o aceite final do criador do projeto.",
      tom: papel === "dono" ? "acao" : "positivo",
      minhaVez: papel === "dono",
    };
  }
  if (ultima && statusContra(ultima) === "REJEITADA") {
    return {
      codigo: "contra_rejeitada",
      rotulo: "Contraproposta rejeitada",
      dica: papel === "dono" ? "Envie uma nova contraproposta, aceite ou recuse a proposta." : "Aguardando o criador do projeto.",
      tom: papel === "dono" ? "acao" : "pendente",
      minhaVez: papel === "dono",
    };
  }
  return {
    codigo: "aguardando_dono",
    rotulo: papel === "dono" ? "Proposta recebida" : papel === "autor" ? "Proposta enviada" : "Aguardando análise",
    dica: papel === "dono" ? "Aceite, recuse ou envie uma contraproposta." : "Aguardando a análise do criador do projeto.",
    tom: papel === "dono" ? "acao" : "pendente",
    minhaVez: papel === "dono",
  };
}

/** Valor que está na mesa: o da última contraproposta aceita, senão o da proposta. */
export function valorAcordado(proposta: Proposta, contras: ContraProposta[]): number | null {
  const aceita = [...contras].reverse().find((c) => statusContra(c) === "ACEITA");
  return aceita?.valorContraProposta ?? proposta.valorProposta ?? null;
}
