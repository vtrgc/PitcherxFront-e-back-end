
export interface ProjetoRequest {
  nomeProjeto: string;
  descricaoProjeto: string;

  dataInicioProjeto: string;
  dataFimProjeto: string;
  tipoProjetoId: number;
  urlImagemProjeto?: string;
}

export interface Projeto {
  idProjeto: number;
  nomeProjeto: string;
  descricaoProjeto: string;
  dataInicioProjeto: string;
  dataFimProjeto: string;
  tipoProjetoId: number;
  active: boolean;
  /** Capa (primeira imagem da galeria). */
  urlImagemProjeto: string | null;
  /** Galeria (PUT/DELETE /projeto/{id}/imagens, até 10). */
  imagens?: string[] | null;
}

/** Filtros de GET /projeto/buscar (datas no formato ISO yyyy-MM-dd). */
export interface FiltroBuscaProjeto {
  nome?: string;
  descricao?: string;
  dataInicioDe?: string;
  dataInicioAte?: string;
}
