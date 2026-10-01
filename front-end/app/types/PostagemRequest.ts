export interface PostagemRequest {
  tituloPostagem: string;
  textoPostagem: string;
  /** dd/MM/yyyy — o backend exige hoje ou data futura (@FutureOrPresent). */
  dataPostagem: string;
  urlImagemPostagem?: string;
  usuarioId: number;
}
