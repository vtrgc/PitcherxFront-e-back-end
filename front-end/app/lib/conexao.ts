import { Notificacao, StatusConexaoDTO, TIPO_NOTIFICACAO } from "../types/Conexao";

/**
 * Situação da relação entre o usuário logado (eu) e outra pessoa, derivada SOMENTE das
 * respostas da API (/conexao/status e listas de solicitações).
 */
export interface RelacaoConexao {
  /** Eu sigo a pessoa (conexão eu → ela ACEITA). */
  euSigo: boolean;
  /** A pessoa me segue (conexão ela → eu ACEITA). */
  meSegue: boolean;
  /** Enviei uma solicitação ainda pendente. */
  solicitacaoEnviada: boolean;
  /** Recebi uma solicitação dela ainda pendente. */
  solicitacaoRecebida: boolean;
}

export const RELACAO_VAZIA: RelacaoConexao = {
  euSigo: false,
  meSegue: false,
  solicitacaoEnviada: false,
  solicitacaoRecebida: false,
};

/**
 * Normaliza o StatusConexaoDTO. O record Java tem os componentes `isSeguidor`/`isSeguido`;
 * dependendo da versão do Jackson eles podem chegar como `seguidor`/`seguido`.
 */
export function normalizarStatus(bruto: unknown): StatusConexaoDTO {
  const d = (bruto ?? {}) as Record<string, unknown>;
  const status = d.status === "PENDENTE" || d.status === "ACEITO" || d.status === "RECUSADO" ? d.status : null;
  return {
    status,
    isSeguidor: d.isSeguidor === true || d.seguidor === true,
    isSeguido: d.isSeguido === true || d.seguido === true,
  };
}

/**
 * Combina o status (que só distingue ACEITO nos dois sentidos) com as listas de
 * solicitações pendentes (que dizem o sentido do PENDENTE).
 */
export function derivarRelacao(
  status: StatusConexaoDTO,
  pendentes: { enviadasPara: boolean; recebidasDe: boolean }
): RelacaoConexao {
  return {
    euSigo: status.isSeguidor,
    meSegue: status.isSeguido,
    solicitacaoEnviada: !status.isSeguidor && pendentes.enviadasPara,
    solicitacaoRecebida: !status.isSeguido && pendentes.recebidasDe,
  };
}

/** Rótulo do botão principal de conexão. */
export function rotuloBotaoConexao(relacao: RelacaoConexao): string {
  if (relacao.euSigo) return "Seguindo";
  if (relacao.solicitacaoEnviada) return "Solicitação enviada";
  if (relacao.meSegue) return "Seguir de volta";
  return "Seguir";
}

/**
 * O backend não expõe o ID da conexão nas listas nem no status — apenas nas respostas de
 * solicitar/aceitar/recusar e no `referenciaId` das notificações de conexão, cujo texto
 * começa com o nome de quem agiu ("Fulano quer se conectar com você.", "Fulano aceitou...").
 *
 * Esta função procura, nas notificações, o ID da conexão ligada a uma pessoa. Só devolve
 * um ID quando ele é inequívoco (um único ID para aquele nome); do contrário, null.
 */
export function idConexaoPelasNotificacoes(
  notificacoes: Notificacao[],
  tipo: (typeof TIPO_NOTIFICACAO)[keyof typeof TIPO_NOTIFICACAO],
  nomePessoa: string
): number | null {
  const nome = nomePessoa.trim();
  if (!nome) return null;
  const sufixo = tipo === TIPO_NOTIFICACAO.CONEXAO_SOLICITADA ? " quer se conectar" : tipo === TIPO_NOTIFICACAO.CONEXAO_ACEITA ? " aceitou" : " recusou";
  const ids = new Set<number>();
  for (const n of notificacoes) {
    if (n.tipo !== tipo || typeof n.referenciaId !== "number") continue;
    if ((n.mensagem ?? "").startsWith(`${nome}${sufixo}`)) ids.add(n.referenciaId);
  }
  return ids.size === 1 ? [...ids][0] : null;
}

/** Chave usada no cache local de IDs de conexão (seguidor → seguido). */
export function chaveConexao(seguidorId: number, seguidoId: number): string {
  return `${seguidorId}-${seguidoId}`;
}
