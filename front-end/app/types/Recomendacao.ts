/** ProjetoResumoDTO — GET /recomendacoes/projetos/{userId} (até 10, ordenados por relevância). */
export interface ProjetoRecomendado {
  idProjeto: number;
  nomeProjeto: string;
  descricaoProjeto: string | null;
  visualizacoes: number | null;
  seguidores: number | null;
  metaFinanceira: number | null;
  nomeCriador: string | null;
  scoreRelevancia: number | null;
}
