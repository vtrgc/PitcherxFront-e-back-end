/** ContratoRequestDTO (datas LocalDateTime ISO). `propostaId` é obrigatório. */
export interface ContratoRequest {
  tituloContrato: string;
  descricaoContrato: string;
  dataInicioContrato: string;
  dataFimContrato: string;
  projetoId: number;
  propostaId: number;
}

/** "PENDENTE" (criado a partir de uma proposta) | "ACEITE" (após PUT /contrato/{id}/aceitar). */
export type StatusContrato = "PENDENTE" | "ACEITE";

/** ContratoResponseDTO. */
export interface Contrato {
  idContrato: number;
  tituloContrato: string;
  descricaoContrato: string;
  dataInicioContrato: string;
  dataFimContrato: string;
  active: boolean;
  projetoId: number;
  /** O mapeamento do backend pode devolvê-lo nulo. */
  propostaId?: number | null;
  statusContrato?: StatusContrato | string | null;
}
