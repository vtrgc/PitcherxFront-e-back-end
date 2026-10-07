import { api } from "../lib/api";
import { combinarFicha, lerDescricaoProjeto } from "../lib/fichaProjeto";
import { FiltroBuscaProjeto, Projeto, ProjetoRequest } from "../types/Projeto";

/**
 * Toda resposta de projeto passa por aqui: `descricaoProjeto` fica só com o texto visível e
 * `ficha` reúne os campos financeiros reais (metaFinanceira, valorArrecadado, riscoProjeto)
 * com o complemento guardado no fim da descrição (ver lib/fichaProjeto).
 */
export function normalizarProjeto(projeto: Projeto): Projeto {
  if (!projeto || typeof projeto !== "object") return projeto;
  const { texto, ficha } = lerDescricaoProjeto(projeto.descricaoProjeto);
  return { ...projeto, descricaoProjeto: texto, ficha: combinarFicha(projeto, ficha) };
}

function normalizarLista(lista: Projeto[] | null | undefined): Projeto[] {
  return (lista ?? []).map(normalizarProjeto);
}

export async function listarProjetos() {
  return normalizarLista(await api<Projeto[]>("/projeto"));
}

export async function buscarProjeto(id: number) {
  return normalizarProjeto(await api<Projeto>(`/projeto/${id}`));
}

/**
 * `data.descricaoProjeto` já deve vir montado com `montarDescricaoProjeto` (texto + complemento)
 * e os campos financeiros com `camposFinanceirosApi` (`metaFinanceira` é obrigatório).
 */
export async function criarProjeto(data: ProjetoRequest) {
  return normalizarProjeto(
    await api<Projeto>("/projeto", {
      method: "POST",
      body: JSON.stringify(data),
    })
  );
}

export async function atualizarProjeto(id: number, data: ProjetoRequest) {
  return normalizarProjeto(
    await api<Projeto>(`/projeto/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  );
}

export function excluirProjeto(id: number) {
  return api<void>(`/projeto/${id}`, {
    method: "DELETE",
  });
}

/**
 * GET /projeto/buscar — filtros combinados com E. Observação do contrato: o backend só
 * aplica `dataInicioAte` quando `dataInicioDe` também é enviado.
 */
export async function buscarProjetos(filtro: FiltroBuscaProjeto) {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtro)) {
    if (typeof valor === "string" && valor.trim()) params.set(chave, valor.trim());
  }
  const query = params.toString();
  return normalizarLista(await api<Projeto[]>(`/projeto/buscar${query ? `?${query}` : ""}`));
}

/**
 * PUT /projeto/{id}/imagens (multipart, campo "arquivos", 1 a 10) — substitui a galeria.
 * Somente usuários vinculados ao projeto (projeto-usuario) ou ADMIN.
 */
export async function substituirImagensProjeto(id: number, arquivos: File[]) {
  const formData = new FormData();
  arquivos.forEach((arquivo) => formData.append("arquivos", arquivo));
  const projeto = await api<Projeto>(`/projeto/${id}/imagens`, { method: "PUT", body: formData, timeoutMs: 120000 });
  return projeto ? normalizarProjeto(projeto) : projeto;
}

/** DELETE /projeto/{id}/imagens — remove todas as imagens. */
export function removerImagensProjeto(id: number) {
  return api<void>(`/projeto/${id}/imagens`, { method: "DELETE" });
}
