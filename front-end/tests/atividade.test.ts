import { describe, expect, it } from "vitest";
import { DadosAtividade, calcularAtividade } from "../app/lib/atividade";

const nomes: Record<number, string> = { 2: "Bruno", 3: "TechCorp" };
function dados(extra: Partial<DadosAtividade> = {}): DadosAtividade {
  return {
    eu: 1,
    postagens: [
      { idPostagem: 10, tituloPostagem: "Post do Bruno", usuarioId: 2 },
      { idPostagem: 11, tituloPostagem: "Meu post", usuarioId: 1 },
    ],
    comentarios: [
      { idComentario: 500, textoComentario: "Comentei no do Bruno", postagemId: 10, usuarioId: 1 },
      { idComentario: 501, textoComentario: "Legal!", postagemId: 11, usuarioId: 2 },
    ],
    respostas: [],
    respostasProprias: new Set(),
    projetos: [{ idProjeto: 21, nomeProjeto: "App" }],
    curtidas: { P11: 1, C500: 0, J21: 2 },
    nomeUsuario: (id) => nomes[id],
    ...extra,
  };
}

describe("notificações de atividade", () => {
  it("primeira verificação vira histórico lido, sem horário e sem aviso", () => {
    const { estado, novos } = calcularAtividade(dados(), null);
    expect(novos).toEqual([]);
    expect(estado.itens.length).toBe(3); // comentário 501 + curtida P11 + votos J21
    expect(estado.itens.every((n) => n.lida && n.data === null)).toBe(true);
    expect(estado.ultimoComentario).toBe(501);
  });

  it("novo comentário de outra pessoa no meu post gera aviso com o autor", () => {
    const { estado } = calcularAtividade(dados(), null);
    const d = dados();
    d.comentarios.push({ idComentario: 502, textoComentario: "Quero participar", postagemId: 11, usuarioId: 3 });
    d.comentarios.push({ idComentario: 503, textoComentario: "eu mesmo", postagemId: 11, usuarioId: 1 });
    d.comentarios.push({ idComentario: 504, textoComentario: "em outro post", postagemId: 10, usuarioId: 3 });
    const { novos } = calcularAtividade(d, estado, new Date("2026-10-04T12:00:00Z"));
    expect(novos).toHaveLength(1);
    expect(novos[0]).toMatchObject({ tipo: "COMENTARIO", lida: false, link: "/publicacao/11", data: "2026-10-04T12:00:00.000Z" });
    expect(novos[0].mensagem).toContain("TechCorp comentou");
  });

  it("curtidas e votos novos geram aviso com a quantidade", () => {
    const { estado } = calcularAtividade(dados(), null);
    const { novos } = calcularAtividade(dados({ curtidas: { P11: 3, C500: 1, J21: 2 } }), estado);
    const tipos = novos.map((n) => n.tipo).sort();
    expect(tipos).toEqual(["CURTIDA", "CURTIDA"]);
    expect(novos.find((n) => n.link === "/publicacao/11")?.mensagem).toContain("2 novas curtidas");
    const sem = calcularAtividade(dados({ curtidas: { P11: 0, C500: 0, J21: 2 } }), estado);
    expect(sem.novos).toEqual([]); // descurtidas não geram aviso
  });

  it("voto novo no projeto", () => {
    const { estado } = calcularAtividade(dados(), null);
    const { novos } = calcularAtividade(dados({ curtidas: { P11: 1, C500: 0, J21: 3 } }), estado);
    expect(novos).toHaveLength(1);
    expect(novos[0]).toMatchObject({ tipo: "VOTO", link: "/projetos/21" });
  });

  it("resposta ao meu comentário; ignora respostas que eu escrevi", () => {
    const { estado } = calcularAtividade(dados(), null);
    const d = dados({
      respostas: [
        { idSubComentario: 7, textoSubComentario: "Valeu!", comentarioId: 500, usuarioId: null },
        { idSubComentario: 8, textoSubComentario: "minha", comentarioId: 500, usuarioId: null },
      ],
      respostasProprias: new Set([8]),
    });
    const { novos } = calcularAtividade(d, estado);
    expect(novos).toHaveLength(1);
    expect(novos[0]).toMatchObject({ tipo: "RESPOSTA", link: "/publicacao/10" });
    expect(novos[0].mensagem).toContain("Alguém respondeu");
  });

  it("conteúdo novo depois da primeira verificação conta desde zero", () => {
    const { estado } = calcularAtividade(dados(), null);
    const d = dados({ curtidas: { P11: 1, C500: 0, J21: 2, P12: 2 } });
    d.postagens.push({ idPostagem: 12, tituloPostagem: "Post novo", usuarioId: 1 });
    const { novos } = calcularAtividade(d, estado);
    expect(novos).toHaveLength(1);
    expect(novos[0].mensagem).toContain("2 novas curtidas");
  });
});
