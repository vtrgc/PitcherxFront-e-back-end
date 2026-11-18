import { parseDataFlexivel } from "./date";
import { Conversa, Mensagem, MensagemNaTela, SituacaoConversa } from "../types/Mensagem";

/** Limite do backend (MensagemService.TAMANHO_MAXIMO). */
export const TAMANHO_MAXIMO_MENSAGEM = 2000;

/** Prazo do backend para editar (MensagemService.PRAZO_EDICAO). */
export const PRAZO_EDICAO_MS = 15 * 60 * 1000;

/** A versão do servidor traz algo diferente do que está na tela? */
function mudou(atual: MensagemNaTela | undefined, nova: Mensagem): boolean {
  return (
    !atual ||
    !!atual.estadoEnvio ||
    atual.conteudo !== nova.conteudo ||
    atual.excluida !== nova.excluida ||
    atual.lida !== nova.lida ||
    atual.dataEdicao !== nova.dataEdicao
  );
}

/**
 * Junta mensagens novas/alteradas às que já estão na tela, pelo id (a versão do servidor
 * sempre vence), e mantém a ordem de envio. As otimistas (sem confirmação) ficam no fim.
 * Sem nenhuma diferença, devolve a mesma lista (a tela não renderiza à toa).
 */
export function mesclarMensagens(atuais: MensagemNaTela[], novas: Mensagem[]): MensagemNaTela[] {
  if (novas.length === 0) return atuais;
  const existentes = new Map(atuais.map((m) => [m.idMensagem, m]));
  if (!novas.some((m) => mudou(existentes.get(m.idMensagem), m))) return atuais;
  const porId = new Map<number, MensagemNaTela>();
  const otimistas: MensagemNaTela[] = [];
  for (const m of atuais) {
    if (m.estadoEnvio) otimistas.push(m);
    else porId.set(m.idMensagem, m);
  }
  for (const m of novas) porId.set(m.idMensagem, { ...porId.get(m.idMensagem), ...m, estadoEnvio: undefined, erroEnvio: undefined });
  const confirmadas = [...porId.values()].sort((a, b) => a.idMensagem - b.idMensagem);
  return [...confirmadas, ...otimistas];
}

/** Texto curto da última mensagem para a lista de conversas. */
export function previaMensagem(m: Mensagem | null | undefined, tamanho = 80): string {
  if (!m) return "Nenhuma mensagem ainda";
  const prefixo = m.minha ? "Você: " : "";
  if (m.excluida) return `${prefixo}Mensagem apagada`;
  const texto = (m.conteudo ?? "").replace(/\s+/g, " ").trim();
  const curto = texto.length > tamanho ? `${texto.slice(0, tamanho - 1).trimEnd()}…` : texto;
  return `${prefixo}${curto}`;
}

function mesmoDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Horário na lista de conversas: "14:32" hoje, "Ontem", dia da semana nesta semana, depois a data. */
export function horarioCurto(valor: string | null | undefined, agora = new Date()): string {
  const data = parseDataFlexivel(valor);
  if (!data) return "";
  if (mesmoDia(data, agora)) return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const ontem = new Date(agora);
  ontem.setDate(agora.getDate() - 1);
  if (mesmoDia(data, ontem)) return "Ontem";
  const dias = (agora.getTime() - data.getTime()) / 86_400_000;
  if (dias < 6) {
    const semana = data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
    return semana.charAt(0).toUpperCase() + semana.slice(1);
  }
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: data.getFullYear() === agora.getFullYear() ? undefined : "2-digit" });
}

/** Hora de uma mensagem dentro da conversa ("14:32"). */
export function horaMensagem(valor: string | null | undefined): string {
  const data = parseDataFlexivel(valor);
  return data ? data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
}

/** Rótulo do separador de dias da conversa ("Hoje", "Ontem", "12 de novembro de 2026"). */
export function rotuloDia(valor: string | null | undefined, agora = new Date()): string {
  const data = parseDataFlexivel(valor);
  if (!data) return "";
  if (mesmoDia(data, agora)) return "Hoje";
  const ontem = new Date(agora);
  ontem.setDate(agora.getDate() - 1);
  if (mesmoDia(data, ontem)) return "Ontem";
  return data.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

/** Chave do dia local de uma data (para inserir os separadores entre mensagens). */
export function chaveDia(valor: string | null | undefined): string {
  const data = parseDataFlexivel(valor);
  return data ? `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}` : "";
}

/** Identificador do envio (idempotência no backend). */
export function gerarChaveCliente(): string {
  const c = typeof globalThis !== "undefined" ? (globalThis.crypto as Crypto | undefined) : undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Ainda dá para editar (mesmo prazo do backend; o servidor confere de novo). */
export function podeEditar(m: Mensagem, agora = Date.now()): boolean {
  if (!m.minha || m.excluida) return false;
  const envio = parseDataFlexivel(m.dataEnvio);
  return !!envio && agora - envio.getTime() < PRAZO_EDICAO_MS;
}

/** Explicação para a situação de uma conversa em que não dá para enviar. */
export function explicacaoSituacao(situacao: SituacaoConversa | null | undefined, nome: string, motivoDoServidor?: string | null): string {
  switch (situacao) {
    case "CONECTADOS":
      return "";
    case "PENDENTE_ENVIADA":
      return `Sua solicitação de conexão para ${nome} ainda não foi aceita. As mensagens são liberadas quando a conexão for aceita.`;
    case "PENDENTE_RECEBIDA":
      return `${nome} quer se conectar com você. Aceite a solicitação para liberar as mensagens.`;
    case "RECUSADA":
      return "A solicitação de conexão foi recusada. Só é possível trocar mensagens com uma conexão aceita.";
    case "SEM_CONEXAO":
      return `Você e ${nome} não estão conectados. O histórico continua disponível, mas novas mensagens só com uma conexão aceita.`;
    case "CONTA_INDISPONIVEL":
      return "Esta conta não está disponível para mensagens.";
    default:
      return motivoDoServidor || "Não é possível enviar mensagens nesta conversa.";
  }
}

/** Soma das não lidas da lista (para conferir o contador da navegação). */
export function totalNaoLidas(conversas: Conversa[]): number {
  return conversas.reduce((soma, c) => soma + Math.max(0, c.naoLidas || 0), 0);
}
