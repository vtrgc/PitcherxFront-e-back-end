export interface TermoVinculoRequest {
  tituloTermoVinculo: string;
  descricaoTermoVinculo: string;
  obrigatorio?: boolean;
}

/** TermoVinculoResponseDTO: cada termo pertence a um projeto (`projetoId`). */
export interface TermoVinculo {
  idTermoVinculo: number;
  projetoId: number | null;
  tituloTermoVinculo: string;
  descricaoTermoVinculo: string;
  obrigatorio: boolean | null;
}
