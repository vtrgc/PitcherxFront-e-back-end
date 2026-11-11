/** Enum Denuncia.TipoDenuncia do backend. */
export type TipoDenuncia = "PERFIL" | "POSTAGEM" | "PROJETO" | "COMENTARIO";
export type StatusDenuncia = "PENDENTE" | "ACEITA" | "REJEITADA";
export type PrioridadeDenuncia = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";

/** DenunciaRequestDTO — POST /denuncia. */
export interface DenunciaRequest {
  tipoDenuncia: TipoDenuncia;
  alvoId: number;
  /** Código da categoria (GET /denuncia/categorias). */
  categoria: string;
  descricao?: string;
}

/** DenunciaResponseDTO. A identidade do denunciante não é devolvida. */
export interface Denuncia {
  idDenuncia: number;
  tipoDenuncia: TipoDenuncia;
  alvoId: number;
  categoria: string;
  descricao: string | null;
  status: StatusDenuncia;
  prioridade: PrioridadeDenuncia | null;
  dataCriacao: string | null;
  dataDecisao: string | null;
  decisaoAdmin: string | null;
  acaoTomada: string | null;
  apelacaoSolicitada: boolean | null;
}

/** DenunciaCategoriaDTO. */
export interface CategoriaDenuncia {
  codigo: string;
  descricao: string;
  tipoDenuncia: string | null;
}

/** DenunciaAdminDecisionDTO. */
export interface DecisaoDenuncia {
  status: "ACEITA" | "REJEITADA";
  decisaoAdmin: string;
  acaoTomada?: string;
}

export const ACOES_DENUNCIA = [
  { id: "NENHUMA", rotulo: "Nenhuma ação" },
  { id: "MANTIDO", rotulo: "Conteúdo mantido" },
  { id: "SENSIVEL", rotulo: "Marcado como sensível" },
  { id: "OCULTO", rotulo: "Conteúdo ocultado" },
  { id: "REMOVIDO", rotulo: "Conteúdo removido" },
  { id: "BANIMENTO_TEMPORARIO", rotulo: "Banimento temporário" },
  { id: "BANIMENTO_PERMANENTE", rotulo: "Banimento permanente" },
] as const;

export const ROTULO_TIPO_DENUNCIA: Record<TipoDenuncia, string> = {
  PERFIL: "Perfil",
  POSTAGEM: "Publicação",
  PROJETO: "Projeto",
  COMENTARIO: "Comentário",
};

export const ROTULO_STATUS_DENUNCIA: Record<StatusDenuncia, string> = {
  PENDENTE: "Em análise",
  ACEITA: "Procedente",
  REJEITADA: "Improcedente",
};

export const ROTULO_PRIORIDADE: Record<PrioridadeDenuncia, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  CRITICA: "Crítica",
};
