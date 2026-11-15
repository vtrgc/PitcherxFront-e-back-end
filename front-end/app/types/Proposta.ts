/** PropostaRequestDTO. */
export interface PropostaRequest {
  descricaoProposta: string;
  valorProposta?: number | null;
  /** Projeto que recebe a proposta (necessário para o criador poder aceitar/recusar). */
  projetoId?: number | null;
  /** Autor da proposta (devolvido pelo backend). */
  usuarioId?: number | null;
  usuarioNome?: string | null;
  /** Preenchido no front (proposta.service). */
  autor?: AutorProposta | null;
}

/** "PENDENTE" | "ACEITA" | "RECUSADA" */
export type StatusProposta = "PENDENTE" | "ACEITA" | "RECUSADA";

import type { AutorProposta } from "../lib/autoriaProposta";

/**
 * PropostaResponseDTO. `autor` é montado de usuarioId/usuarioNome (ou, em propostas antigas,
 * do bloco de autoria na descrição — ver lib/autoriaProposta); `descricaoProposta` vem sem o bloco.
 */
export interface Proposta {
  idProposta: number;
  descricaoProposta: string;
  valorProposta: number | null;
  statusProposta?: StatusProposta | string | null;
  projetoId?: number | null;
  /** Autor da proposta (devolvido pelo backend). */
  usuarioId?: number | null;
  usuarioNome?: string | null;
  /** Preenchido no front (proposta.service). */
  autor?: AutorProposta | null;
}
