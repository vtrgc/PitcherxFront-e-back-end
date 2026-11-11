/** ContraPropostaRequestDTO — só o CRIADOR do projeto da proposta pode criar. */
export interface ContraPropostaRequest {
  descricaoContraProposta: string;
  valorContraProposta?: number | null;
  idProposta: number;
}

export type StatusContraProposta = "PENDENTE" | "ACEITA" | "REJEITADA";

/** ContraPropostaResponseDTO. */
export interface ContraProposta {
  idContraProposta: number;
  descricaoContraProposta: string;
  valorContraProposta: number | null;
  propostaId: number;
  /** Quem criou a contraproposta (o dono do projeto). */
  usuarioId?: number | null;
  usuarioNome?: string | null;
  status?: StatusContraProposta | string | null;
  dataCriacao?: string | null;
  dataDecisao?: string | null;
}

/** ContraPropostaDecisionDTO — PUT /contra-proposta/{id}/aceitar | rejeitar. */
export interface DecisaoContraProposta {
  status: "ACEITA" | "REJEITADA";
  /** Obrigatória para rejeitar. */
  justificativa?: string;
}
