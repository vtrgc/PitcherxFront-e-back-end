import { ApiError, api, mapComLimite } from "../lib/api";
import { listarProjetos } from "./projeto.service";
import { AutorProposta, lerDescricaoProposta, textoDaProposta } from "../lib/autoriaProposta";
import { Proposta, PropostaRequest } from "../types/Proposta";

/*
 * ATENÇÃO — defeito do backend: o PropostaMapper tem `@Mapping(target = "idProposta", ignore = true)`
 * também no `toDTO` e não mapeia `projeto.idProjeto`, então TODA resposta de proposta chega com
 * `idProposta: null` e `projetoId: null`. Sem o id não há como aceitar, recusar, contrapropor ou
 * formalizar um contrato. Sem alterar o servidor, o front reconstrói os dois campos:
 *  - id: GET /proposta/{id} funciona por id; sondamos os ids em sequência até achar todas as
 *    propostas que GET /proposta devolveu (os ids do banco são sequenciais);
 *  - projeto: GET /proposta/projeto/{projetoId} filtra no servidor; cada proposta é associada ao
 *    projeto cuja lista contém uma proposta idêntica (descrição, valor e status).
 * Quando o backend for corrigido (ids presentes), tudo isso é pulado automaticamente.
 */

const LOTE_SONDAGEM = 6;
const MAXIMO_FALHAS_SEGUIDAS = 60;

function chave(p: Proposta) {
  return `${p.descricaoProposta}\u0000${p.valorProposta ?? ""}\u0000${p.statusProposta ?? ""}`;
}

async function sondarIds(total: number): Promise<Proposta[]> {
  const achadas: Proposta[] = [];
  let proximo = 1;
  let falhasSeguidas = 0;
  while (achadas.length < total && falhasSeguidas < MAXIMO_FALHAS_SEGUIDAS) {
    const ids = Array.from({ length: LOTE_SONDAGEM }, (_, k) => proximo + k);
    const resultados = await mapComLimite(ids, 6, (id) => api<Proposta>(`/proposta/${id}`));
    resultados.forEach((r, k) => {
      if (r.status === "fulfilled" && r.value) {
        achadas.push({ ...r.value, idProposta: ids[k] });
        falhasSeguidas = 0;
      } else if (r.status === "rejected") {
        const e = r.reason;
        if (!(e instanceof ApiError && e.status === 404)) throw e;
        falhasSeguidas++;
      }
    });
    proximo += LOTE_SONDAGEM;
  }
  return achadas;
}

async function preencherProjetos(lista: Proposta[]): Promise<Proposta[]> {
  if (lista.every((p) => p.projetoId != null)) return lista;
  const projetos = await listarProjetos().catch(() => []);
  const porProjeto = await mapComLimite(projetos, 4, (pr) => api<Proposta[]>(`/proposta/projeto/${pr.idProjeto}`));
  const livres = new Map<string, number[]>(); // chave -> ids ainda sem projeto
  for (const p of [...lista].sort((a, b) => a.idProposta - b.idProposta)) {
    if (p.projetoId != null) continue;
    const k = chave(p);
    livres.set(k, [...(livres.get(k) ?? []), p.idProposta]);
  }
  const projetoDoId = new Map<number, number>();
  porProjeto.forEach((r, i) => {
    if (r.status !== "fulfilled") return;
    for (const item of r.value ?? []) {
      const fila = livres.get(chave(item));
      const id = fila?.shift();
      if (id !== undefined) projetoDoId.set(id, projetos[i].idProjeto);
    }
  });
  return lista.map((p) => (p.projetoId != null ? p : { ...p, projetoId: projetoDoId.get(p.idProposta) ?? null }));
}

/** Resposta de PUT sem os campos que o backend devolve nulos (para não sobrescrever o estado da tela). */
function semCamposNulos(r: Proposta, id: number): Proposta {
  const { projetoId, idProposta, ...resto } = normalizarProposta(r ?? ({} as Proposta));
  void idProposta;
  return { ...resto, idProposta: id, ...(projetoId != null ? { projetoId } : {}) } as Proposta;
}

/** Separa o texto visível do bloco de autoria (ver lib/autoriaProposta). */
export function normalizarProposta(p: Proposta): Proposta {
  if (!p || typeof p !== "object") return p;
  const { texto, autor: autorLegado } = lerDescricaoProposta(p.descricaoProposta);
  // O backend agora devolve o autor (usuarioId/usuarioNome); o bloco na descrição só existe em
  // propostas enviadas antes dessa correção.
  const autor = typeof p.usuarioId === "number" ? { id: p.usuarioId, nome: p.usuarioNome || `Usuário #${p.usuarioId}` } : autorLegado;
  return { ...p, descricaoProposta: texto, autor };
}

// A reconstrução custa várias requisições: o resultado é compartilhado por alguns segundos entre
// os componentes da mesma tela e descartado a cada alteração (criar, editar, decidir, excluir).
const VALIDADE_CACHE_MS = 15000;
let cacheLista: { quando: number; promessa: Promise<Proposta[]> } | null = null;

export function invalidarCachePropostas() {
  cacheLista = null;
}

async function reconstruirLista(): Promise<Proposta[]> {
  const brutas = (await api<Proposta[]>("/proposta")) ?? [];
  const comId = brutas.every((p) => p.idProposta != null) ? brutas : await sondarIds(brutas.length);
  return (await preencherProjetos(comId)).map(normalizarProposta);
}

/** GET /proposta — todas as propostas (com id e projeto reconstruídos; ver acima). */
export function listarPropostas({ forcar = false }: { forcar?: boolean } = {}): Promise<Proposta[]> {
  if (!forcar && cacheLista && Date.now() - cacheLista.quando < VALIDADE_CACHE_MS) return cacheLista.promessa;
  const promessa = reconstruirLista();
  cacheLista = { quando: Date.now(), promessa };
  promessa.catch(() => {
    if (cacheLista?.promessa === promessa) cacheLista = null;
  });
  return promessa;
}

/** GET /proposta/projeto/{projetoId} — propostas recebidas por um projeto. */
export async function listarPropostasDoProjeto(projetoId: number): Promise<Proposta[]> {
  const brutas = (await api<Proposta[]>(`/proposta/projeto/${projetoId}`)) ?? [];
  if (brutas.every((p) => p.idProposta != null)) return brutas.map((p) => normalizarProposta({ ...p, projetoId: p.projetoId ?? projetoId }));
  if (brutas.length === 0) return [];
  return (await listarPropostas()).filter((p) => p.projetoId === projetoId);
}

export async function buscarProposta(id: number): Promise<Proposta> {
  const p = await api<Proposta>(`/proposta/${id}`);
  const comId = normalizarProposta({ ...p, idProposta: p.idProposta ?? id });
  if (comId.projetoId != null) return comId;
  const daLista = (await listarPropostas().catch(() => [] as Proposta[])).find((x) => x.idProposta === id);
  return { ...comId, projetoId: daLista?.projetoId ?? null };
}

/**
 * POST /proposta — o autor é o usuário logado (vem do token). Como a resposta vem sem id
 * (defeito do mapper), o id é descoberto logo em seguida: a proposta mais recente idêntica.
 */
export async function criarProposta(data: PropostaRequest, autor?: AutorProposta | null): Promise<Proposta> {
  // O servidor registra o autor pelo token; o texto vai limpo (sem o bloco de autoria legado).
  void autor;
  const corpo = { ...data, descricaoProposta: textoDaProposta(data.descricaoProposta) };
  const criada = await api<Proposta>("/proposta", {
    method: "POST",
    body: JSON.stringify(corpo),
  });
  invalidarCachePropostas();
  if (criada?.idProposta != null) return normalizarProposta(criada);
  const texto = lerDescricaoProposta(corpo.descricaoProposta).texto;
  const candidatas = (await listarPropostas().catch(() => [] as Proposta[])).filter(
    (p) =>
      p.descricaoProposta === texto &&
      (p.valorProposta ?? null) === (data.valorProposta ?? null) &&
      (autor ? p.autor?.id === autor.id : true)
  );
  const nova = candidatas.sort((a, b) => b.idProposta - a.idProposta)[0];
  return nova ? { ...nova, projetoId: nova.projetoId ?? data.projetoId ?? null } : normalizarProposta({ ...criada, projetoId: data.projetoId ?? null });
}

/** PUT /proposta/{id} — só o autor; bloqueado se houver contraproposta pendente. */
export async function atualizarProposta(id: number, data: PropostaRequest, autor?: AutorProposta | null) {
  void autor; // o backend identifica o autor pelo token
  const r = await api<Proposta>(`/proposta/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...data, descricaoProposta: textoDaProposta(data.descricaoProposta) }),
  });
  invalidarCachePropostas();
  return semCamposNulos(r, id);
}

/**
 * PUT /proposta/aceitar/{id} — só o criador do projeto. Vincula o autor como SÓCIO e soma o
 * valor ao arrecadado. Recusado enquanto houver contrato PENDENTE para a proposta.
 */
export async function aceitarProposta(id: number): Promise<Proposta> {
  const r = await api<Proposta>(`/proposta/aceitar/${id}`, { method: "PUT" });
  invalidarCachePropostas();
  return semCamposNulos(r, id);
}

/** PUT /proposta/recusar/{id} — só o criador do projeto. */
export async function recusarProposta(id: number): Promise<Proposta> {
  const r = await api<Proposta>(`/proposta/recusar/${id}`, { method: "PUT" });
  invalidarCachePropostas();
  return semCamposNulos(r, id);
}

/** DELETE /proposta/{id} — só o autor; bloqueado se houver contraproposta pendente. */
export async function excluirProposta(id: number) {
  await api<void>(`/proposta/${id}`, {
    method: "DELETE",
  });
  invalidarCachePropostas();
}

// ---------------------------------------------------------------------------
// Autoria local
// ---------------------------------------------------------------------------
// PropostaResponseDTO não traz o autor. Para a interface saber quais propostas o usuário
// enviou (e oferecer editar/excluir), guardamos neste navegador os IDs que ele criou. É só
// uma dica de exibição: quem decide é o backend, que valida o dono em toda alteração.

function chaveAutoria(usuarioId: number) {
  return `pitcherx:propostas-enviadas:${usuarioId}`;
}

export function idsPropostasEnviadas(usuarioId: number | null | undefined): Set<number> {
  if (!usuarioId || typeof window === "undefined") return new Set();
  try {
    const bruto = window.localStorage.getItem(chaveAutoria(usuarioId));
    const lista = bruto ? JSON.parse(bruto) : [];
    return new Set(Array.isArray(lista) ? lista.filter((n) => typeof n === "number") : []);
  } catch {
    return new Set();
  }
}

export function registrarPropostaEnviada(usuarioId: number, idProposta: number) {
  if (typeof window === "undefined") return;
  try {
    const ids = idsPropostasEnviadas(usuarioId);
    ids.add(idProposta);
    window.localStorage.setItem(chaveAutoria(usuarioId), JSON.stringify([...ids]));
  } catch {
    /* armazenamento indisponível */
  }
}

export function esquecerPropostaEnviada(usuarioId: number, idProposta: number) {
  if (typeof window === "undefined") return;
  try {
    const ids = idsPropostasEnviadas(usuarioId);
    ids.delete(idProposta);
    window.localStorage.setItem(chaveAutoria(usuarioId), JSON.stringify([...ids]));
  } catch {
    /* ignora */
  }
}
