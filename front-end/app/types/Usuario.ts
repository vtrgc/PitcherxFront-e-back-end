/** UsuarioResponseDTO. */
export interface Usuario {
  idUsuario: number;
  nomeUsuario: string;
  emailUsuario: string;
  telefoneUsuario: string | null;
  urlImagemUsuario: string | null;
  active: boolean;
  roles: string[];
}
