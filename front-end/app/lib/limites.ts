/**
 * Limites de tamanho das colunas no banco do PitcherX-BackEnd (migrations Flyway).
 *
 * Os DTOs do backend não têm @Size para a maioria desses campos: um texto maior que a
 * coluna só é recusado pelo PostgreSQL, o que chega ao front como um 500 genérico
 * ("Ocorreu um erro interno no servidor"). Por isso os formulários limitam o tamanho
 * aqui, antes de enviar.
 */
export const LIMITES = {
  /** postagem.titulo_postagem VARCHAR(80) — V8 */
  tituloPostagem: 80,
  /** projeto.nome_projeto VARCHAR(255) — V7 */
  nomeProjeto: 255,
  /** projeto.url_imagem_projeto VARCHAR(2048) — V24 (antes 155, V7) */
  urlImagemProjeto: 2048,
  /** Galerias de postagem/projeto: ImagemUploadUtil.QUANTIDADE_MAXIMA_IMAGENS */
  imagensGaleria: 10,
  /** contrato.titulo_contrato VARCHAR(255) — V13 */
  tituloContrato: 255,
  /** termo.titulo_termo / descricao_termo VARCHAR(255) — V14 */
  tituloTermo: 255,
  descricaoTermo: 255,
  /** area.nome_area VARCHAR(255) UNIQUE — V1 */
  nomeArea: 255,
  /** nome_sub_area VARCHAR(255) — V2 */
  nomeSubArea: 255,
  /** especialidade.nome_especialidade VARCHAR(120) UNIQUE — V1 */
  nomeEspecialidade: 120,
  /** tipo_projeto.nome_tipo_projeto VARCHAR(255) UNIQUE — V1 */
  nomeTipoProjeto: 255,
  /** endereco.bairro / logradouro VARCHAR(155) — V6/V20 */
  textoEndereco: 155,
  /** endereco.complemento VARCHAR(255) — V20 */
  complemento: 255,
  /** usuario.nome_usuario VARCHAR(255) — V4 */
  nomeUsuario: 255,
  /** usuario.telefone_usuario VARCHAR(13) — V4 (enviamos só dígitos) */
  telefoneDigitos: 13,
  /**
   * proposta.valor_proposta / contra_proposta.valor_contra_proposta DECIMAL(19, 2):
   * até 17 dígitos inteiros. Limitamos a um valor alto, mas seguro para `number` do JS.
   */
  valorMonetario: 999_999_999_999.99,
} as const;

/** Compara nomes ignorando espaços nas pontas e maiúsculas/minúsculas. */
export function mesmoNome(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a ?? "").trim().toLocaleLowerCase("pt-BR") === (b ?? "").trim().toLocaleLowerCase("pt-BR");
}
