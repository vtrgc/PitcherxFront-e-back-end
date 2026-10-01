import { api, setToken, clearToken, ApiError } from "../lib/api";
import { Usuario } from "../types/Usuario";
import { UsuarioRequest } from "../types/UsuarioRequest";
import { LoginRequest, LoginResponse } from "../types/Login";

export function listarUsuarios() {
  return api<Usuario[]>("/usuario");
}

// ---------------------------------------------------------------------------
// GET /usuario/{id}
// ---------------------------------------------------------------------------
// No backend, `getUsuarioById(Long id)` NÃO tem @PathVariable: o Spring liga o
// parâmetro `id` à query string, não ao caminho. Chamar só `/usuario/5` faz o id
// chegar nulo e o servidor responde 500. Enviando também `?id=5` a busca funciona
// sem alterar o backend (o segmento do caminho continua necessário para casar a rota).
//
// Como o mesmo autor aparece em vários cards (posts, comentários, respostas), as
// buscas ficam em cache por página para não repetir a mesma requisição.
const cacheUsuarios = new Map<number, Promise<Usuario>>();

export function buscarUsuario(id: number, { forcar = false }: { forcar?: boolean } = {}) {
  if (!forcar) {
    const emCache = cacheUsuarios.get(id);
    if (emCache) return emCache;
  }
  const promessa = api<Usuario>(`/usuario/${id}?id=${encodeURIComponent(id)}`);
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

export function logout() {
  clearToken();
  invalidarCacheUsuario();
}

/**
 * PUT /usuario/{id}.
 *
 * ATENÇÃO — NÃO USADO PELA INTERFACE: no backend, `UsuarioService.atualizarUsuario`
 * gera o hash BCrypt da senha e, em seguida, `usuarioMapper.updateFromDTO` copia o
 * campo `senhaUsuario` do DTO (texto puro) por cima do hash. Depois disso o login
 * (`passwordEncoder.matches`) passa a falhar para o usuário. Mantido aqui apenas
 * para referência do contrato; só deve ser usado após a correção no servidor.
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
