/** NivelContaResponseDTO (GET /nivel-conta e `nivelConta` do usuário). */
export interface NivelConta {
  idNivelConta: number;
  /** INICIANTE | EXPLORADOR | PROFISSIONAL | ESPECIALISTA | REFERENCIA | ELITE */
  nome: string;
  descricao: string | null;
  ordem: number | null;
}

/** Status da análise do comprovante de identidade. */
export type StatusIdentidade = "PENDENTE" | "APROVADA" | "REPROVADA";

/** UsuarioResponseDTO. */
export interface Usuario {
  idUsuario: number;
  nomeUsuario: string;
  emailUsuario: string;
  telefoneUsuario: string | null;
  urlImagemUsuario: string | null;
  urlVideoUsuario?: string | null;
  /** Imagem do comprovante enviado (POST /usuario/{id}/comprovante-identidade). */
  urlComprovanteIdentidade?: string | null;
  statusAnaliseIdentidade?: StatusIdentidade | string | null;
  tentativasIdentidade?: number | null;
  active: boolean;
  roles: string[];
  nivelConta?: NivelConta | null;
}
