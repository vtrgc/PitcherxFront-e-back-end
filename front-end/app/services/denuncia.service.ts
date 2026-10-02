/**
 * Denúncias de conteúdo (postagem, comentário, resposta e projeto).
 *
 * IMPORTANTE — o PitcherX-BackEnd NÃO tem endpoint de denúncia (não existe controller,
 * entidade nem tabela para isso). Como esta entrega altera somente o front-end, a denúncia
 * é registrada na conta do usuário NESTE navegador (localStorage) e o conteúdo denunciado
 * deixa de aparecer para quem denunciou. A interface informa isso ao usuário.
 *
 * Quando o backend ganhar um endpoint (ex.: `POST /denuncia`), basta trocar o corpo de
 * `enviarDenuncia` pela chamada `api(...)`: telas, modal e regras continuam iguais.
 */

export type TipoConteudoDenuncia = "POSTAGEM" | "COMENTARIO" | "SUBCOMENTARIO" | "PROJETO";

export const MOTIVOS_DENUNCIA = [
  { id: "SPAM", rotulo: "Spam ou propaganda enganosa" },
  { id: "OFENSIVO", rotulo: "Conteúdo ofensivo ou discurso de ódio" },
  { id: "ASSEDIO", rotulo: "Assédio ou intimidação" },
  { id: "GOLPE", rotulo: "Golpe, fraude ou informação falsa" },
  { id: "PLAGIO", rotulo: "Plágio ou violação de direitos autorais" },
  { id: "IMPROPRIO", rotulo: "Conteúdo impróprio ou sensível" },
  { id: "OUTRO", rotulo: "Outro motivo" },
] as const;

export type MotivoDenuncia = (typeof MOTIVOS_DENUNCIA)[number]["id"];

export const DETALHES_DENUNCIA_MAX = 500;

export interface Denuncia {
  tipo: TipoConteudoDenuncia;
  conteudoId: number;
  motivo: MotivoDenuncia;
  detalhes: string;
  /** ISO. */
  data: string;
}

/** Disparado após registrar/desfazer uma denúncia (as telas atualizam o que mostram). */
export const EVENTO_DENUNCIAS_ALTERADAS = "pitcherx:denuncias-alteradas";

function chave(usuarioId: number) {
  return `pitcherx:denuncias:${usuarioId}`;
}

export function listarDenuncias(usuarioId: number | null | undefined): Denuncia[] {
  if (!usuarioId || typeof window === "undefined") return [];
  try {
    const bruto = window.localStorage.getItem(chave(usuarioId));
    const dados = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(dados) ? (dados as Denuncia[]) : [];
  } catch {
    return [];
  }
}

function gravar(usuarioId: number, denuncias: Denuncia[]) {
  window.localStorage.setItem(chave(usuarioId), JSON.stringify(denuncias));
  window.dispatchEvent(new Event(EVENTO_DENUNCIAS_ALTERADAS));
}

export function jaDenunciado(usuarioId: number | null | undefined, tipo: TipoConteudoDenuncia, conteudoId: number): boolean {
  return listarDenuncias(usuarioId).some((d) => d.tipo === tipo && d.conteudoId === conteudoId);
}

/** Valida o que o modal envia. Devolve a mensagem de erro ou null. */
export function validarDenuncia(motivo: MotivoDenuncia | "", detalhes: string): string | null {
  if (!motivo) return "Selecione o motivo da denúncia.";
  if (motivo === "OUTRO" && !detalhes.trim()) return "Descreva o motivo da denúncia.";
  if (detalhes.length > DETALHES_DENUNCIA_MAX) return `Use no máximo ${DETALHES_DENUNCIA_MAX} caracteres.`;
  return null;
}

/**
 * Registra a denúncia. Lança erro se o armazenamento do navegador estiver indisponível
 * (modo privado/bloqueado) ou se o conteúdo já tiver sido denunciado por este usuário.
 */
export async function enviarDenuncia(
  usuarioId: number,
  dados: { tipo: TipoConteudoDenuncia; conteudoId: number; motivo: MotivoDenuncia; detalhes: string }
): Promise<Denuncia> {
  const erro = validarDenuncia(dados.motivo, dados.detalhes);
  if (erro) throw new Error(erro);
  const atuais = listarDenuncias(usuarioId);
  if (atuais.some((d) => d.tipo === dados.tipo && d.conteudoId === dados.conteudoId)) {
    throw new Error("Você já denunciou este conteúdo.");
  }
  const denuncia: Denuncia = { ...dados, detalhes: dados.detalhes.trim(), data: new Date().toISOString() };
  try {
    gravar(usuarioId, [...atuais, denuncia]);
  } catch {
    throw new Error("Não foi possível registrar a denúncia neste navegador. Verifique se o armazenamento do site está liberado.");
  }
  return denuncia;
}

/** Desfaz a denúncia (o conteúdo volta a aparecer para o usuário). */
export function desfazerDenuncia(usuarioId: number, tipo: TipoConteudoDenuncia, conteudoId: number) {
  try {
    gravar(
      usuarioId,
      listarDenuncias(usuarioId).filter((d) => !(d.tipo === tipo && d.conteudoId === conteudoId))
    );
  } catch {
    /* armazenamento indisponível: nada a desfazer */
  }
}
