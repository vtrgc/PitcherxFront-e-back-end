import { afterEach, describe, expect, it, vi } from "vitest";
import {
  chaveDia,
  explicacaoSituacao,
  gerarChaveCliente,
  horarioCurto,
  mesclarMensagens,
  podeEditar,
  previaMensagem,
  rotuloDia,
  totalNaoLidas,
} from "../app/lib/mensagens";
import { Conversa, Mensagem, MensagemNaTela } from "../app/types/Mensagem";

function msg(id: number, extra: Partial<Mensagem> = {}): Mensagem {
  return {
    idMensagem: id,
    conversaId: 1,
    remetenteId: 10,
    conteudo: `m${id}`,
    dataEnvio: "2026-11-17T12:00:00Z",
    lida: false,
    dataLeitura: null,
    dataEdicao: null,
    excluida: false,
    minha: true,
    ...extra,
  };
}

describe("lib/mensagens", () => {
  afterEach(() => vi.restoreAllMocks());

  it("mescla pelo id, a versão do servidor vence e as otimistas ficam no fim", () => {
    const otimista: MensagemNaTela = { ...msg(-1), conteudo: "enviando", estadoEnvio: "enviando", chaveCliente: "k" };
    const atuais: MensagemNaTela[] = [msg(1), msg(3), otimista];
    const r = mesclarMensagens(atuais, [msg(2), msg(3, { lida: true })]);
    expect(r.map((m) => m.idMensagem)).toEqual([1, 2, 3, -1]);
    expect(r[2].lida).toBe(true);
    expect(r[3].estadoEnvio).toBe("enviando");
    // nada novo: mesma referência (evita renderizar à toa a cada consulta)
    expect(mesclarMensagens(atuais, [])).toBe(atuais);
    expect(mesclarMensagens(atuais, [msg(1)])).toBe(atuais);
    expect(mesclarMensagens(atuais, [msg(1, { excluida: true, conteudo: null })])).not.toBe(atuais);
  });

  it("prévia: prefixo para mensagens minhas, mensagem apagada e corte com reticências", () => {
    expect(previaMensagem(null)).toBe("Nenhuma mensagem ainda");
    expect(previaMensagem(msg(1, { conteudo: "Oi\n  tudo   bem?" }))).toBe("Você: Oi tudo bem?");
    expect(previaMensagem(msg(1, { minha: false, excluida: true, conteudo: null }))).toBe("Mensagem apagada");
    expect(previaMensagem(msg(1, { minha: false, conteudo: "a".repeat(100) }), 10)).toBe(`${"a".repeat(9)}…`);
  });

  it("horário curto e separador de dias", () => {
    const agora = new Date(2026, 10, 17, 18, 0);
    expect(horarioCurto(new Date(2026, 10, 17, 9, 5).toISOString(), agora)).toBe("09:05");
    expect(horarioCurto(new Date(2026, 10, 16, 9, 5).toISOString(), agora)).toBe("Ontem");
    expect(horarioCurto(new Date(2026, 9, 2, 9, 5).toISOString(), agora)).toBe("02/10");
    expect(rotuloDia(new Date(2026, 10, 17, 1, 0).toISOString(), agora)).toBe("Hoje");
    expect(rotuloDia(new Date(2026, 10, 16, 23, 0).toISOString(), agora)).toBe("Ontem");
    expect(rotuloDia(new Date(2026, 10, 2, 12, 0).toISOString(), agora)).toMatch(/2 de novembro de 2026/);
    expect(chaveDia(new Date(2026, 10, 2, 12, 0).toISOString())).toBe(chaveDia(new Date(2026, 10, 2, 23, 59).toISOString()));
    expect(horarioCurto(null, agora)).toBe("");
  });

  it("edição só para mensagem minha, não apagada e dentro de 15 minutos", () => {
    const agora = Date.parse("2026-11-17T12:10:00Z");
    expect(podeEditar(msg(1), agora)).toBe(true);
    expect(podeEditar(msg(1, { minha: false }), agora)).toBe(false);
    expect(podeEditar(msg(1, { excluida: true }), agora)).toBe(false);
    expect(podeEditar(msg(1), Date.parse("2026-11-17T12:16:00Z"))).toBe(false);
  });

  it("chave de envio única", () => {
    const chaves = new Set(Array.from({ length: 50 }, () => gerarChaveCliente()));
    expect(chaves.size).toBe(50);
    for (const c of chaves) expect(c.length).toBeLessThanOrEqual(64);
  });

  it("explica cada situação em que não dá para enviar", () => {
    expect(explicacaoSituacao("CONECTADOS", "Ana")).toBe("");
    expect(explicacaoSituacao("PENDENTE_ENVIADA", "Ana")).toMatch(/ainda não foi aceita/);
    expect(explicacaoSituacao("PENDENTE_RECEBIDA", "Ana")).toMatch(/Aceite a solicitação/);
    expect(explicacaoSituacao("SEM_CONEXAO", "Ana")).toMatch(/não estão conectados/);
    expect(explicacaoSituacao(null, "Ana", "Motivo do servidor")).toBe("Motivo do servidor");
  });

  it("soma as não lidas das conversas", () => {
    const c = (n: number) => ({ naoLidas: n }) as Conversa;
    expect(totalNaoLidas([c(2), c(0), c(5)])).toBe(7);
  });
});
