import { afterEach, describe, expect, it, vi } from "vitest";
import { validarArquivosVideo, videosDaGaleria } from "../app/lib/video";
import { aceitarProposta, criarProposta, recusarProposta } from "../app/services/proposta.service";
import { aceitarContraProposta, rejeitarContraProposta } from "../app/services/contraProposta.service";
import { aceitarContrato } from "../app/services/contrato.service";
import { alterarNivelConta, analisarIdentidade, listarIdentidadesPendentes } from "../app/services/usuario.service";
import { decidirDenuncia } from "../app/services/denuncia.service";

function resposta(status: number, corpo: unknown) {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
}

afterEach(() => vi.unstubAllGlobals());

describe("vídeos", () => {
  it("valida extensão, tamanho e quantidade como o UploadUtil", () => {
    expect(validarArquivosVideo([{ name: "a.mp4", size: 10 }])).toBeNull();
    expect(validarArquivosVideo([{ name: "a.avi", size: 10 }])).toMatch(/não é um vídeo/);
    expect(validarArquivosVideo([{ name: "a.webm", size: 300 * 1024 * 1024 }])).toMatch(/256 MB/);
    expect(validarArquivosVideo([{ name: "a.mp4", size: 1 }, { name: "b.mp4", size: 1 }], 1)).toMatch(/no máximo 1/);
  });
  it("junta lista e vídeo principal sem repetir", () => {
    expect(videosDaGaleria(["x", "y"], "x")).toEqual(["x", "y"]);
    expect(videosDaGaleria(null, null)).toEqual([]);
  });
});

describe("endpoints de negociação", () => {
  it("proposta: cria com projetoId e decide em /proposta/aceitar|recusar/{id}", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(resposta(200, { idProposta: 5, statusProposta: "ACEITA" })));
    vi.stubGlobal("fetch", fetchMock);
    await criarProposta({ descricaoProposta: "Oferta", valorProposta: 100, projetoId: 2 });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ descricaoProposta: "Oferta", valorProposta: 100, projetoId: 2 });
    await aceitarProposta(5);
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/proposta\/aceitar\/5$/);
    expect(fetchMock.mock.calls[1][1].method).toBe("PUT");
    await recusarProposta(5);
    expect(fetchMock.mock.calls[2][0]).toMatch(/\/proposta\/recusar\/5$/);
  });

  it("contraproposta: decisão com ContraPropostaDecisionDTO", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(resposta(200, { idContraProposta: 3 })));
    vi.stubGlobal("fetch", fetchMock);
    await aceitarContraProposta(3);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/contra-proposta\/3\/aceitar$/);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ status: "ACEITA" });
    await rejeitarContraProposta(3, "Valor baixo");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ status: "REJEITADA", justificativa: "Valor baixo" });
  });

  it("contrato: PUT /contrato/{id}/aceitar", async () => {
    const fetchMock = vi.fn().mockResolvedValue(resposta(200, { idContrato: 1, statusContrato: "ACEITE" }));
    vi.stubGlobal("fetch", fetchMock);
    const c = await aceitarContrato(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/contrato\/1\/aceitar$/);
    expect(c.statusContrato).toBe("ACEITE");
  });
});

describe("administração", () => {
  it("identidade: lista paginada, análise e nível", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(resposta(200, { content: [{ idUsuario: 7 }], totalElements: 1, totalPages: 1, number: 0 }))
      .mockImplementation(() => Promise.resolve(resposta(200, { idUsuario: 7 })));
    vi.stubGlobal("fetch", fetchMock);
    const pagina = await listarIdentidadesPendentes(0, 20);
    expect(pagina.itens).toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/usuario\/admin\/identidade-pendentes\?page=0&size=20$/);
    await analisarIdentidade(7, "REPROVADA", " ilegível ");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ status: "REPROVADA", justificativa: "ilegível" });
    await alterarNivelConta(7, 3);
    expect(fetchMock.mock.calls[2][0]).toMatch(/\/usuario\/admin\/nivel-conta\/7$/);
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ nivelId: 3 });
  });

  it("denúncia: decisão do admin", async () => {
    const fetchMock = vi.fn().mockResolvedValue(resposta(200, { idDenuncia: 2, status: "ACEITA" }));
    vi.stubGlobal("fetch", fetchMock);
    await decidirDenuncia(2, { status: "ACEITA", decisaoAdmin: "Viola as regras", acaoTomada: "OCULTO" });
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/denuncia\/admin\/2\/decisao$/);
    expect(fetchMock.mock.calls[0][1].method).toBe("PUT");
  });
});

describe("autoria e situação da negociação", () => {
  it("bloco de autoria some do texto e volta na leitura", async () => {
    const { montarDescricaoProposta, lerDescricaoProposta } = await import("../app/lib/autoriaProposta");
    const d = montarDescricaoProposta("Invisto 5 mil --> já", { id: 7, nome: "Bruno" });
    expect(lerDescricaoProposta(d)).toEqual({ texto: "Invisto 5 mil --> já", autor: { id: 7, nome: "Bruno" } });
    // reeditar não duplica o bloco
    expect(lerDescricaoProposta(montarDescricaoProposta(d, { id: 7, nome: "Bruno" })).texto).toBe("Invisto 5 mil --> já");
    expect(lerDescricaoProposta("antiga")).toEqual({ texto: "antiga", autor: null });
  });

  it("situação muda conforme o papel e os status reais", async () => {
    const { situacaoNegociacao, valorAcordado } = await import("../app/lib/negociacao");
    const p = { idProposta: 1, descricaoProposta: "x", valorProposta: 100, statusProposta: "PENDENTE" };
    const pend = [{ idContraProposta: 1, propostaId: 1, descricaoContraProposta: "y", valorContraProposta: 80, status: "PENDENTE" }];
    expect(situacaoNegociacao(p, [], "dono")).toMatchObject({ codigo: "aguardando_dono", minhaVez: true });
    expect(situacaoNegociacao(p, pend, "autor")).toMatchObject({ codigo: "contra_pendente", rotulo: "Contraproposta recebida", minhaVez: true });
    expect(situacaoNegociacao(p, pend, "dono")).toMatchObject({ minhaVez: false });
    const aceita = [{ ...pend[0], status: "ACEITA" }];
    expect(situacaoNegociacao(p, aceita, "dono")).toMatchObject({ codigo: "contra_aceita", minhaVez: true });
    expect(valorAcordado(p, aceita)).toBe(80);
    expect(situacaoNegociacao({ ...p, statusProposta: "RECUSADA" }, aceita, "autor").codigo).toBe("recusada");
  });
});
