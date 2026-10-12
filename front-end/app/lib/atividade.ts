/**
 * Notificações de ATIVIDADE (curtidas, comentários, respostas e votos) — geradas no front.
 *
 * O backend só cria notificações de conexão (ConexaoService.criarNotificacao). Não há
 * notificação de curtida/comentário nem endpoint para criá-las, e esta entrega não altera o
 * backend. Por isso o front compara, para o usuário logado, o estado atual dos dados da API
 * com o último estado visto (guardado no navegador) e gera os avisos:
 *
 *  - Comentário: `GET /comentario` → comentários de OUTRAS pessoas nas publicações do usuário,
 *    com ID maior que o último visto (IDs são sequenciais). Tem autor.
 *  - Resposta: `GET /sub-comentario` → respostas aos comentários do usuário. O backend envia
 *    `usuarioId` nulo nas respostas (mapper), então o autor só aparece se vier preenchido; as
 *    respostas escritas pelo próprio usuário neste navegador são ignoradas.
 *  - Curtida/voto: `GET /curtida/status/{eu}/{tipo}/{id}` → total de curtidas de OUTRAS pessoas
 *    (total menos a própria) em publicações, comentários e projetos do usuário. A API não diz
 *    QUEM curtiu: o aviso informa quantas curtidas novas chegaram.
 *
 * Na primeira verificação (sem estado salvo) os dados existentes viram histórico já lido,
 * sem horário — eles não aconteceram "agora".
 */

export type TipoAtividade = "COMENTARIO" | "RESPOSTA" | "CURTIDA" | "VOTO";

export interface NotificacaoAtividade {
  /** Único e estável (ex.: "comentario-512", "curtida-P10-1696000000000"). */
  id: string;
  tipo: TipoAtividade;
  titulo: string;
  mensagem: string;
  /** Rota interna para abrir o conteúdo. */
  link: string;
  /** ISO do momento em que o front detectou; null no histórico inicial (horário desconhecido). */
  data: string | null;
  lida: boolean;
}

export interface EstadoAtividade {
  v: 1;
  ultimoComentario: number;
  ultimaResposta: number;
  /** Curtidas de outras pessoas por conteúdo: "P10" (postagem), "C5" (comentário), "J3" (projeto). */
  curtidas: Record<string, number>;
  itens: NotificacaoAtividade[];
}

export const LIMITE_ITENS = 100;
const LIMITE_HISTORICO_INICIAL = 30;

export interface DadosAtividade {
  eu: number;
  postagens: { idPostagem: number; tituloPostagem: string; usuarioId: number }[];
  comentarios: { idComentario: number; textoComentario: string; postagemId: number; usuarioId: number }[];
  respostas: { idSubComentario: number; textoSubComentario: string; comentarioId: number; usuarioId: number | null }[];
  /** IDs de respostas escritas pelo próprio usuário (neste navegador). */
  respostasProprias: Set<number>;
  /** Projetos em que o usuário é CRIADOR. */
  projetos: { idProjeto: number; nomeProjeto: string }[];
  /** Curtidas de OUTRAS pessoas, já calculadas, por chave ("P10", "C5", "J3"). */
  curtidas: Record<string, number>;
  nomeUsuario: (id: number) => string | undefined;
}

export function trecho(texto: string, max = 80): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  return limpo.length > max ? `${limpo.slice(0, max - 1)}…` : limpo;
}

function plural(n: number, s: string, p: string) {
  return n === 1 ? s : p;
}

/**
 * Compara os dados atuais com o estado anterior e devolve o novo estado e os avisos novos.
 * `anterior` nulo = primeira verificação (gera só histórico lido).
 */
export function calcularAtividade(
  dados: DadosAtividade,
  anterior: EstadoAtividade | null,
  agora = new Date()
): { estado: EstadoAtividade; novos: NotificacaoAtividade[] } {
  const inicial = anterior === null;
  const base: EstadoAtividade = anterior ?? { v: 1, ultimoComentario: 0, ultimaResposta: 0, curtidas: {}, itens: [] };
  const quando = inicial ? null : agora.toISOString();
  const marca = agora.getTime();
  const gerados: NotificacaoAtividade[] = [];

  const minhasPostagens = new Map(dados.postagens.filter((p) => p.usuarioId === dados.eu).map((p) => [p.idPostagem, p]));
  const meusComentarios = new Map(dados.comentarios.filter((c) => c.usuarioId === dados.eu).map((c) => [c.idComentario, c]));
  const tituloPostagem = (id: number) => dados.postagens.find((p) => p.idPostagem === id)?.tituloPostagem ?? "sua publicação";

  // --------------------------------------------------------------- comentários
  const comentariosNovos = dados.comentarios
    .filter((c) => c.idComentario > base.ultimoComentario && c.usuarioId !== dados.eu && minhasPostagens.has(c.postagemId))
    .sort((a, b) => a.idComentario - b.idComentario);
  for (const c of comentariosNovos) {
    const autor = dados.nomeUsuario(c.usuarioId) ?? "Alguém";
    gerados.push({
      id: `comentario-${c.idComentario}`,
      tipo: "COMENTARIO",
      titulo: "Novo comentário",
      mensagem: `${autor} comentou em "${trecho(minhasPostagens.get(c.postagemId)!.tituloPostagem, 60)}": "${trecho(c.textoComentario)}"`,
      link: `/publicacao/${c.postagemId}`,
      data: quando,
      lida: inicial,
    });
  }

  // --------------------------------------------------------------- respostas
  const respostasNovas = dados.respostas
    .filter(
      (r) =>
        r.idSubComentario > base.ultimaResposta &&
        meusComentarios.has(r.comentarioId) &&
        r.usuarioId !== dados.eu &&
        !dados.respostasProprias.has(r.idSubComentario)
    )
    .sort((a, b) => a.idSubComentario - b.idSubComentario);
  for (const r of respostasNovas) {
    const comentario = meusComentarios.get(r.comentarioId)!;
    const autor = typeof r.usuarioId === "number" && r.usuarioId > 0 ? dados.nomeUsuario(r.usuarioId) : undefined;
    gerados.push({
      id: `resposta-${r.idSubComentario}`,
      tipo: "RESPOSTA",
      titulo: "Nova resposta",
      mensagem: `${autor ?? "Alguém"} respondeu ao seu comentário em "${trecho(tituloPostagem(comentario.postagemId), 60)}": "${trecho(r.textoSubComentario)}"`,
      link: `/publicacao/${comentario.postagemId}`,
      data: quando,
      lida: inicial,
    });
  }

  // --------------------------------------------------------------- curtidas e votos
  const curtidas: Record<string, number> = { ...base.curtidas };
  for (const [chave, atual] of Object.entries(dados.curtidas)) {
    const antes = base.curtidas[chave] ?? (inicial ? undefined : 0);
    curtidas[chave] = atual;
    if (antes === undefined) {
      // Primeira verificação: o total existente vira histórico lido.
      if (atual <= 0) continue;
    } else if (atual <= antes) continue;
    const novas = antes === undefined ? atual : atual - antes;
    const tipo = chave[0];
    const id = Number(chave.slice(1));
    if (tipo === "P") {
      const p = minhasPostagens.get(id);
      if (!p) continue;
      gerados.push({
        id: `curtida-${chave}-${marca}`,
        tipo: "CURTIDA",
        titulo: inicial ? "Curtidas na sua publicação" : plural(novas, "Nova curtida", "Novas curtidas"),
        mensagem: inicial
          ? `"${trecho(p.tituloPostagem, 60)}" já recebeu ${atual} ${plural(atual, "curtida", "curtidas")} de outras pessoas.`
          : `Sua publicação "${trecho(p.tituloPostagem, 60)}" recebeu ${novas} ${plural(novas, "nova curtida", "novas curtidas")}.`,
        link: `/publicacao/${id}`,
        data: quando,
        lida: inicial,
      });
    } else if (tipo === "C") {
      const c = meusComentarios.get(id);
      if (!c) continue;
      gerados.push({
        id: `curtida-${chave}-${marca}`,
        tipo: "CURTIDA",
        titulo: inicial ? "Curtidas no seu comentário" : plural(novas, "Nova curtida no seu comentário", "Novas curtidas no seu comentário"),
        mensagem: inicial
          ? `Seu comentário "${trecho(c.textoComentario, 60)}" já recebeu ${atual} ${plural(atual, "curtida", "curtidas")} de outras pessoas.`
          : `Seu comentário "${trecho(c.textoComentario, 60)}" recebeu ${novas} ${plural(novas, "nova curtida", "novas curtidas")}.`,
        link: `/publicacao/${c.postagemId}`,
        data: quando,
        lida: inicial,
      });
    } else if (tipo === "J") {
      const projeto = dados.projetos.find((x) => x.idProjeto === id);
      if (!projeto) continue;
      gerados.push({
        id: `voto-${chave}-${marca}`,
        tipo: "VOTO",
        titulo: inicial ? "Votos no seu projeto" : plural(novas, "Novo voto no projeto", "Novos votos no projeto"),
        mensagem: inicial
          ? `"${trecho(projeto.nomeProjeto, 60)}" já recebeu ${atual} ${plural(atual, "voto", "votos")} de outras pessoas.`
          : `Seu projeto "${trecho(projeto.nomeProjeto, 60)}" recebeu ${novas} ${plural(novas, "novo voto", "novos votos")}.`,
        link: `/projetos/${id}`,
        data: quando,
        lida: inicial,
      });
    }
  }

  const maxComentario = Math.max(base.ultimoComentario, ...dados.comentarios.map((c) => c.idComentario));
  const maxResposta = Math.max(base.ultimaResposta, ...dados.respostas.map((r) => r.idSubComentario));
  const historico = inicial ? gerados.slice(-LIMITE_HISTORICO_INICIAL) : gerados;
  const itens = [...historico.reverse(), ...base.itens].slice(0, LIMITE_ITENS);

  return {
    estado: { v: 1, ultimoComentario: maxComentario, ultimaResposta: maxResposta, curtidas, itens },
    novos: inicial ? [] : historico,
  };
}
