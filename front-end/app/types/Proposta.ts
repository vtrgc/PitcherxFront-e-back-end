
export interface PropostaRequest {
  descricaoProposta: string;
  valorProposta?: number | null;
}

export interface Proposta {
  idProposta: number;
  descricaoProposta: string;
  valorProposta: number | null;
}
