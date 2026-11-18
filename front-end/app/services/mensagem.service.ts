import { api } from "../lib/api";
import { lerQuantidade } from "../lib/pagina";
import { Conversa, HistoricoMensagens, Mensagem, PermissaoMensagem } from "../types/Mensagem";

/**
 * Integração com o MensagemController (`/mensagem`). O remetente é sempre o usuário do token;
 * a regra "só com conexão aceita" é aplicada pelo backend em todo envio.
 */

/** GET /mensagem/conversas — da atividade mais recente para a mais antiga. */
export async function listarConversas(): Promise<Conversa[]> {
  return (await api<Conversa[]>("/mensagem/conversas")) ?? [];
}

/** GET /mensagem/conversas/{id} — 403 se o usuário não participa. */
export function buscarConversa(conversaId: number) {
  return api<Conversa>(`/mensagem/conversas/${conversaId}`);
}

/**
 * GET /mensagem/conversas/{id}/mensagens
 *  - sem opções: as últimas mensagens;
 *  - antesDe: as anteriores a uma mensagem;
 *  - desde: o que mudou desde o cursor da consulta anterior (atualização automática).
 */
export async function buscarMensagens(
  conversaId: number,
  opcoes: { antesDe?: number; desde?: string; limite?: number; signal?: AbortSignal } = {}
): Promise<HistoricoMensagens> {
  const params = new URLSearchParams();
  if (opcoes.antesDe) params.set("antesDe", String(opcoes.antesDe));
  if (opcoes.desde) params.set("desde", opcoes.desde);
  if (opcoes.limite) params.set("limite", String(opcoes.limite));
  const query = params.toString();
  const r = await api<HistoricoMensagens>(`/mensagem/conversas/${conversaId}/mensagens${query ? `?${query}` : ""}`, {
    signal: opcoes.signal,
  });
  return { mensagens: r?.mensagens ?? [], temMais: !!r?.temMais, cursor: r?.cursor ?? "" };
}

/**
 * POST /mensagem. `chaveCliente` identifica o envio: repetir a mesma chave (depois de uma
 * falha de rede, por exemplo) devolve a mensagem já gravada em vez de duplicá-la.
 */
export function enviarMensagem(destinatarioId: number, conteudo: string, chaveCliente: string) {
  return api<Mensagem>("/mensagem", {
    method: "POST",
    body: JSON.stringify({ destinatarioId, conteudo, chaveCliente }),
  });
}

/** PUT /mensagem/conversas/{id}/lida — devolve quantas mensagens foram marcadas. */
export async function marcarConversaComoLida(conversaId: number): Promise<number> {
  return lerQuantidade(await api<unknown>(`/mensagem/conversas/${conversaId}/lida`, { method: "PUT" }));
}

/** GET /mensagem/nao-lidas — total de mensagens recebidas e não lidas. */
export async function contarMensagensNaoLidas(): Promise<number> {
  return lerQuantidade(await api<unknown>("/mensagem/nao-lidas"));
}

/** GET /mensagem/permissao/{usuarioId} — se dá para conversar com a pessoa e, se não, por quê. */
export function buscarPermissaoMensagem(usuarioId: number) {
  return api<PermissaoMensagem>(`/mensagem/permissao/${usuarioId}`);
}

/** PUT /mensagem/{id} — só quem enviou, até 15 minutos depois e com a conexão aceita. */
export function editarMensagem(mensagemId: number, conteudo: string) {
  return api<Mensagem>(`/mensagem/${mensagemId}`, { method: "PUT", body: JSON.stringify({ conteudo }) });
}

/** DELETE /mensagem/{id} — só quem enviou; o texto some para os dois. */
export async function apagarMensagem(mensagemId: number) {
  await api<void>(`/mensagem/${mensagemId}`, { method: "DELETE" });
}
