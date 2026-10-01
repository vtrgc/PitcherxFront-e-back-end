export interface ProjetoUsuarioRequest {
  projetoId: number;
  usuarioId: number;
  tipoVinculoId: number;
}

/** ProjetoUsuarioResponseDTO. `dataVinculo` é LocalDateTime em ISO. */
export interface ProjetoUsuario {
  idProjetoUsuario: number;
  projetoId: number;
  usuarioId: number;
  nomeUsuario: string;
  tipoVinculoId: number;
  nomeTipoVinculo: string;
  dataVinculo: string | null;
}

/**
 * IDs de `tipo_vinculo`. Não há endpoint para listá-los: o DataInitializer do backend
 * os cria nesta ordem em um banco vazio (CRIADOR, SOCIO, INVESTIDOR, VISUALIZADOR).
 */
export const TIPO_VINCULO_ID = {
  CRIADOR: 1,
  SOCIO: 2,
  INVESTIDOR: 3,
  VISUALIZADOR: 4,
} as const;

export const TIPOS_VINCULO: { id: number; nome: string; rotulo: string }[] = [
  { id: TIPO_VINCULO_ID.CRIADOR, nome: "CRIADOR", rotulo: "Criador" },
  { id: TIPO_VINCULO_ID.SOCIO, nome: "SOCIO", rotulo: "Sócio" },
  { id: TIPO_VINCULO_ID.INVESTIDOR, nome: "INVESTIDOR", rotulo: "Investidor" },
  { id: TIPO_VINCULO_ID.VISUALIZADOR, nome: "VISUALIZADOR", rotulo: "Visualizador" },
];

export function rotuloVinculo(nome?: string | null): string {
  return TIPOS_VINCULO.find((t) => t.nome === nome)?.rotulo ?? nome ?? "—";
}
