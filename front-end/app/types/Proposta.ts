/** PropostaRequestDTO. */
export interface PropostaRequest {
  descricaoProposta: string;
  valorProposta?: number | null;
  /** Projeto que recebe a proposta (necessário para o criador poder aceitar/recusar). */
  projetoId?: number | null;
}

/** "PENDENTE" | "ACEITA" | "RECUSADA" */
export type StatusProposta = "PENDENTE" | "ACEITA" | "RECUSADA";

/** PropostaResponseDTO. O backend não devolve o autor da proposta. */
export interface Proposta {
  idProposta: number;
  descricaoProposta: string;
  valorProposta: number | null;
  statusProposta?: StatusProposta | string | null;
  projetoId?: number | null;
}
