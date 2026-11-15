import { api, setToken, clearToken, ApiError } from "../lib/api";
import { Usuario } from "../types/Usuario";
import { UsuarioRequest } from "../types/UsuarioRequest";
import { LoginRequest, LoginResponse } from "../types/Login";
import { Pagina } from "../types/Conexao";
import { normalizarPagina } from "../lib/pagina";

export function listarUsuarios() {
  return api<Usuario[]>("/usuario");
}

// ---------------------------------------------------------------------------
// GET /usuario/{id} (dados pessoais de terceiros vêm ocultos pelo backend).
// Como o mesmo autor aparece em vários cards (posts, comentários, respostas), as
// buscas ficam em cache por página para não repetir a mesma requisição.
const cacheUsuarios = new Map<number, Promise<Usuario>>();

export function buscarUsuario(id: number, { forcar = false }: { forcar?: boolean } = {}) {
  if (!forcar) {
    const emCache = cacheUsuarios.get(id);
    if (emCache) return emCache;
  }
  const promessa = api<Usuario>(`/usuario/${id}`);
  cacheUsuarios.set(id, promessa);
  promessa.catch(() => cacheUsuarios.delete(id));
  return promessa;
}

/** Remove um usuário do cache (ex.: após editar nome/foto). Sem id, limpa tudo. */
export function invalidarCacheUsuario(id?: number) {
  if (id === undefined) cacheUsuarios.clear();
  else cacheUsuarios.delete(id);
}

export function cadastrarUsuario(data: UsuarioRequest) {
  return api<Usuario>("/usuario/cadastro-usuario", {
    method: "POST",
    body: JSON.stringify(data),
    semAutenticacao: true,
  });
}

export async function login(data: LoginRequest) {
  const response = await api<LoginResponse>("/usuario/login", {
    method: "POST",
    body: JSON.stringify(data),
    semAutenticacao: true,
  });

  if (!response?.token) {
    throw new ApiError(500, null, "Resposta de login inválida.");
  }
  setToken(response.token);
  return response;
}

/**
 * POST /usuario/verificar-conta — confirma, para a conta LOGADA, o código de 6 dígitos enviado
 * por e-mail no cadastro. Exige o token, então acontece no primeiro acesso, depois que a
 * administração aprova a identidade (só então o login é liberado).
 */
export async function verificarConta(codigoVerificacao: string) {
  const usuario = await api<Usuario>("/usuario/verificar-conta", {
    method: "POST",
    body: JSON.stringify({ codigoVerificacao }),
  });
  invalidarCacheUsuario(usuario?.idUsuario);
  return usuario;
}

/** POST /usuario/reenviar-codigo-verificacao — gera e envia por e-mail um novo código (204). */
export async function reenviarCodigoVerificacao() {
  await api<void>("/usuario/reenviar-codigo-verificacao", { method: "POST" });
}

export function logout() {
  clearToken();
  invalidarCacheUsuario();
}

/**
 * PUT /usuario/{id} — nome, e-mail e telefone. `senhaUsuario` é a senha ATUAL, usada pelo
 * backend como confirmação (a troca de senha é feita em redefinirSenha).
 */
export async function atualizarUsuario(id: number, data: UsuarioRequest) {
  const atualizado = await api<Usuario>(`/usuario/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  invalidarCacheUsuario(id);
  return atualizado;
}

export async function atualizarFotoUsuario(id: number, arquivo: File) {
  const formData = new FormData();
  formData.append("arquivo", arquivo);

  const atualizado = await api<Usuario>(`/usuario/${id}/foto`, {
    method: "POST",
    body: formData,
    timeoutMs: 60000,
  });
  invalidarCacheUsuario(id);
  return atualizado;
}

export async function removerFotoUsuario(id: number) {
  await api<void>(`/usuario/${id}/foto`, {
    method: "DELETE",
  });
  invalidarCacheUsuario(id);
}

export function ativarDesativarUsuario(id: number) {
  return api<Usuario>(`/usuario/ativar-desativar/${id}`, {
    method: "PUT",
  });
}

export function excluirUsuario(id: number) {
  return api<void>(`/usuario/${id}`, {
    method: "DELETE",
  });
}

/** PUT /usuario/redefinir-senha/{id} (o front usava POST, que o backend recusa com 405). */
export function redefinirSenha(id: number, senhaAtual: string, novaSenha: string) {
  return api<Usuario>(`/usuario/redefinir-senha/${id}`, {
    method: "PUT",
    body: JSON.stringify({ senhaAtual, novaSenha }),
  });
}

export function esqueciSenha(usuarioEmail: string) {
  return api<void>("/usuario/esqueci-senha", {
    method: "POST",
    body: JSON.stringify({ usuarioEmail }),
    semAutenticacao: true,
    timeoutMs: 45000, // o backend envia o e-mail de forma síncrona
  });
}

export function resetarSenha(emailUsuario: string, codigoRedefinicao: string, novaSenha: string) {
  return api<void>("/usuario/resetar-senha", {
    method: "POST",
    body: JSON.stringify({ emailUsuario, codigoRedefinicao, novaSenha }),
    semAutenticacao: true,
  });
}

/**
 * IDs de `role`. O DataInitializer do backend cria as roles na ordem do enum
 * RoleType (ADMIN, EMPRESA, USUARIO) em um banco vazio.
 */
export const ROLE_ID_MAP: Record<string, number> = {
  ADMIN: 1,
  EMPRESA: 2,
  USUARIO: 3,
};

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  EMPRESA: "Empresa",
  USUARIO: "Usuário",
};

// Um usuário pode ter mais de uma role e a ordem de um Set vindo do backend não é
// garantida: usamos prioridade fixa para decidir a role "principal" exibida.
const ROLE_PRIORITY = ["ADMIN", "EMPRESA", "USUARIO"];

export function obterRolePrincipal(roles?: string[] | null): string {
  if (!roles || roles.length === 0) return "USUARIO";
  const principal = ROLE_PRIORITY.find((role) => roles.includes(role));
  return principal || roles[0];
}

/**
 * POST /usuario/alterar-role/{idUsuario}/{idRole}.
 * Atenção: o backend ADICIONA a role ao conjunto do usuário; ele não remove as
 * roles existentes (não há endpoint para remover).
 */
export function adicionarRoleUsuario(idUsuario: number, idRole: number) {
  return api<Usuario>(`/usuario/alterar-role/${idUsuario}/${idRole}`, {
    method: "POST",
  });
}

// ---------------------------------------------------------------------------
// Verificação de identidade e nível de conta
// ---------------------------------------------------------------------------

/**
 * POST /usuario/{id}/comprovante-identidade (multipart, campo "arquivo", imagem).
 * Permitido ao próprio usuário ou ao ADMIN. Volta o status para PENDENTE e conta uma
 * tentativa (máximo de 5 após reprovação).
 */
export async function enviarComprovanteIdentidade(id: number, arquivo: File) {
  const formData = new FormData();
  formData.append("arquivo", arquivo);
  const r = await api<Usuario>(`/usuario/${id}/comprovante-identidade`, { method: "POST", body: formData, timeoutMs: 120000 });
  invalidarCacheUsuario(id);
  return r;
}

/**
 * POST /usuario/cadastro/comprovante-identidade (multipart: emailUsuario, senhaUsuario, arquivo).
 * Para quem ainda não consegue entrar — conta nova aguardando aprovação ou reprovada —, que por
 * isso não tem token para usar o endpoint acima. Recusado quando a conta já está ativa.
 */
export async function enviarFotoVerificacaoSemLogin(emailUsuario: string, senhaUsuario: string, arquivo: File) {
  const formData = new FormData();
  formData.append("emailUsuario", emailUsuario.trim());
  formData.append("senhaUsuario", senhaUsuario);
  formData.append("arquivo", arquivo);
  return api<Usuario>("/usuario/cadastro/comprovante-identidade", { method: "POST", body: formData, timeoutMs: 120000 });
}

/** GET /usuario/admin/identidade-pendentes (Page<UsuarioResponseDTO>). */
export async function listarIdentidadesPendentes(page = 0, size = 20): Promise<Pagina<Usuario>> {
  return normalizarPagina<Usuario>(await api<unknown>(`/usuario/admin/identidade-pendentes?page=${page}&size=${size}`));
}

/** POST /usuario/admin/analise-identidade/{idUsuario} — APROVADA ativa a conta; REPROVADA exige justificativa. */
export async function analisarIdentidade(idUsuario: number, status: "APROVADA" | "REPROVADA", justificativa?: string) {
  const r = await api<Usuario>(`/usuario/admin/analise-identidade/${idUsuario}`, {
    method: "POST",
    body: JSON.stringify({ status, justificativa: justificativa?.trim() || undefined }),
  });
  invalidarCacheUsuario(idUsuario);
  return r;
}

/** PUT /usuario/admin/nivel-conta/{idUsuario} — { nivelId }. */
export async function alterarNivelConta(idUsuario: number, nivelId: number) {
  const r = await api<Usuario>(`/usuario/admin/nivel-conta/${idUsuario}`, {
    method: "PUT",
    body: JSON.stringify({ nivelId }),
  });
  invalidarCacheUsuario(idUsuario);
  return r;
}

export const ROTULO_STATUS_IDENTIDADE: Record<string, string> = {
  PENDENTE: "Em análise",
  APROVADA: "Aprovada",
  REPROVADA: "Reprovada",
};

/** Limite de reenvios do comprovante após reprovação (UsuarioService). */
export const LIMITE_TENTATIVAS_IDENTIDADE = 5;
