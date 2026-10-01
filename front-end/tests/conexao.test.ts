import { describe, expect, it } from "vitest";
import { lerQuantidade, normalizarPagina } from "../app/lib/pagina";
import {
  derivarRelacao,
  idConexaoPelasNotificacoes,
  normalizarStatus,
  rotuloBotaoConexao,
  RELACAO_VAZIA,
} from "../app/lib/conexao";
import { imagensDaGaleria, validarArquivosGaleria } from "../app/lib/galeria";
import { autorDaResposta } from "../app/lib/autoriaRespostas";
import { tempoRelativo } from "../app/lib/date";
import { Notificacao } from "../app/types/Conexao";

describe("normalizarPagina (Page<T> do Spring)", () => {
  it("lê o formato clássico (PageImpl)", () => {
    const p = normalizarPagina<number>({ content: [1, 2], totalElements: 5, totalPages: 3, number: 0, last: false });
    expect(p).toEqual({ itens: [1, 2], total: 5, pagina: 0, totalPaginas: 3, ultima: false });
  });

  it("lê o formato PagedModel ({ content, page })", () => {
    const p = normalizarPagina<number>({ content: [7], page: { size: 20, number: 2, totalElements: 41, totalPages: 3 } });
    expect(p).toEqual({ itens: [7], total: 41, pagina: 2, totalPaginas: 3, ultima: true });
  });

  it("tolera resposta vazia ou lista simples", () => {
    expect(normalizarPagina(undefined)).toEqual({ itens: [], total: 0, pagina: 0, totalPaginas: 0, ultima: true });
    expect(normalizarPagina([1, 2, 3]).total).toBe(3);
  });

  it("lerQuantidade lê { quantidade } e rejeita valores inválidos", () => {
    expect(lerQuantidade({ quantidade: 4 })).toBe(4);
    expect(lerQuantidade({ quantidade: "2" })).toBe(2);
    expect(lerQuantidade({})).toBe(0);
    expect(lerQuantidade(null)).toBe(0);
  });
});

describe("relação de conexão", () => {
  it("normaliza isSeguidor/isSeguido com ou sem o prefixo 'is'", () => {
    expect(normalizarStatus({ status: "ACEITO", isSeguidor: true, isSeguido: false })).toEqual({
      status: "ACEITO",
      isSeguidor: true,
      isSeguido: false,
    });
    expect(normalizarStatus({ status: null, seguidor: false, seguido: true })).toEqual({ status: null, isSeguidor: false, isSeguido: true });
    expect(normalizarStatus({ status: "OUTRO" }).status).toBeNull();
  });

  it("usa as listas de pendentes para saber o sentido da solicitação", () => {
    const status = { status: "PENDENTE" as const, isSeguidor: false, isSeguido: false };
    expect(derivarRelacao(status, { enviadasPara: true, recebidasDe: false })).toEqual({
      ...RELACAO_VAZIA,
      solicitacaoEnviada: true,
    });
    expect(derivarRelacao(status, { enviadasPara: false, recebidasDe: true }).solicitacaoRecebida).toBe(true);
  });

  it("conexão aceita prevalece sobre pendência no mesmo sentido", () => {
    const r = derivarRelacao({ status: "ACEITO", isSeguidor: true, isSeguido: false }, { enviadasPara: true, recebidasDe: false });
    expect(r.euSigo).toBe(true);
    expect(r.solicitacaoEnviada).toBe(false);
  });

  it("rótulos do botão", () => {
    expect(rotuloBotaoConexao(RELACAO_VAZIA)).toBe("Seguir");
    expect(rotuloBotaoConexao({ ...RELACAO_VAZIA, meSegue: true })).toBe("Seguir de volta");
    expect(rotuloBotaoConexao({ ...RELACAO_VAZIA, solicitacaoEnviada: true })).toBe("Solicitação enviada");
    expect(rotuloBotaoConexao({ ...RELACAO_VAZIA, euSigo: true, meSegue: true })).toBe("Seguindo");
  });
});

describe("idConexaoPelasNotificacoes", () => {
  const n = (id: number, tipo: string, mensagem: string, referenciaId: number | null): Notificacao => ({
    idNotificacao: id,
    titulo: "",
    mensagem,
    tipo,
    referenciaId,
    lida: false,
    dataCriacao: null,
  });

  const lista = [
    n(1, "CONEXAO_SOLICITADA", "Ana Souza quer se conectar com você.", 10),
    n(2, "CONEXAO_SOLICITADA", "Ana Souza quer se conectar com você.", 10), // nova solicitação reaproveita a conexão
    n(3, "CONEXAO_SOLICITADA", "Bruno quer se conectar com você.", 11),
    n(4, "CONEXAO_ACEITA", "Carla aceitou sua solicitação de conexão.", 12),
    n(5, "CONEXAO_SOLICITADA", "Dani quer se conectar com você.", 13),
    n(6, "CONEXAO_SOLICITADA", "Dani quer se conectar com você.", 14), // duas pessoas com o mesmo nome
  ];

  it("encontra o ID pela notificação do tipo certo", () => {
    expect(idConexaoPelasNotificacoes(lista, "CONEXAO_SOLICITADA", "Ana Souza")).toBe(10);
    expect(idConexaoPelasNotificacoes(lista, "CONEXAO_ACEITA", "Carla")).toBe(12);
  });

  it("não confunde nomes que são prefixo de outros", () => {
    expect(idConexaoPelasNotificacoes(lista, "CONEXAO_SOLICITADA", "Ana")).toBeNull();
  });

  it("devolve null quando é ambíguo ou inexistente", () => {
    expect(idConexaoPelasNotificacoes(lista, "CONEXAO_SOLICITADA", "Dani")).toBeNull();
    expect(idConexaoPelasNotificacoes(lista, "CONEXAO_ACEITA", "Bruno")).toBeNull();
    expect(idConexaoPelasNotificacoes(lista, "CONEXAO_SOLICITADA", "  ")).toBeNull();
  });
});

describe("galerias de imagens", () => {
  it("usa a galeria e, sem ela, a URL principal", () => {
    expect(imagensDaGaleria(["/a.png", "/b.png", "/a.png"], "/a.png")).toEqual(["/a.png", "/b.png"]);
    expect(imagensDaGaleria([], "/capa.png")).toEqual(["/capa.png"]);
    expect(imagensDaGaleria(null, null)).toEqual([]);
  });

  it("valida quantidade, formato e tamanho como o ImagemUploadUtil", () => {
    const ok = { name: "foto.png", size: 1000, type: "image/png" };
    expect(validarArquivosGaleria([ok])).toBeNull();
    expect(validarArquivosGaleria([])).toMatch(/ao menos uma/);
    expect(validarArquivosGaleria(Array.from({ length: 11 }, () => ok))).toMatch(/no máximo 10/);
    expect(validarArquivosGaleria([{ name: "doc.pdf", size: 10, type: "application/pdf" }])).toMatch(/doc\.pdf/);
    expect(validarArquivosGaleria([{ name: "g.jpg", size: 11 * 1024 * 1024, type: "image/jpeg" }])).toMatch(/10 MB/);
  });
});

describe("autoria de respostas (usuarioId nulo no backend)", () => {
  it("prefere o usuarioId do servidor quando ele vier", () => {
    expect(autorDaResposta({ idSubComentario: 1, usuarioId: 9 }, 3, new Set([1]))).toBe(9);
  });

  it("usa o registro local só para respostas criadas pelo usuário logado", () => {
    expect(autorDaResposta({ idSubComentario: 1, usuarioId: null }, 3, new Set([1]))).toBe(3);
    expect(autorDaResposta({ idSubComentario: 2, usuarioId: null }, 3, new Set([1]))).toBeNull();
    expect(autorDaResposta({ idSubComentario: 1, usuarioId: null }, null, new Set([1]))).toBeNull();
  });
});

describe("tempoRelativo", () => {
  const agora = new Date(2026, 8, 29, 12, 0, 0);
  it("formata intervalos curtos e cai para a data após 7 dias", () => {
    expect(tempoRelativo("2026-09-29T11:59:30", agora)).toBe("agora");
    expect(tempoRelativo("2026-09-29T11:45:00", agora)).toBe("há 15 min");
    expect(tempoRelativo("2026-09-29T09:00:00", agora)).toBe("há 3 h");
    expect(tempoRelativo("2026-09-28T12:00:00", agora)).toBe("há 1 dia");
    expect(tempoRelativo("2026-09-01T12:00:00", agora)).toBe("01/09/2026");
    expect(tempoRelativo(null, agora)).toBe("");
  });
});
