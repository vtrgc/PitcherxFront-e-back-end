import { mapComLimite } from "../lib/api";
import { EstadoAtividade, NotificacaoAtividade, calcularAtividade } from "../lib/atividade";
import { idsRespostasProprias } from "../lib/autoriaRespostas";
import { listarComentarios } from "./comentario.service";
import { buscarStatusCurtida, TIPO_CONTEUDO } from "./curtida.service";
import { listarPostagens } from "./postagem.service";
import { listarProjetos } from "./projeto.service";
import { listarIdsProjetosCriados } from "./projetoUsuario.service";
import { listarSubComentarios } from "./subComentario.service";
import { buscarUsuario } from "./usuario.service";

/**
 * Verificação periódica das notificações de atividade (ver lib/atividade).
 * O estado fica no navegador, por usuário: `pitcherx:atividade:{id}`.
 */

/** Disparado quando a lista de notificações de atividade muda (novas, lidas). */
export const EVENTO_ATIVIDADE = "pitcherx:atividade";

/** Máximo de conteúdos (de cada tipo) cujas curtidas são conferidas a cada verificação. */
const LIMITE_CONTEUDOS = 40;

function chave(eu: number) {
  return `pitcherx:atividade:${eu}`;
}

export function lerEstadoAtividade(eu: number): EstadoAtividade | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.localStorage.getItem(chave(eu));
    const dados = bruto ? (JSON.parse(bruto) as EstadoAtividade) : null;
    return dados && dados.v === 1 && Array.isArray(dados.itens) ? dados : null;
  } catch {
    return null;
  }
}

function gravar(eu: number, estado: EstadoAtividade) {
  try {
    window.localStorage.setItem(chave(eu), JSON.stringify(estado));
  } catch {
    /* armazenamento indisponível: as notificações valem só nesta sessão */
  }
  window.dispatchEvent(new Event(EVENTO_ATIVIDADE));
}

export function listarAtividade(eu: number): NotificacaoAtividade[] {
  return lerEstadoAtividade(eu)?.itens ?? [];
}

export function marcarAtividadeComoLida(eu: number, ids?: string[]) {
  const estado = lerEstadoAtividade(eu);
  if (!estado) return;
  const alvo = ids ? new Set(ids) : null;
  gravar(eu, { ...estado, itens: estado.itens.map((n) => (!alvo || alvo.has(n.id) ? { ...n, lida: true } : n)) });
}

const emAndamento = new Map<number, Promise<NotificacaoAtividade[]>>();

/**
 * Consulta a API, gera as notificações novas e salva o estado. Chamadas simultâneas para o
 * mesmo usuário reaproveitam a mesma verificação. Devolve somente as notificações NOVAS.
 */
export function verificarAtividade(eu: number): Promise<NotificacaoAtividade[]> {
  const atual = emAndamento.get(eu);
  if (atual) return atual;
  const tarefa = executar(eu).finally(() => emAndamento.delete(eu));
  emAndamento.set(eu, tarefa);
  return tarefa;
}

async function executar(eu: number): Promise<NotificacaoAtividade[]> {
  const [postagens, comentarios, respostas, idsCriados, projetos] = await Promise.all([
    listarPostagens(),
    listarComentarios(),
    listarSubComentarios().catch(() => []),
    listarIdsProjetosCriados(eu).catch(() => new Set<number>()),
    listarProjetos().catch(() => []),
  ]);

  const minhasPostagens = (postagens ?? []).filter((p) => p.usuarioId === eu).sort((a, b) => b.idPostagem - a.idPostagem).slice(0, LIMITE_CONTEUDOS);
  const meusComentarios = (comentarios ?? []).filter((c) => c.usuarioId === eu).sort((a, b) => b.idComentario - a.idComentario).slice(0, LIMITE_CONTEUDOS);
  const meusProjetos = (projetos ?? []).filter((p) => idsCriados.has(p.idProjeto)).sort((a, b) => b.idProjeto - a.idProjeto).slice(0, LIMITE_CONTEUDOS);

  // Curtidas de OUTRAS pessoas = total − a minha (se eu curti o próprio conteúdo).
  const alvos = [
    ...minhasPostagens.map((p) => ({ chave: `P${p.idPostagem}`, tipo: TIPO_CONTEUDO.POSTAGEM, id: p.idPostagem })),
    ...meusComentarios.map((c) => ({ chave: `C${c.idComentario}`, tipo: TIPO_CONTEUDO.COMENTARIO, id: c.idComentario })),
    ...meusProjetos.map((p) => ({ chave: `J${p.idProjeto}`, tipo: TIPO_CONTEUDO.PROJETO, id: p.idProjeto })),
  ];
  const status = await mapComLimite(alvos, 6, (a) => buscarStatusCurtida(eu, a.tipo, a.id));
  const curtidas: Record<string, number> = {};
  status.forEach((r, i) => {
    // Falha numa consulta: o conteúdo fica de fora desta vez (sem aviso falso).
    if (r.status === "fulfilled") curtidas[alvos[i].chave] = Math.max(0, r.value.quantidadeCurtidas - (r.value.jaCurtiu ? 1 : 0));
  });

  // Nomes de quem comentou nas minhas publicações (GET /usuario/{id}, com cache).
  const idsMinhasPostagens = new Set((postagens ?? []).filter((p) => p.usuarioId === eu).map((p) => p.idPostagem));
  const autores = [...new Set((comentarios ?? []).filter((c) => idsMinhasPostagens.has(c.postagemId) && c.usuarioId !== eu).map((c) => c.usuarioId))];
  const nomes = new Map<number, string>();
  const usuarios = await mapComLimite(autores, 6, (id) => buscarUsuario(id));
  usuarios.forEach((r, i) => r.status === "fulfilled" && nomes.set(autores[i], r.value.nomeUsuario));

  const anterior = lerEstadoAtividade(eu);
  // Mantém as curtidas já conhecidas de conteúdos que não foram consultados agora.
  const { estado, novos } = calcularAtividade(
    {
      eu,
      postagens: postagens ?? [],
      comentarios: comentarios ?? [],
      respostas: respostas ?? [],
      respostasProprias: idsRespostasProprias(eu),
      projetos: meusProjetos,
      curtidas,
      nomeUsuario: (id) => nomes.get(id),
    },
    anterior
  );
  // Uma verificação concorrente (outra aba) pode ter gravado antes: une os itens já marcados como lidos.
  const recente = lerEstadoAtividade(eu);
  if (recente && anterior && recente !== anterior) {
    const lidas = new Set(recente.itens.filter((n) => n.lida).map((n) => n.id));
    estado.itens = estado.itens.map((n) => (lidas.has(n.id) ? { ...n, lida: true } : n));
  }
  gravar(eu, estado);
  return novos;
}
