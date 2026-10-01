/**
 * PostagemResponseDTO. `imagens` é a galeria (PUT/DELETE /postagem/{id}/imagens, até 10);
 * `urlImagemPostagem` é a primeira imagem (ou a URL informada no cadastro, se não houver galeria).
 */
export interface Post {
  idPostagem: number;
  tituloPostagem: string;
  textoPostagem: string;
  /** dd/MM/yyyy */
  dataPostagem: string;
  urlImagemPostagem?: string | null;
  imagens?: string[] | null;
  usuarioId: number;
  /** Preenchidos no front a partir de /curtida/status. */
  totalCurtidas?: number;
  usuarioCurtiu?: boolean;
}
