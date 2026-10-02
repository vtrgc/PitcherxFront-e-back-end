import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  camposDaFicha,
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

describe("ficha financeira do projeto (guardada na descrição)", () => {
  it("monta e lê de volta sem mostrar o bloco no texto", () => {
    const descricao = montarDescricaoProjeto("App de entregas.", { meta: 100000, captado: 65000, participacao: 15 });
    expect(descricao.startsWith("App de entregas.")).toBe(true);
    const lido = lerDescricaoProjeto(descricao);
    expect(lido.texto).toBe("App de entregas.");
    expect(lido.ficha).toEqual({ meta: 100000, captado: 65000, participacao: 15 });
    expect(textoDaDescricao(descricao)).toBe("App de entregas.");
  });

  it("sem dados financeiros, a descrição fica igual", () => {
    expect(montarDescricaoProjeto("  Só texto  ", null)).toBe("Só texto");
    expect(montarDescricaoProjeto("Só texto", {})).toBe("Só texto");
    expect(lerDescricaoProjeto("Projeto antigo sem ficha")).toEqual({ texto: "Projeto antigo sem ficha", ficha: null });
  });

  it("bloco corrompido é ignorado e removido da exibição", () => {
    const lido = lerDescricaoProjeto("Texto\n\n<!--pitcherx:ficha {quebrado}-->");
    expect(lido.texto).toBe("Texto");
    expect(lido.ficha).toBeNull();
  });

  it("texto com '-->' no uso dos recursos não quebra o bloco", () => {
    const d = montarDescricaoProjeto("X", { meta: 10, usoRecursos: "fase 1 --> fase 2" });
    expect(lerDescricaoProjeto(d).ficha?.usoRecursos).toBe("fase 1 --> fase 2");
  });

  it("resumo: restante e percentual só com meta e captado", () => {
    expect(resumoFinanceiro({ meta: 100000, captado: 65000 })).toMatchObject({ restante: 35000, percentual: 65, metaAtingida: false });
    expect(resumoFinanceiro({ meta: 100000 })).toMatchObject({ restante: null, percentual: null });
    expect(resumoFinanceiro({ meta: 1000, captado: 1500 })).toMatchObject({ restante: 0, percentual: 150, metaAtingida: true });
    expect(resumoFinanceiro(null)).toMatchObject({ meta: null, captado: null, percentual: null });
  });

  it("valida o formulário (pt-BR) e rejeita valores incoerentes", () => {
    expect(validarCamposFicha({ meta: "100.000", captado: "65.000,50", participacao: "15,5%", investimentoMinimo: "", usoRecursos: "" }).ficha).toEqual({
      meta: 100000,
      captado: 65000.5,
      participacao: 15.5,
    });
    expect(validarCamposFicha({ meta: "", captado: "10", participacao: "", investimentoMinimo: "", usoRecursos: "" }).erros.meta).toBeTruthy();
    expect(validarCamposFicha({ meta: "10", captado: "", participacao: "120", investimentoMinimo: "", usoRecursos: "" }).erros.participacao).toBeTruthy();
    expect(validarCamposFicha({ meta: "abc", captado: "", participacao: "", investimentoMinimo: "", usoRecursos: "" }).erros.meta).toBeTruthy();
    expect(validarCamposFicha({ meta: "", captado: "", participacao: "", investimentoMinimo: "", usoRecursos: "" }).ficha).toBeNull();
  });

  it("campos do formulário a partir da ficha salva", () => {
    expect(camposDaFicha({ meta: 100000, participacao: 15.5 })).toMatchObject({ meta: "100000", participacao: "15,5", captado: "" });
  });

  it("projeto.service separa texto e ficha em toda resposta", () => {
    const p = normalizarProjeto({
      idProjeto: 1,
      nomeProjeto: "A",
      descricaoProjeto: montarDescricaoProjeto("Desc", { meta: 50 }),
      dataInicioProjeto: "01/01/2026",
      dataFimProjeto: "01/02/2026",
      tipoProjetoId: 1,
      active: true,
      urlImagemProjeto: null,
    });
    expect(p.descricaoProjeto).toBe("Desc");
    expect(p.ficha).toEqual({ meta: 50 });
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
  it("e-mail nunca aparece como verificado (não há confirmação no backend)", () => {
    const itens = itensVerificacao({ email: "a@a.com", ativo: true, identificador: "529.982.247-25" });
    expect(itens.find((i) => i.chave === "email")?.status).toBe("nao_verificado");
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
  const armazenamento = new Map<string, string>();
  beforeEach(() => {
    armazenamento.clear();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => armazenamento.get(k) ?? null,
        setItem: (k: string, v: string) => armazenamento.set(k, v),
        removeItem: (k: string) => armazenamento.delete(k),
      },
      dispatchEvent: () => true,
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("registra, impede duplicada e desfaz", async () => {
    const { enviarDenuncia, jaDenunciado, desfazerDenuncia, validarDenuncia } = await import("../app/services/denuncia.service");
    expect(validarDenuncia("", "")).toBeTruthy();
    expect(validarDenuncia("OUTRO", "  ")).toBeTruthy();
    expect(validarDenuncia("SPAM", "")).toBeNull();
    await enviarDenuncia(7, { tipo: "POSTAGEM", conteudoId: 3, motivo: "SPAM", detalhes: "" });
    expect(jaDenunciado(7, "POSTAGEM", 3)).toBe(true);
    expect(jaDenunciado(8, "POSTAGEM", 3)).toBe(false);
    expect(jaDenunciado(7, "COMENTARIO", 3)).toBe(false);
    await expect(enviarDenuncia(7, { tipo: "POSTAGEM", conteudoId: 3, motivo: "SPAM", detalhes: "" })).rejects.toThrow(/já denunciou/);
    desfazerDenuncia(7, "POSTAGEM", 3);
    expect(jaDenunciado(7, "POSTAGEM", 3)).toBe(false);
  });
});
