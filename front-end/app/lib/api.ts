/**
 * Camada única de comunicação HTTP com o PitcherX-BackEnd.
 *
 * Contrato do backend (Spring Security, stateless, JWT):
 *  - O token vem em `POST /usuario/login` e deve ir em `Authorization: Bearer <token>`.
 *  - O backend NÃO tem entrypoint 401 configurado: requisições sem token válido
 *    (ausente, expirado ou adulterado) recebem **403**. Por isso, um 403 com um token
 *    expirado no navegador é tratado aqui como "sessão expirada".
 *  - Erros seguem o formato do GlobalExceptionHandler: { message, errorCode, errors?, timestamp }.
 */

/**
 * Prefixo das chamadas à API. É um caminho do próprio front: o `next.config.js` repassa
 * `/api-backend/*` para o backend (BACKEND_URL / NEXT_PUBLIC_API_URL). Chamar o backend
 * direto do navegador esbarra no CORS (o preflight das requisições com token recebe 403).
 */
export const API_URL = "/api-backend";

/** Tempo máximo de espera de uma requisição antes de desistir (ms). */
const TIMEOUT_PADRAO_MS = 20000;

export interface ApiErrorPayload {
  message?: string;
  errorCode?: number;
  errors?: Record<string, string>;
  timestamp?: string;
}

export class ApiError extends Error {
  status: number;
  payload: ApiErrorPayload | null;

  constructor(status: number, payload: ApiErrorPayload | null, fallbackMessage: string) {
    super(mensagemDoErro(status, payload, fallbackMessage));
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }

  /** Erros de validação por campo (400 do @Valid), quando o backend os envia. */
  get errosDeCampo(): Record<string, string> {
    return this.payload?.errors ?? {};
  }
}

/** Falha de rede, CORS ou timeout — a requisição nem chegou a ter resposta HTTP. */
export class NetworkError extends Error {
  timeout: boolean;
  constructor(timeout: boolean) {
    super(
      timeout
        ? "O servidor demorou demais para responder. Tente novamente."
        : "Não foi possível conectar ao servidor. Verifique sua conexão ou se o backend está disponível."
    );
    this.name = "NetworkError";
    this.timeout = timeout;
  }
}

function mensagemDoErro(status: number, payload: ApiErrorPayload | null, fallback: string): string {
  // 5xx: o backend devolve uma mensagem genérica; não expomos detalhes internos.
  if (status >= 500) {
    return "Ocorreu um erro no servidor. Tente novamente em instantes.";
  }
  const erros = payload?.errors;
  if (erros && Object.keys(erros).length > 0) {
    return Object.values(erros).join(" ");
  }
  if (payload?.message) {
    // "Acesso negado: Access Denied" (AuthorizationDeniedException) não é útil ao usuário.
    if (status === 403 && /^Acesso negado/i.test(payload.message)) {
      return "Você não tem permissão para realizar esta ação.";
    }
    return payload.message;
  }
  if (status === 403) return "Você não tem permissão para realizar esta ação.";
  if (status === 404) return "Registro não encontrado.";
  return fallback;
}

/**
 * Extrai uma mensagem amigável de qualquer erro lançado pela camada de API.
 *
 * Em erros 5xx o backend devolve sempre o mesmo texto genérico (GlobalExceptionHandler),
 * inclusive quando a causa é uma restrição do banco (registro em uso, valor duplicado...).
 * Nesses casos, se a tela informou uma mensagem própria (`fallback`), ela é mais útil ao
 * usuário do que o texto genérico e é a que exibimos.
 */
export function mensagemErro(error: unknown, fallback?: string): string {
  const padrao = "Não foi possível concluir a operação.";
  if (error instanceof ApiError) {
    if (error.status >= 500 && fallback) return fallback;
    return error.message || fallback || padrao;
  }
  if (error instanceof NetworkError) return error.message || fallback || padrao;
  return fallback || padrao;
}

// ---------------------------------------------------------------------------
// Token (JWT)
// ---------------------------------------------------------------------------

const TOKEN_STORAGE_KEY = "pitcherx:token";
export const EVENTO_SESSAO_EXPIRADA = "pitcherx:sessao-expirada";

function lerStorage(chave: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(chave);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return lerStorage(TOKEN_STORAGE_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    /* armazenamento indisponível (modo privado etc.) */
  }
}

export function clearToken() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* ignora */
  }
}

interface JwtPayload {
  exp?: number;
  sub?: string;
  idUsuario?: number;
  roles?: string[];
}

/** Lê (sem validar assinatura — isso é papel do servidor) o payload do JWT. */
export function decodificarToken(token: string | null): JwtPayload | null {
  if (!token) return null;
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  try {
    const base64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");
    const preenchido = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const binario = atob(preenchido);
    const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as JwtPayload;
  } catch {
    return null;
  }
}

/** true quando o token não existe, é ilegível ou já passou do `exp`. */
export function tokenExpirado(token: string | null, agoraMs = Date.now()): boolean {
  const payload = decodificarToken(token);
  if (!payload) return true;
  if (typeof payload.exp !== "number") return false;
  return payload.exp * 1000 <= agoraMs;
}

function notificarSessaoExpirada() {
  clearToken();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
  }
}

// ---------------------------------------------------------------------------
// Requisição
// ---------------------------------------------------------------------------

export interface ApiOptions extends RequestInit {
  /** Timeout em ms (padrão 20s). */
  timeoutMs?: number;
  /** Não anexar o token (ex.: login, cadastro, recuperação de senha). */
  semAutenticacao?: boolean;
}

export async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { timeoutMs = TIMEOUT_PADRAO_MS, semAutenticacao = false, headers: headersExtras, signal, ...resto } = options;
  const token = semAutenticacao ? null : getToken();

  // FormData (upload): o navegador define o Content-Type com o boundary do multipart.
  const isFormData = typeof FormData !== "undefined" && resto.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(isFormData || resto.body === undefined ? {} : { "Content-Type": "application/json" }),
    ...(headersExtras as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  let response: Response;
  try {
    // O backend é stateless (JWT no header): não há cookie de sessão para enviar.
    response = await fetch(`${API_URL}${endpoint}`, {
      ...resto,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error; // cancelamento pedido pelo chamador
    throw new NetworkError(controller.signal.aborted);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;
    try {
      const texto = await response.text();
      payload = texto ? (JSON.parse(texto) as ApiErrorPayload) : null;
    } catch {
      payload = null;
    }

    // 401 (se um dia existir) ou 403 com token vencido => sessão expirada.
    if (token && (response.status === 401 || (response.status === 403 && tokenExpirado(token)))) {
      notificarSessaoExpirada();
      throw new ApiError(response.status, { message: "Sua sessão expirou. Entre novamente." }, "Sessão expirada.");
    }

    throw new ApiError(response.status, payload, "Erro ao acessar a API. Tente novamente.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const texto = await response.text();
  if (!texto) return undefined as T;
  try {
    return JSON.parse(texto) as T;
  } catch {
    return texto as unknown as T;
  }
}

/**
 * Executa `tarefa` para cada item com no máximo `limite` requisições simultâneas.
 * Usado onde a API não oferece agregação (ex.: contagem de curtidas por conteúdo).
 */
export async function mapComLimite<T, R>(itens: T[], limite: number, tarefa: (item: T) => Promise<R>): Promise<PromiseSettledResult<R>[]> {
  const resultados: PromiseSettledResult<R>[] = new Array(itens.length);
  let proximo = 0;
  async function trabalhador() {
    while (proximo < itens.length) {
      const i = proximo++;
      try {
        resultados[i] = { status: "fulfilled", value: await tarefa(itens[i]) };
      } catch (reason) {
        resultados[i] = { status: "rejected", reason };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, trabalhador));
  return resultados;
}
