export interface LoginRequest {
  emailUsuario: string;
  senhaUsuario: string;
}

/** Entidade Role serializada pelo backend dentro de LoginResponseDTO. */
export interface LoginRole {
  idRole?: number;
  nomeRole: string;
}

/**
 * LoginResponseDTO. O record Java tem o componente `boolean isActive`; o Jackson
 * serializa como "isActive" (records usam o nome do componente). Tratamos também
 * "active" por segurança.
 */
export interface LoginResponse {
  idUsuario: number;
  nomeUsuario: string;
  emailUsuario: string;
  isActive?: boolean;
  active?: boolean;
  token: string;
  roles: LoginRole[];
}
