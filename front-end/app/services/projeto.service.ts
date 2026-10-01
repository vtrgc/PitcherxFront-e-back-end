import { api } from "../lib/api";
import { FiltroBuscaProjeto, Projeto, ProjetoRequest } from "../types/Projeto";

export function listarProjetos() {
  return api<Projeto[]>("/projeto");
}

export function buscarProjeto(id: number) {
  return api<Projeto>(`/projeto/${id}`);
}

export function criarProjeto(data: ProjetoRequest) {
  return api<Projeto>("/projeto", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarProjeto(id: number, data: ProjetoRequest) {
  return api<Projeto>(`/projeto/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
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
export function buscarProjetos(filtro: FiltroBuscaProjeto) {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtro)) {
    if (typeof valor === "string" && valor.trim()) params.set(chave, valor.trim());
  }
  const query = params.toString();
  return api<Projeto[]>(`/projeto/buscar${query ? `?${query}` : ""}`);
}

/**
 * PUT /projeto/{id}/imagens (multipart, campo "arquivos", 1 a 10) — substitui a galeria.
 * Somente usuários vinculados ao projeto (projeto-usuario) ou ADMIN.
 */
export function substituirImagensProjeto(id: number, arquivos: File[]) {
  const formData = new FormData();
  arquivos.forEach((arquivo) => formData.append("arquivos", arquivo));
  return api<Projeto>(`/projeto/${id}/imagens`, { method: "PUT", body: formData, timeoutMs: 120000 });
}

/** DELETE /projeto/{id}/imagens — remove todas as imagens. */
export function removerImagensProjeto(id: number) {
  return api<void>(`/projeto/${id}/imagens`, { method: "DELETE" });
}
