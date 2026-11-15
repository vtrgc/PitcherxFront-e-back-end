/** PropostaRequestDTO. */
export interface PropostaRequest {
  descricaoProposta: string;
  valorProposta?: number | null;
  /** Projeto que recebe a proposta (necessário para o criador poder aceitar/recusar). */
  projetoId?: number | null;
  /** Preenchido no front (proposta.service). */
  autor?: AutorProposta | null;
}

/** "PENDENTE" | "ACEITA" | "RECUSADA" */
export type StatusProposta = "PENDENTE" | "ACEITA" | "RECUSADA";

import type { AutorProposta } from "../lib/autoriaProposta";

/**
 * PropostaResponseDTO. O backend não devolve o autor: `autor` é lido do bloco de autoria que o
 * front anexa à descrição (ver lib/autoriaProposta); `descricaoProposta` já vem sem o bloco.
 */
export interface Proposta {
  idProposta: number;
  descricaoProposta: string;
  valorProposta: number | null;
  statusProposta?: StatusProposta | string | null;
  projetoId?: number | null;
  /** Preenchido no front (proposta.service). */
  autor?: AutorProposta | null;
}
