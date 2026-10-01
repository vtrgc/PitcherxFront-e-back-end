
export interface ContraPropostaRequest {
  descricaoContraProposta: string;
  valorContraProposta?: number | null;
  idProposta: number;
}

export interface ContraProposta {
  idContraProposta: number;
  descricaoContraProposta: string;
  valorContraProposta: number | null;
  propostaId: number;
}
