
export interface PerfilUsuarioRequest {
  linkedin: string;
  identificador: string;
  idEspecialidade: number;
  idUsuario: number;
  urlBanner?: string | null;
  urlVideoPerfil?: string | null;
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
  /** Vídeo de apresentação (POST/DELETE /perfil-usuario/{id}/video). */
  urlVideoPerfil?: string | null;
  especialidade: Especialidade;
  usuario: UsuarioSimples;
}
