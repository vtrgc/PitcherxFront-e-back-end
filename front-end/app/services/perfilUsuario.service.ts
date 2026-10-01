import { api } from "../lib/api";
import { PerfilUsuario, PerfilUsuarioRequest } from "../types/PerfilUsuario";
import { Especialidade } from "../types/PerfilUsuario";

export interface EspecialidadeRequest {
  nomeEspecialidade: string;
}

export function listarEspecialidades() {
  return api<Especialidade[]>("/especialidade");
}

export function buscarEspecialidade(id: number) {
  return api<Especialidade>(`/especialidade/${id}`);
}

export function criarEspecialidade(data: EspecialidadeRequest) {
  return api<Especialidade>("/especialidade", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarEspecialidade(id: number, data: EspecialidadeRequest) {
  return api<Especialidade>(`/especialidade/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function excluirEspecialidade(id: number) {
  return api<void>(`/especialidade/${id}`, {
    method: "DELETE",
  });
}

/** Perfis profissionais. Registros sem usuário vinculado são ignorados (a tela precisa do usuário). */
export async function listarPerfisUsuario() {
  const perfis = await api<PerfilUsuario[]>("/perfil-usuario");
  return (perfis ?? []).filter((p) => p && p.usuario && typeof p.usuario.idUsuario === "number");
}

export function buscarPerfilUsuario(id: number) {
  return api<PerfilUsuario>(`/perfil-usuario/${id}`);
}

export function criarPerfilUsuario(data: PerfilUsuarioRequest) {
  return api<PerfilUsuario>("/perfil-usuario", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarPerfilUsuario(id: number, data: PerfilUsuarioRequest) {
  return api<PerfilUsuario>(`/perfil-usuario/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function excluirPerfilUsuario(id: number) {
  return api<void>(`/perfil-usuario/${id}`, {
    method: "DELETE",
  });
}

/**
 * O backend não tem busca de perfil por usuário: filtramos a listagem geral.
 * Retorna null quando o usuário ainda não completou o perfil.
 */
export async function buscarPerfilDoUsuario(idUsuario: number): Promise<PerfilUsuario | null> {
  const perfis = await listarPerfisUsuario();
  return (perfis ?? []).find((p) => p.usuario?.idUsuario === idUsuario) ?? null;
}

/** POST /perfil-usuario/{id}/banner (multipart, campo "arquivo") — dono do perfil ou ADMIN. */
export function atualizarBanner(idPerfilUsuario: number, arquivo: File) {
  const formData = new FormData();
  formData.append("arquivo", arquivo);
  return api<PerfilUsuario>(`/perfil-usuario/${idPerfilUsuario}/banner`, {
    method: "POST",
    body: formData,
    timeoutMs: 60000,
  });
}

/** DELETE /perfil-usuario/{id}/banner. */
export function removerBanner(idPerfilUsuario: number) {
  return api<void>(`/perfil-usuario/${idPerfilUsuario}/banner`, { method: "DELETE" });
}
