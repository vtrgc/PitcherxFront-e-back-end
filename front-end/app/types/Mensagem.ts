/** Tipos do MensagemController (`/mensagem`). Datas chegam em ISO com fuso (Instant). */

/** SituacaoConexaoMensagem do backend: se as duas pessoas podem trocar mensagens. */
export type SituacaoConversa =
  | "CONECTADOS"
  | "PENDENTE_ENVIADA"
  | "PENDENTE_RECEBIDA"
  | "RECUSADA"
  | "SEM_CONEXAO"
  | "CONTA_INDISPONIVEL"
  | "MESMO_USUARIO";

/** ParticipanteConversaDTO — a outra pessoa da conversa. */
export interface ParticipanteConversa {
  idUsuario: number;
  nomeUsuario: string;
  urlImagemUsuario: string | null;
}

/** MensagemResponseDTO. `conteudo` é null quando a mensagem foi apagada. */
export interface Mensagem {
  idMensagem: number;
  conversaId: number;
  remetenteId: number;
  conteudo: string | null;
  dataEnvio: string;
  lida: boolean;
  dataLeitura: string | null;
  dataEdicao: string | null;
  excluida: boolean;
  minha: boolean;
}

/** ConversaResponseDTO. */
export interface Conversa {
  idConversa: number;
  participante: ParticipanteConversa;
  ultimaMensagem: Mensagem | null;
  naoLidas: number;
  podeEnviar: boolean;
  situacao: SituacaoConversa;
  motivoBloqueio: string | null;
  dataUltimaMensagem: string | null;
}

/** HistoricoMensagensDTO. `cursor` vai no parâmetro `desde` da próxima atualização. */
export interface HistoricoMensagens {
  mensagens: Mensagem[];
  temMais: boolean;
  cursor: string;
}

/** PermissaoMensagemDTO. */
export interface PermissaoMensagem {
  usuario: ParticipanteConversa;
  podeEnviar: boolean;
  situacao: SituacaoConversa;
  motivo: string | null;
  conversaId: number | null;
}

/**
 * Mensagem na tela: as do servidor e as que ainda estão sendo enviadas (otimistas), que
 * só existem neste navegador até a API confirmar.
 */
export interface MensagemNaTela extends Mensagem {
  /** Chave do envio (também identifica a mensagem otimista). */
  chaveCliente?: string;
  estadoEnvio?: "enviando" | "falhou";
  erroEnvio?: string;
}
