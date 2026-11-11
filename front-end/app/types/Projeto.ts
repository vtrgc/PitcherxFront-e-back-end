
import type { FichaProjeto } from "../lib/fichaProjeto";
import type { RiscoProjeto } from "./RiscoProjeto";

export interface ProjetoRequest {
  nomeProjeto: string;
  descricaoProjeto: string;

  dataInicioProjeto: string;
  dataFimProjeto: string;
  tipoProjetoId: number;
  urlImagemProjeto?: string;
  /** Obrigatório (@NotNull) no ProjetoRequestDTO. */
  metaFinanceira: number;
  valorArrecadado?: number | null;
  /** IDs do catálogo GET /risco-projeto (@NotNull: envie [] quando não houver riscos). */
  riscoProjetoIds: number[];
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
  metaFinanceira?: number | null;
  valorArrecadado?: number | null;
  riscos?: RiscoProjeto[] | null;
  /**
   * Preenchido no front (projeto.service): ficha financeira lida do fim da descrição.
   * Quando presente, `descricaoProjeto` já vem só com o texto visível.
   */
  ficha?: FichaProjeto | null;
}

/** Filtros de GET /projeto/buscar (datas no formato ISO yyyy-MM-dd). */
export interface FiltroBuscaProjeto {
  nome?: string;
  descricao?: string;
  dataInicioDe?: string;
  dataInicioAte?: string;
}
