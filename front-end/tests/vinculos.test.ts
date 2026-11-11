import { afterEach, describe, expect, it, vi } from "vitest";

import { temAcessoAoProjeto, vinculoDoUsuario } from "../app/services/projetoUsuario.service";
import { queryTermosAceitos } from "../app/services/termoVinculo.service";
import { buscarProjeto, criarProjeto } from "../app/services/projeto.service";
import { ProjetoUsuario } from "../app/types/ProjetoUsuario";

function vinculo(usuarioId: number, tipoVinculoId: number, nomeTipoVinculo: string, extra: Partial<ProjetoUsuario> = {}): ProjetoUsuario {
  return { idProjetoUsuario: usuarioId * 10 + tipoVinculoId, projetoId: 1, usuarioId, nomeUsuario: "x", tipoVinculoId, nomeTipoVinculo, dataVinculo: null, ...extra };
}

function respostaJson(status: number, corpo?: unknown) {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
}

const projetoApi = {
  idProjeto: 7,
  nomeProjeto: "Horta",
  descricaoProjeto: "Hortas urbanas",
  dataInicioProjeto: "20/10/2026",
  dataFimProjeto: "20/10/2027",
  tipoProjetoId: 1,
  active: true,
  urlImagemProjeto: null,
  imagens: [],
  metaFinanceira: 50000,
  valorArrecadado: 1000,
  riscos: [{ idRiscoProjeto: 3, nomeRisco: "Falha tecnológica", descricaoRisco: null }],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("acesso ao projeto (regra de validarAcessoProjeto)", () => {
  it("sem vínculo não há acesso", () => {
    expect(temAcessoAoProjeto([vinculo(2, 1, "CRIADOR")], 5)).toBe(false);
    expect(temAcessoAoProjeto([], 5)).toBe(false);
    expect(temAcessoAoProjeto([vinculo(5, 4, "VISUALIZADOR")], null)).toBe(false);
  });

  it("qualquer vínculo ou aceite dos termos libera", () => {
    expect(temAcessoAoProjeto([vinculo(5, 4, "VISUALIZADOR", { aceitouTermos: true })], 5)).toBe(true);
    expect(temAcessoAoProjeto([vinculo(5, 1, "CRIADOR", { aceitouTermos: false })], 5)).toBe(true);
    expect(temAcessoAoProjeto([vinculo(5, 3, "INVESTIDOR")], 5)).toBe(true);
  });

  it("vínculo mais forte vem primeiro", () => {
    const lista = [vinculo(5, 4, "VISUALIZADOR"), vinculo(5, 2, "SOCIO"), vinculo(6, 1, "CRIADOR")];
    expect(vinculoDoUsuario(lista, 5)?.nomeTipoVinculo).toBe("SOCIO");
    expect(vinculoDoUsuario(lista, 9)).toBeNull();
  });
});

describe("aceite de termos", () => {
  it("monta termoIds repetido e envia vazio quando não há termos", () => {
    expect(queryTermosAceitos([1, 2])).toBe("termoIds=1&termoIds=2");
    expect(queryTermosAceitos([])).toBe("termoIds=");
  });
});

describe("projeto.service com o backend atual", () => {
  it("cria o projeto em POST /projeto/{idUsuario} com riscoProjetoIds", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respostaJson(201, projetoApi));
    vi.stubGlobal("fetch", fetchMock);
    const criado = await criarProjeto(4, {
      nomeProjeto: "Horta",
      descricaoProjeto: "Hortas urbanas",
      dataInicioProjeto: "20/10/2026",
      dataFimProjeto: "20/10/2027",
      tipoProjetoId: 1,
      metaFinanceira: 50000,
      valorArrecadado: 1000,
      riscoProjetoIds: [3],
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/projeto\/4$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toMatchObject({ riscoProjetoIds: [3], metaFinanceira: 50000 });
    expect(criado.riscos?.[0].nomeRisco).toBe("Falha tecnológica");
    expect(criado.ficha).toEqual({ meta: 50000, captado: 1000 });
  });

  it("localiza o projeto na listagem (GET /projeto/{id} responde 400 no backend atual)", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(respostaJson(200, [projetoApi]));
    vi.stubGlobal("fetch", fetchMock);
    const projeto = await buscarProjeto(7);
    expect(projeto.nomeProjeto).toBe("Horta");
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/projeto$/);
  });

  it("projeto ausente na listagem é 404", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(respostaJson(200, [projetoApi])));
    await expect(buscarProjeto(99)).rejects.toMatchObject({ status: 404 });
  });
});
