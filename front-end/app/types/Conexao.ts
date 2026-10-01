/** Enum StatusConexao do backend. */
export type StatusConexao = "PENDENTE" | "ACEITO" | "RECUSADO";

/** UsuarioSimplesDTO (dentro de ConexaoResponseDTO). */
export interface UsuarioConexao {
  idUsuario: number;
  nomeUsuario: string;
  urlImagemUsuario: string | null;
  identificador: string | null;
}

/** ConexaoResponseDTO — devolvido por solicitar, aceitar e recusar. */
export interface Conexao {
  idConexao: number;
  seguidor: UsuarioConexao;
  seguido: UsuarioConexao;
  status: StatusConexao;
  /** LocalDateTime ISO. */
  dataSolicitacao: string | null;
  dataResposta: string | null;
}

/**
 * ConexaoSimplesDTO — itens das listas de seguidores/seguindo/solicitações.
 * Atenção: `id` é o ID do USUÁRIO (seguidor ou seguido), não o ID da conexão.
 */
export interface ConexaoSimples {
  id: number;
  nome: string;
  imagem: string | null;
  identificador: string | null;
}

/**
 * StatusConexaoDTO — GET /conexao/status/{usuarioId}/{outroUsuarioId}.
 * `status` é o da conexão usuarioId → outro (ou, se não existir, a do sentido inverso).
 * `isSeguidor`: usuarioId segue outro (ACEITO). `isSeguido`: outro segue usuarioId (ACEITO).
 */
export interface StatusConexaoDTO {
  status: StatusConexao | null;
  isSeguidor: boolean;
  isSeguido: boolean;
}

/** NotificacaoResponseDTO. */
export interface Notificacao {
  idNotificacao: number;
  titulo: string;
  mensagem: string;
  /** CONEXAO_SOLICITADA | CONEXAO_ACEITA | CONEXAO_RECUSADA (únicos tipos gerados hoje). */
  tipo: string;
  /** Para os tipos de conexão, é o ID da conexão. */
  referenciaId: number | null;
  lida: boolean;
  dataCriacao: string | null;
}

export const TIPO_NOTIFICACAO = {
  CONEXAO_SOLICITADA: "CONEXAO_SOLICITADA",
  CONEXAO_ACEITA: "CONEXAO_ACEITA",
  CONEXAO_RECUSADA: "CONEXAO_RECUSADA",
} as const;

/** Página normalizada (o Spring pode serializar `Page` em dois formatos; ver lib/pagina). */
export interface Pagina<T> {
  itens: T[];
  total: number;
  pagina: number;
  totalPaginas: number;
  ultima: boolean;
}
