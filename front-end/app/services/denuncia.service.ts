/**
 * Denúncias — /denuncia (PitcherX-BackEnd).
 *
 *  - POST /denuncia: qualquer conta autenticada; a identidade do denunciante é sigilosa.
 *    Regras do servidor: não denunciar o próprio perfil, 30 denúncias por dia e uma por alvo.
 *  - GET /denuncia/me e GET /denuncia/categorias.
 *  - POST /denuncia/{id}/apelacao: só para denúncias ACEITAS, uma vez.
 *  - Admin: GET /denuncia/admin/pending, GET /denuncia/admin/{id},
 *    PUT /denuncia/admin/{id}/decisao e PUT /denuncia/admin/{id}/apelacao/decisao.
 *
 * O backend aceita os tipos PERFIL, POSTAGEM, PROJETO e COMENTARIO (respostas a comentários
 * não são um tipo próprio, então não podem ser denunciadas).
 */
import { api } from "../lib/api";
import { CategoriaDenuncia, DecisaoDenuncia, Denuncia, DenunciaRequest, TipoDenuncia } from "../types/Denuncia";

/** Tipos de conteúdo que as telas conseguem denunciar. */
export type TipoConteudoDenuncia = TipoDenuncia;

export const DETALHES_DENUNCIA_MAX = 1000;

/** Disparado após registrar uma denúncia (as telas atualizam o que mostram). */
export const EVENTO_DENUNCIAS_ALTERADAS = "pitcherx:denuncias-alteradas";

/** Categorias usadas se GET /denuncia/categorias falhar (mesma lista do servidor). */
export const CATEGORIAS_PADRAO: CategoriaDenuncia[] = [
  { codigo: "SPAM", descricao: "Spam", tipoDenuncia: null },
  { codigo: "NUDEZ", descricao: "Nudez / atividade sexual", tipoDenuncia: null },
  { codigo: "DISCURSO_ODIO", descricao: "Discurso de ódio", tipoDenuncia: null },
  { codigo: "ASSÉDIO", descricao: "Assédio / bullying", tipoDenuncia: null },
  { codigo: "VENDA_ILEGAL", descricao: "Venda ilegal de produtos", tipoDenuncia: null },
  { codigo: "PROPRIEDADE_INTELECTUAL", descricao: "Propriedade intelectual", tipoDenuncia: null },
  { codigo: "AUTOMUTILACAO", descricao: "Automutilação", tipoDenuncia: null },
  { codigo: "INFO_FALSA", descricao: "Informação falsa", tipoDenuncia: null },
  { codigo: "CONTEUDO_SENSIVEL", descricao: "Conteúdo sensível / chocante", tipoDenuncia: null },
  { codigo: "IDENTIDADE_FALSA", descricao: "Identidade falsa / personificação", tipoDenuncia: null },
  { codigo: "MENOR_RISCO", descricao: "Menor em situação de risco", tipoDenuncia: null },
  { codigo: "OUTROS", descricao: "Outros", tipoDenuncia: null },
];

/** Descrições do servidor vêm sem acento ("Assedio"); mostramos a versão revisada. */
const DESCRICAO_REVISADA = new Map(CATEGORIAS_PADRAO.map((c) => [c.codigo, c.descricao]));

export function rotuloCategoria(codigo: string | null | undefined): string {
  if (!codigo) return "—";
  return DESCRICAO_REVISADA.get(codigo) ?? codigo.replace(/_/g, " ").toLowerCase();
}

let cacheCategorias: Promise<CategoriaDenuncia[]> | null = null;

/** GET /denuncia/categorias (cacheado por sessão; cai na lista padrão se falhar). */
export function listarCategoriasDenuncia(tipo?: TipoDenuncia): Promise<CategoriaDenuncia[]> {
  if (!cacheCategorias) {
    const qs = tipo ? `?tipoDenuncia=${encodeURIComponent(tipo)}` : "";
    cacheCategorias = api<CategoriaDenuncia[]>(`/denuncia/categorias${qs}`)
      .then((lista) =>
        (lista?.length ? lista : CATEGORIAS_PADRAO).map((c) => ({ ...c, descricao: DESCRICAO_REVISADA.get(c.codigo) ?? c.descricao }))
      )
      .catch(() => {
        cacheCategorias = null;
        return CATEGORIAS_PADRAO;
      });
  }
  return cacheCategorias;
}

/** Valida o que o modal envia. Devolve a mensagem de erro ou null. */
export function validarDenuncia(categoria: string, detalhes: string): string | null {
  if (!categoria) return "Selecione o motivo da denúncia.";
  if (categoria === "OUTROS" && !detalhes.trim()) return "Descreva o motivo da denúncia.";
  if (detalhes.length > DETALHES_DENUNCIA_MAX) return `Use no máximo ${DETALHES_DENUNCIA_MAX} caracteres.`;
  return null;
}

/** POST /denuncia. */
export async function enviarDenuncia(dados: DenunciaRequest): Promise<Denuncia> {
  const erro = validarDenuncia(dados.categoria, dados.descricao ?? "");
  if (erro) throw new Error(erro);
  const denuncia = await api<Denuncia>("/denuncia", {
    method: "POST",
    body: JSON.stringify({ ...dados, descricao: dados.descricao?.trim() || undefined }),
  });
  cacheMinhas = null;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO_DENUNCIAS_ALTERADAS));
  return denuncia;
}

let cacheMinhas: Promise<Denuncia[]> | null = null;

/** GET /denuncia/me (até 100 mais recentes). Cacheado até a próxima denúncia. */
export function listarMinhasDenuncias({ forcar = false }: { forcar?: boolean } = {}): Promise<Denuncia[]> {
  if (forcar || !cacheMinhas) {
    cacheMinhas = api<Denuncia[]>("/denuncia/me?page=0&size=100").catch((e) => {
      cacheMinhas = null;
      throw e;
    });
  }
  return cacheMinhas;
}

/** Limpa o cache (ex.: ao trocar de conta). */
export function limparCacheDenuncias() {
  cacheMinhas = null;
}

/** true se a lista do usuário já tem denúncia para o alvo. */
export function jaDenunciado(lista: Denuncia[], tipo: TipoDenuncia, alvoId: number): boolean {
  return lista.some((d) => d.tipoDenuncia === tipo && d.alvoId === alvoId);
}

/** POST /denuncia/{id}/apelacao. */
export async function solicitarApelacao(id: number, justificativa: string) {
  const r = await api<Denuncia>(`/denuncia/${id}/apelacao`, { method: "POST", body: JSON.stringify({ justificativa }) });
  cacheMinhas = null;
  return r;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

/** GET /denuncia/admin/pending. */
export function listarDenunciasPendentes(page = 0, size = 100) {
  return api<Denuncia[]>(`/denuncia/admin/pending?page=${page}&size=${size}`);
}

/** GET /denuncia/admin/{id} (admin; o denunciante também pode ver a própria). */
export function buscarDenuncia(id: number) {
  return api<Denuncia>(`/denuncia/admin/${id}`);
}

/** PUT /denuncia/admin/{id}/decisao — só denúncias PENDENTES. */
export function decidirDenuncia(id: number, decisao: DecisaoDenuncia) {
  return api<Denuncia>(`/denuncia/admin/${id}/decisao`, { method: "PUT", body: JSON.stringify(decisao) });
}

/** PUT /denuncia/admin/{id}/apelacao/decisao — só com apelação solicitada. */
export function decidirApelacao(id: number, decisao: DecisaoDenuncia) {
  return api<Denuncia>(`/denuncia/admin/${id}/apelacao/decisao`, { method: "PUT", body: JSON.stringify(decisao) });
}
