
export interface ContratoRequest {
  tituloContrato: string;
  descricaoContrato: string;

  dataInicioContrato: string;
  dataFimContrato: string;
  projetoId: number;
}

export interface Contrato {
  idContrato: number;
  tituloContrato: string;
  descricaoContrato: string;
  dataInicioContrato: string;
  dataFimContrato: string;
  active: boolean;
  projetoId: number;
}
