export interface RiscoProjetoRequest {
  nomeRisco: string;
  descricaoRisco?: string | null;
}

/** RiscoProjetoResponseDTO (catálogo administrado em /risco-projeto). */
export interface RiscoProjeto {
  idRiscoProjeto: number;
  nomeRisco: string;
  descricaoRisco: string | null;
}
