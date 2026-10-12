export type StatusSolicitacao = "PENDENTE" | "ACEITE" | "RECUSADA";

export interface SolicitacaoVinculoRequest {
  tipoVinculoDesejadoId: number;
}

/** SolicitacaoVinculoResponseDTO. Datas são LocalDateTime em ISO. */
export interface SolicitacaoVinculo {
  idSolicitacaoVinculo: number;
  projetoId: number;
  nomeProjeto: string;
  solicitanteId: number;
  nomeSolicitante: string;
  emailSolicitante: string;
  tipoVinculoDesejadoId: number;
  nomeTipoVinculoDesejado: string;
  status: StatusSolicitacao | string;
  dataSolicitacao: string | null;
  dataResposta: string | null;
}

export const ROTULO_STATUS_SOLICITACAO: Record<string, string> = {
  PENDENTE: "Pendente",
  ACEITE: "Aprovada",
  RECUSADA: "Recusada",
};
