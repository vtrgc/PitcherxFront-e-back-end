/**
 * Autoria das propostas.
 *
 * O backend grava o autor de cada proposta (Proposta.usuario, usado para autorizar editar e
 * excluir), mas o PropostaResponseDTO não o devolve. Para que o criador do projeto saiba QUEM
 * enviou a proposta — e para que "Enviadas por mim" funcione em qualquer dispositivo — o front
 * anexa ao fim de `descricaoProposta` (coluna TEXT) um bloco invisível com o id e o nome do
 * autor, no mesmo formato já usado na ficha de projetos antigos:
 *
 *     Texto da proposta...
 *
 *     <!--pitcherx:autor {"id":7,"nome":"Bruno"}-->
 *
 * Toda exibição usa `lerDescricaoProposta`, então o bloco nunca aparece. O dado é informado pelo
 * próprio navegador de quem envia: serve para exibição, não como prova de identidade (as regras
 * de permissão continuam sendo aplicadas pelo servidor com o usuário do token).
 */

export interface AutorProposta {
  id: number;
  nome: string;
}

const REGEX_BLOCO = /\s*<!--pitcherx:autor (\{[\s\S]*?\})-->\s*$/;

export function lerDescricaoProposta(descricao: string | null | undefined): { texto: string; autor: AutorProposta | null } {
  const bruto = descricao ?? "";
  const achado = bruto.match(REGEX_BLOCO);
  if (!achado) return { texto: bruto.trim(), autor: null };
  let autor: AutorProposta | null = null;
  try {
    const dados = JSON.parse(achado[1]) as Record<string, unknown>;
    if (typeof dados.id === "number" && Number.isInteger(dados.id) && dados.id > 0) {
      autor = { id: dados.id, nome: typeof dados.nome === "string" && dados.nome.trim() ? dados.nome.trim().slice(0, 120) : `Usuário #${dados.id}` };
    }
  } catch {
    autor = null;
  }
  return { texto: bruto.slice(0, achado.index).trim(), autor };
}

/** Texto da proposta sem o bloco de autoria. */
export function textoDaProposta(descricao: string | null | undefined): string {
  return lerDescricaoProposta(descricao).texto;
}

/** Monta o `descricaoProposta` para a API: texto + bloco de autoria. */
export function montarDescricaoProposta(texto: string, autor: AutorProposta | null | undefined): string {
  const corpo = textoDaProposta(texto);
  if (!autor) return corpo;
  // "-->" dentro do JSON fecharia o comentário antes da hora.
  const json = JSON.stringify({ id: autor.id, nome: autor.nome }).replace(/-->/g, "--\\u003e");
  return `${corpo}\n\n<!--pitcherx:autor ${json}-->`;
}
