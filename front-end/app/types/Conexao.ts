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
  /** Ver TIPO_NOTIFICACAO (conexões, contrapropostas, denúncias, identidade e nível de conta). */
  tipo: string;
  /** Conexão: ID da conexão · contraproposta: ID da contraproposta · denúncia: ID da denúncia · identidade/nível: ID do usuário. */
  referenciaId: number | null;
  lida: boolean;
  dataCriacao: string | null;
}

export const TIPO_NOTIFICACAO = {
  CONEXAO_SOLICITADA: "CONEXAO_SOLICITADA",
  CONEXAO_ACEITA: "CONEXAO_ACEITA",
  CONEXAO_RECUSADA: "CONEXAO_RECUSADA",
  CONTRAPROPOSTA_RECEBIDA: "CONTRAPROPOSTA_RECEBIDA",
  CONTRAPROPOSTA_ACEITA: "CONTRAPROPOSTA_ACEITA",
  CONTRAPROPOSTA_REJEITADA: "CONTRAPROPOSTA_REJEITADA",
  DENUNCIA_NOVA: "DENUNCIA_NOVA",
  DENUNCIA_APELACAO: "DENUNCIA_APELACAO",
  DENUNCIA_RESULTADO: "DENUNCIA_RESULTADO",
  COMPROVANTE_IDENTIDADE_NOVO: "COMPROVANTE_IDENTIDADE_NOVO",
  IDENTIDADE_APROVADA: "IDENTIDADE_APROVADA",
  IDENTIDADE_REPROVADA: "IDENTIDADE_REPROVADA",
  NIVEL_CONTA_ALTERADO: "NIVEL_CONTA_ALTERADO",
  NIVEL_CONTA_EVOLUICAO: "NIVEL_CONTA_EVOLUICAO",
} as const;

/** Página normalizada (o Spring pode serializar `Page` em dois formatos; ver lib/pagina). */
export interface Pagina<T> {
  itens: T[];
  total: number;
  pagina: number;
  totalPaginas: number;
  ultima: boolean;
}
