import { api } from "../lib/api";
import { textoDaDescricao } from "../lib/fichaProjeto";
import { ProjetoRecomendado } from "../types/Recomendacao";

/** GET /recomendacoes/projetos/{userId} — até 10 projetos ordenados por relevância. */
export async function listarRecomendacoes(userId: number): Promise<ProjetoRecomendado[]> {
  const lista = await api<ProjetoRecomendado[]>(`/recomendacoes/projetos/${userId}`);
  return (lista ?? []).map((p) => ({ ...p, descricaoProjeto: textoDaDescricao(p.descricaoProjeto) }));
}
