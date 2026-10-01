import { api } from "../lib/api";
import { ProjetoUsuario, ProjetoUsuarioRequest, TIPO_VINCULO_ID } from "../types/ProjetoUsuario";

export function listarPorProjeto(idProjeto: number) {
  return api<ProjetoUsuario[]>(`/projeto-usuario/projeto/${idProjeto}`);
}

export function listarPorUsuario(idUsuario: number) {
  return api<ProjetoUsuario[]>(`/projeto-usuario/usuario/${idUsuario}`);
}

export function buscarProjetoUsuario(id: number) {
  return api<ProjetoUsuario>(`/projeto-usuario/${id}`);
}

export function vincularUsuario(data: ProjetoUsuarioRequest) {
  return api<ProjetoUsuario>("/projeto-usuario", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarVinculo(id: number, data: ProjetoUsuarioRequest) {
  return api<ProjetoUsuario>(`/projeto-usuario/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function removerVinculo(id: number) {
  return api<void>(`/projeto-usuario/${id}`, {
    method: "DELETE",
  });
}

/** IDs dos projetos em que o usuário é CRIADOR (dono). */
export async function listarIdsProjetosCriados(idUsuario: number): Promise<Set<number>> {
  const vinculos = await listarPorUsuario(idUsuario);
  return new Set(
    (vinculos ?? []).filter((v) => v.tipoVinculoId === TIPO_VINCULO_ID.CRIADOR).map((v) => v.projetoId)
  );
}
