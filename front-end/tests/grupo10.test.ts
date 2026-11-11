import { afterEach, describe, expect, it, vi } from "vitest";
import {
  camposDaFicha,
  camposFinanceirosApi,
  combinarFicha,
  lerDescricaoProjeto,
  montarDescricaoProjeto,
  resumoFinanceiro,
  textoDaDescricao,
  validarCamposFicha,
} from "../app/lib/fichaProjeto";
import { linhaDoTempo } from "../app/lib/projeto";
import { itensVerificacao, tipoDocumento } from "../app/lib/verificacao";
import { ehEmpresa } from "../app/services/empresa.service";
import { ehParteDoContrato } from "../app/services/projetoUsuario.service";
import { normalizarProjeto } from "../app/services/projeto.service";
import { linkDaPostagem } from "../app/components/PostCard";

describe("ficha financeira do projeto (campos reais do DTO)", () => {
  it("não grava mais o bloco na descrição", () => {
    expect(montarDescricaoProjeto("  App de entregas.  ", { meta: 100000, participacao: 15 })).toBe("App de entregas.");
  });

  it("lê o bloco de projetos antigos sem mostrá-lo no texto", () => {
    const antiga = 'App de entregas.\n\n<!--pitcherx:ficha {"v":1,"participacao":15,"usoRecursos":"fase 1 --\\u003e fase 2"}-->';
    const lido = lerDescricaoProjeto(antiga);
    expect(lido.texto).toBe("App de entregas.");
    expect(lido.ficha).toEqual({ participacao: 15, usoRecursos: "fase 1 --> fase 2" });
    expect(textoDaDescricao(antiga)).toBe("App de entregas.");
  });

  it("campos financeiros enviados no ProjetoRequestDTO", () => {
    expect(camposFinanceirosApi({ meta: 100000, captado: 65000, investimentoMinimo: 5000, participacao: 15, usoRecursos: " marketing " })).toEqual({
      metaFinanceira: 100000,
      valorArrecadado: 65000,
      investimentoMinimo: 5000,
      participacaoOferecida: 15,
      usoRecursos: "marketing",
    });
    expect(camposFinanceirosApi({ meta: 10 })).toEqual({
      metaFinanceira: 10,
      valorArrecadado: null,
      investimentoMinimo: 0,
      participacaoOferecida: 0,
      usoRecursos: null,
    });
  });

  it("campos reais têm prioridade sobre o bloco legado", () => {
    const legado = lerDescricaoProjeto('X\n\n<!--pitcherx:ficha {"v":1,"meta":50,"captado":5,"participacao":10}-->').ficha;
    expect(combinarFicha({ metaFinanceira: 200, valorArrecadado: 20, participacaoOferecida: 25, investimentoMinimo: 100 }, legado)).toEqual({
      meta: 200,
      captado: 20,
      participacao: 25,
      investimentoMinimo: 100,
    });
    expect(combinarFicha({ metaFinanceira: null, valorArrecadado: null }, legado)).toEqual({ meta: 50, captado: 5, participacao: 10 });
  });

  it("descrição sem bloco", () => {
    expect(lerDescricaoProjeto("Projeto antigo sem ficha")).toEqual({ texto: "Projeto antigo sem ficha", ficha: null });
  });

  it("bloco corrompido é ignorado e removido da exibição", () => {
    const lido = lerDescricaoProjeto("Texto\n\n<!--pitcherx:ficha {quebrado}-->");
    expect(lido.texto).toBe("Texto");
    expect(lido.ficha).toBeNull();
  });

  it("resumo: restante e percentual só com meta e captado", () => {
    expect(resumoFinanceiro({ meta: 100000, captado: 65000 })).toMatchObject({ restante: 35000, percentual: 65, metaAtingida: false });
    expect(resumoFinanceiro({ meta: 100000 })).toMatchObject({ restante: null, percentual: null });
    expect(resumoFinanceiro({ meta: 1000, captado: 1500 })).toMatchObject({ restante: 0, percentual: 150, metaAtingida: true });
    expect(resumoFinanceiro(null)).toMatchObject({ meta: null, captado: null, percentual: null });
  });

  it("valida o formulário (pt-BR) e rejeita valores incoerentes", () => {
    expect(validarCamposFicha({ meta: "100.000", captado: "65.000,50", participacao: "15%", investimentoMinimo: "5.000", usoRecursos: "" }).ficha).toEqual({
      meta: 100000,
      captado: 65000.5,
      participacao: 15,
      investimentoMinimo: 5000,
    });
    // participacaoOferecida é Integer no backend.
    expect(validarCamposFicha({ meta: "10", captado: "", participacao: "15,5", investimentoMinimo: "", usoRecursos: "" }).erros.participacao).toBeTruthy();
    expect(validarCamposFicha({ meta: "", captado: "10", participacao: "", investimentoMinimo: "", usoRecursos: "" }).erros.meta).toBeTruthy();
    expect(validarCamposFicha({ meta: "10", captado: "", participacao: "120", investimentoMinimo: "", usoRecursos: "" }).erros.participacao).toBeTruthy();
    expect(validarCamposFicha({ meta: "abc", captado: "", participacao: "", investimentoMinimo: "", usoRecursos: "" }).erros.meta).toBeTruthy();
    expect(validarCamposFicha({ meta: "", captado: "", participacao: "", investimentoMinimo: "", usoRecursos: "" }).ficha).toBeNull();
  });

  it("campos do formulário a partir da ficha salva", () => {
    expect(camposDaFicha({ meta: 100000, participacao: 15 })).toMatchObject({ meta: "100000", participacao: "15", captado: "" });
  });

  it("projeto.service monta a ficha a partir dos campos reais", () => {
    const p = normalizarProjeto({
      idProjeto: 1,
      nomeProjeto: "A",
      descricaoProjeto: "Desc",
      dataInicioProjeto: "01/01/2026",
      dataFimProjeto: "01/02/2026",
      tipoProjetoId: 1,
      active: true,
      urlImagemProjeto: null,
      metaFinanceira: 50,
      valorArrecadado: null,
      investimentoMinimo: 10,
      participacaoOferecida: 5,
      usoRecursos: "Equipe",
      riscos: [],
    });
    expect(p.descricaoProjeto).toBe("Desc");
    expect(p.ficha).toEqual({ meta: 50, participacao: 5, investimentoMinimo: 10, usoRecursos: "Equipe" });
  });
});

describe("linha do tempo do projeto", () => {
  const hoje = new Date(2026, 9, 2);
  const base = { active: true, dataInicioProjeto: "01/10/2026", dataFimProjeto: "31/10/2026" };
  it("deriva o status das datas e do active", () => {
    expect(linhaDoTempo(base, hoje).situacao).toBe("em_andamento");
    expect(linhaDoTempo({ ...base, dataInicioProjeto: "10/10/2026" }, hoje).situacao).toBe("nao_iniciado");
    expect(linhaDoTempo({ ...base, dataFimProjeto: "01/10/2026" }, hoje).situacao).toBe("encerrado");
    expect(linhaDoTempo({ ...base, active: false }, hoje).situacao).toBe("inativo");
  });
  it("calcula duração e dias restantes", () => {
    const t = linhaDoTempo(base, hoje);
    expect(t.duracaoDias).toBe(30);
    expect(t.diasRestantes).toBe(29);
    expect(t.prazoDecorrido).toBeCloseTo(3.33, 1);
  });
});

describe("verificação da conta", () => {
  it("e-mail verificado = conta ativa (código do cadastro); inativa = pendente", () => {
    const itens = itensVerificacao({ email: "a@a.com", ativo: true, identificador: "529.982.247-25" });
    expect(itens.find((i) => i.chave === "email")?.status).toBe("verificado");
    expect(itensVerificacao({ email: "a@a.com", ativo: false }).find((i) => i.chave === "email")?.status).toBe("pendente");
    expect(itens.find((i) => i.chave === "identidade")?.status).toBe("verificado");
    expect(itens.find((i) => i.chave === "conta")?.status).toBe("verificado");
  });
  it("sem documento: pendente; documento inválido: não verificado; conta desativada", () => {
    expect(itensVerificacao({ email: "a@a.com", identificador: null }).find((i) => i.chave === "identidade")?.status).toBe("pendente");
    expect(itensVerificacao({ email: "a@a.com", identificador: "111.111.111-11" }).find((i) => i.chave === "identidade")?.status).toBe("nao_verificado");
    expect(itensVerificacao({ email: "a@a.com", ativo: false }).find((i) => i.chave === "conta")?.status).toBe("nao_verificado");
    expect(itensVerificacao({ email: "a@a.com", perfilIndisponivel: true }).some((i) => i.chave === "identidade")).toBe(false);
  });
  it("tipo de documento", () => {
    expect(tipoDocumento("529.982.247-25")).toBe("CPF");
    expect(tipoDocumento("11.222.333/0001-81")).toBe("CNPJ");
    expect(tipoDocumento("")).toBeNull();
  });
});

describe("empresas e permissões de contrato", () => {
  it("empresa = role EMPRESA ou perfil com CNPJ", () => {
    expect(ehEmpresa({ roles: ["USUARIO", "EMPRESA"] })).toBe(true);
    expect(ehEmpresa({ roles: ["USUARIO"] }, { identificador: "11.222.333/0001-81" })).toBe(true);
    expect(ehEmpresa({ roles: ["USUARIO"] }, { identificador: "529.982.247-25" })).toBe(false);
    expect(ehEmpresa(null)).toBe(false);
  });
  it("só criador, sócio e investidor são parte do contrato", () => {
    const vinculos = [
      { usuarioId: 1, tipoVinculoId: 1 },
      { usuarioId: 2, tipoVinculoId: 2 },
      { usuarioId: 3, tipoVinculoId: 3 },
      { usuarioId: 4, tipoVinculoId: 4 },
    ];
    expect(ehParteDoContrato(vinculos, 1)).toBe(true);
    expect(ehParteDoContrato(vinculos, 2)).toBe(true);
    expect(ehParteDoContrato(vinculos, 3)).toBe(true);
    expect(ehParteDoContrato(vinculos, 4)).toBe(false);
    expect(ehParteDoContrato(vinculos, 99)).toBe(false);
    expect(ehParteDoContrato(vinculos, null)).toBe(false);
  });
});

describe("compartilhamento", () => {
  it("o link usa o ID da postagem na rota da publicação", () => {
    expect(linkDaPostagem(42, "https://pitcherx.app")).toBe("https://pitcherx.app/publicacao/42");
  });
});

describe("denúncias", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("valida categoria e detalhes", async () => {
    const { validarDenuncia } = await import("../app/services/denuncia.service");
    expect(validarDenuncia("", "")).toBeTruthy();
    expect(validarDenuncia("OUTROS", "  ")).toBeTruthy();
    expect(validarDenuncia("SPAM", "")).toBeNull();
    expect(validarDenuncia("SPAM", "x".repeat(1001))).toBeTruthy();
  });

  it("envia POST /denuncia com o DenunciaRequestDTO", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ idDenuncia: 9, tipoDenuncia: "POSTAGEM", alvoId: 3, categoria: "SPAM", status: "PENDENTE" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    const { enviarDenuncia, jaDenunciado } = await import("../app/services/denuncia.service");
    const d = await enviarDenuncia({ tipoDenuncia: "POSTAGEM", alvoId: 3, categoria: "SPAM", descricao: "  spam  " });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/denuncia$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ tipoDenuncia: "POSTAGEM", alvoId: 3, categoria: "SPAM", descricao: "spam" });
    expect(jaDenunciado([d], "POSTAGEM", 3)).toBe(true);
    expect(jaDenunciado([d], "PROJETO", 3)).toBe(false);
  });
});
