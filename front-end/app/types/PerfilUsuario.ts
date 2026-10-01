
export interface PerfilUsuarioRequest {
  linkedin: string;
  identificador: string;
  idEspecialidade: number;
  idUsuario: number;
}

export interface Especialidade {
  idEspecialidade: number;
  nomeEspecialidade: string;
}

export interface UsuarioSimples {
  idUsuario: number;
  nomeUsuario: string;
  emailUsuario: string;
  active: boolean;
}

export interface PerfilUsuario {
  idPerfilUsuario: number;
  linkedin: string;
  identificador: string;
  /** Imagem de capa (POST/DELETE /perfil-usuario/{id}/banner). */
  urlBanner?: string | null;
  especialidade: Especialidade;
  usuario: UsuarioSimples;
}
