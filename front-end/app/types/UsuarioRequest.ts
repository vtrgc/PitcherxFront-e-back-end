/** UsuarioRequestDTO — usado no cadastro e no PUT /usuario/{id}. */
export interface UsuarioRequest {
  nomeUsuario: string;
  emailUsuario: string;
  senhaUsuario: string;
  telefoneUsuario?: string;
}
