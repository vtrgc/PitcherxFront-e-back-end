import { ApiError, api } from "../lib/api";
import { combinarFicha, lerDescricaoProjeto } from "../lib/fichaProjeto";
import { FiltroBuscaProjeto, Projeto, ProjetoRequest } from "../types/Projeto";

/**
 * Toda resposta de projeto passa por aqui: `descricaoProjeto` fica só com o texto visível e
 * `ficha` reúne os campos financeiros reais (metaFinanceira, valorArrecadado) com o complemento
 * guardado no fim da descrição (ver lib/fichaProjeto).
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

/**
 * GET /projeto/{id} está declarado com `@PreAuthorize("authenticated()")`, expressão que o
 * Spring não reconhece (o correto seria `isAuthenticated()`): o servidor responde 400 para
 * qualquer pessoa. O projeto é localizado na listagem GET /projeto, que devolve os mesmos
 * campos; a regra de acesso (aceite dos termos de vínculo) é aplicada pela página do projeto.
 */
export async function buscarProjeto(id: number) {
  const encontrado = (await listarProjetos()).find((p) => p.idProjeto === id);
  if (!encontrado) throw new ApiError(404, { message: "Projeto não encontrado." }, "Projeto não encontrado.");
  return encontrado;
}

/**
 * POST /projeto/{idUsuario}: o backend registra `idUsuario` como CRIADOR do projeto.
 * `data.descricaoProjeto` já deve vir montado com `montarDescricaoProjeto` (texto + complemento)
 * e os campos financeiros com `camposFinanceirosApi` (`metaFinanceira` é obrigatório).
 */
export async function criarProjeto(idUsuario: number, data: ProjetoRequest) {
  return normalizarProjeto(
    await api<Projeto>(`/projeto/${idUsuario}`, {
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

/** PATCH /projeto/{id}/meta-financeira — corpo é o número puro; devolve a meta salva. */
export function atualizarMetaFinanceira(id: number, valor: number) {
  return api<number>(`/projeto/${id}/meta-financeira`, { method: "PATCH", body: JSON.stringify(valor) });
}

/** PATCH /projeto/{id}/valor-arrecadado — corpo é o número puro; devolve o valor salvo. */
export function atualizarValorArrecadado(id: number, valor: number) {
  return api<number>(`/projeto/${id}/valor-arrecadado`, { method: "PATCH", body: JSON.stringify(valor) });
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
 * O backend aceita qualquer usuário vinculado ao projeto ou ADMIN.
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
