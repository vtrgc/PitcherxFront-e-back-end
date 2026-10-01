import { api, ApiError } from "../lib/api";
import { chaveConexao, idConexaoPelasNotificacoes, normalizarStatus } from "../lib/conexao";
import { lerQuantidade, normalizarPagina } from "../lib/pagina";
import { Conexao, ConexaoSimples, Notificacao, Pagina, StatusConexaoDTO, TIPO_NOTIFICACAO } from "../types/Conexao";

/**
 * Integração com o ConexaoController (`/conexao`): seguir, aceitar/recusar, remover,
 * listas, contadores, status entre dois usuários e notificações.
 * Todos os endpoints exigem autenticação (ADMIN, USUARIO ou EMPRESA).
 */

/** Evento disparado após qualquer alteração de conexão confirmada pela API (as telas recarregam). */
export const EVENTO_CONEXOES_ALTERADAS = "pitcherx:conexoes-alteradas";

function avisarAlteracao() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO_CONEXOES_ALTERADAS));
}

/** Tamanho usado quando a tela precisa da lista inteira (o Spring limita a 2000 por página). */
export const TAMANHO_LISTA_COMPLETA = 500;

function query(pagina: number, tamanho: number) {
  return `?page=${Math.max(0, pagina)}&size=${Math.max(1, tamanho)}`;
}

// ---------------------------------------------------------------------------
// Cache local de IDs de conexão
// ---------------------------------------------------------------------------
// O backend só informa o ID da conexão nas respostas de solicitar/aceitar/recusar e nas
// notificações. Guardamos os IDs que o próprio navegador viu para permitir "deixar de
// seguir"/"cancelar solicitação" depois de recarregar a página. É apenas um atalho: a
// fonte da verdade continua sendo a API (IDs inválidos resultam em 404 e são descartados).

const CHAVE_CACHE = "pitcherx:conexoes";

function lerCache(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const bruto = window.localStorage.getItem(CHAVE_CACHE);
    const dados = bruto ? (JSON.parse(bruto) as Record<string, number>) : {};
    return dados && typeof dados === "object" ? dados : {};
  } catch {
    return {};
  }
}

function gravarCache(dados: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHAVE_CACHE, JSON.stringify(dados));
  } catch {
    /* armazenamento indisponível */
  }
}

function lembrarConexao(conexao: Conexao | null | undefined) {
  if (!conexao?.idConexao || !conexao.seguidor?.idUsuario || !conexao.seguido?.idUsuario) return;
  const cache = lerCache();
  cache[chaveConexao(conexao.seguidor.idUsuario, conexao.seguido.idUsuario)] = conexao.idConexao;
  gravarCache(cache);
}

function esquecerConexao(idConexao: number) {
  const cache = lerCache();
  let mudou = false;
  for (const [chave, id] of Object.entries(cache)) {
    if (id === idConexao) {
      delete cache[chave];
      mudou = true;
    }
  }
  if (mudou) gravarCache(cache);
}

// ---------------------------------------------------------------------------
// Ações
// ---------------------------------------------------------------------------

/** POST /conexao/solicitar/{seguidoId} — o seguidor é o usuário do token. */
export async function solicitarConexao(seguidoId: number) {
  const conexao = await api<Conexao>(`/conexao/solicitar/${seguidoId}`, { method: "POST" });
  lembrarConexao(conexao);
  avisarAlteracao();
  return conexao;
}

/** PUT /conexao/{id}/aceitar — somente quem recebeu a solicitação. */
export async function aceitarConexao(idConexao: number) {
  const conexao = await api<Conexao>(`/conexao/${idConexao}/aceitar`, { method: "PUT" });
  lembrarConexao(conexao);
  avisarAlteracao();
  return conexao;
}

/** PUT /conexao/{id}/recusar — somente quem recebeu a solicitação. */
export async function recusarConexao(idConexao: number) {
  const conexao = await api<Conexao>(`/conexao/${idConexao}/recusar`, { method: "PUT" });
  lembrarConexao(conexao);
  avisarAlteracao();
  return conexao;
}

/** DELETE /conexao/{id} — seguidor (deixar de seguir/cancelar) ou seguido (remover seguidor). */
export async function removerConexao(idConexao: number) {
  try {
    await api<void>(`/conexao/${idConexao}`, { method: "DELETE" });
  } catch (error) {
    // ID guardado não existe mais no servidor: descarta para não tentar de novo.
    if (error instanceof ApiError && error.status === 404) esquecerConexao(idConexao);
    throw error;
  }
  esquecerConexao(idConexao);
  avisarAlteracao();
}

// ---------------------------------------------------------------------------
// Listas e contadores
// ---------------------------------------------------------------------------

async function listar(caminho: string, usuarioId: number, pagina: number, tamanho: number): Promise<Pagina<ConexaoSimples>> {
  return normalizarPagina<ConexaoSimples>(await api<unknown>(`/conexao/${caminho}/${usuarioId}${query(pagina, tamanho)}`));
}

export const listarSeguidores = (usuarioId: number, pagina = 0, tamanho = 20) => listar("seguidores", usuarioId, pagina, tamanho);
export const listarSeguindo = (usuarioId: number, pagina = 0, tamanho = 20) => listar("seguindo", usuarioId, pagina, tamanho);
/** Solicitações recebidas e ainda pendentes (os itens são quem pediu para seguir). */
export const listarSolicitacoesPendentes = (usuarioId: number, pagina = 0, tamanho = 20) =>
  listar("solicitacoes/pendentes", usuarioId, pagina, tamanho);
/** Solicitações enviadas e ainda pendentes (os itens são quem foi solicitado). */
export const listarSolicitacoesEnviadas = (usuarioId: number, pagina = 0, tamanho = 20) =>
  listar("solicitacoes/enviadas", usuarioId, pagina, tamanho);

export async function contarSeguidores(usuarioId: number) {
  return lerQuantidade(await api<unknown>(`/conexao/contar-seguidores/${usuarioId}`));
}

export async function contarSeguindo(usuarioId: number) {
  return lerQuantidade(await api<unknown>(`/conexao/contar-seguindo/${usuarioId}`));
}

export async function contarSolicitacoesPendentes(usuarioId: number) {
  return lerQuantidade(await api<unknown>(`/conexao/contar-solicitacoes-pendentes/${usuarioId}`));
}

/** GET /conexao/status/{usuarioId}/{outroUsuarioId}. */
export async function buscarStatusConexao(usuarioId: number, outroUsuarioId: number): Promise<StatusConexaoDTO> {
  return normalizarStatus(await api<unknown>(`/conexao/status/${usuarioId}/${outroUsuarioId}`));
}

// ---------------------------------------------------------------------------
// Notificações
// ---------------------------------------------------------------------------

/** GET /conexao/notificacoes — do usuário do token, mais recentes primeiro. */
export async function listarNotificacoes(pagina = 0, tamanho = 20): Promise<Pagina<Notificacao>> {
  return normalizarPagina<Notificacao>(await api<unknown>(`/conexao/notificacoes${query(pagina, tamanho)}`));
}

export async function contarNotificacoesNaoLidas() {
  return lerQuantidade(await api<unknown>("/conexao/notificacoes/nao-lidas"));
}

export function marcarNotificacaoComoLida(idNotificacao: number) {
  return api<void>(`/conexao/notificacoes/${idNotificacao}/ler`, { method: "PUT" });
}

export function marcarTodasNotificacoesComoLidas() {
  return api<void>("/conexao/notificacoes/ler-todas", { method: "PUT" });
}

// ---------------------------------------------------------------------------
// Descoberta do ID de uma conexão existente
// ---------------------------------------------------------------------------

/**
 * Encontra o ID da conexão `seguidorId → seguidoId`, necessário para aceitar, recusar ou
 * remover. Ordem: cache local (IDs vistos em respostas da API) → notificações do usuário
 * logado (o `referenciaId` das notificações de conexão). Retorna null quando não há como
 * identificar a conexão com segurança.
 *
 * @param eu        usuário logado
 * @param outro     a outra pessoa (id e nome — o nome aparece no texto da notificação)
 * @param sentido   "recebida": outro → eu (aceitar/recusar/remover seguidor);
 *                  "enviada":  eu → outro (deixar de seguir/cancelar solicitação)
 */
export async function descobrirIdConexao(
  eu: number,
  outro: { id: number; nome: string },
  sentido: "recebida" | "enviada"
): Promise<number | null> {
  const [seguidor, seguido] = sentido === "recebida" ? [outro.id, eu] : [eu, outro.id];
  const doCache = lerCache()[chaveConexao(seguidor, seguido)];
  if (typeof doCache === "number") return doCache;

  // Quem recebe a solicitação ganha uma notificação CONEXAO_SOLICITADA; quem a enviou é
  // avisado quando ela é aceita (CONEXAO_ACEITA). Não existe notificação para quem envia
  // enquanto a solicitação está pendente.
  const tipo = sentido === "recebida" ? TIPO_NOTIFICACAO.CONEXAO_SOLICITADA : TIPO_NOTIFICACAO.CONEXAO_ACEITA;
  const todas: Notificacao[] = [];
  for (let pagina = 0; pagina < 5; pagina++) {
    const resultado = await listarNotificacoes(pagina, 100);
    todas.push(...resultado.itens);
    if (resultado.ultima || resultado.itens.length === 0) break;
  }
  const id = idConexaoPelasNotificacoes(todas, tipo, outro.nome);
  if (id !== null) {
    const cache = lerCache();
    cache[chaveConexao(seguidor, seguido)] = id;
    gravarCache(cache);
  }
  return id;
}
