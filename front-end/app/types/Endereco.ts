/** Contrato de EnderecoRequestDTO / EnderecoResponseDTO do backend (após a migration V20). */
export interface EnderecoRequest {
  /** Somente dígitos, máximo 8 caracteres. */
  cep: string;
  /** Sigla do estado, 2 caracteres. */
  uf: string;
  bairro: string;
  logradouro: string;
  /** Obrigatório no DTO (@NotBlank). */
  complemento: string;
  numeroCasa: number;
  usuarioId: number;
}

export interface Endereco {
  idEndereco: number;
  cep: string;
  uf: string;
  bairro: string;
  logradouro: string;
  complemento: string | null;
  numeroCasa: number;
  usuarioId: number;
}

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;
