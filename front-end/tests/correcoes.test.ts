import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, NetworkError, mensagemErro } from "../app/lib/api";
import { hojeServidorInput, validarDatasProjeto } from "../app/lib/date";
import { LIMITES, mesmoNome } from "../app/lib/limites";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("mensagemErro", () => {
  it("em 5xx usa a mensagem de contexto da tela (o backend só devolve um texto genérico)", () => {
    const erro = new ApiError(500, { message: "Ocorreu um erro interno no servidor." }, "x");
    expect(mensagemErro(erro, "Não foi possível excluir: registro em uso.")).toBe("Não foi possível excluir: registro em uso.");
    // Sem mensagem de contexto, mantém o texto genérico (sem detalhes internos).
    expect(mensagemErro(erro)).toBe("Ocorreu um erro no servidor. Tente novamente em instantes.");
  });

  it("em 4xx mostra a mensagem do servidor ou os erros de campo", () => {
    expect(mensagemErro(new ApiError(400, { message: "A senha atual está incorreta!" }, "x"), "fallback")).toBe(
      "A senha atual está incorreta!"
    );
    expect(mensagemErro(new ApiError(400, { message: "Erro", errors: { a: "Campo A obrigatório." } }, "x"))).toBe(
      "Campo A obrigatório."
    );
  });

  it("erros de rede e desconhecidos", () => {
    expect(mensagemErro(new NetworkError(true))).toMatch(/demorou demais/);
    expect(mensagemErro(new Error("interno"), "Falhou.")).toBe("Falhou.");
    expect(mensagemErro("qualquer")).toBe("Não foi possível concluir a operação.");
  });
});

describe("datas conferidas pelo servidor", () => {
  it("hojeServidorInput usa a maior data entre local e UTC", () => {
    const agora = new Date("2026-09-24T02:30:00Z"); // 23/09 23:30 em UTC-3
    const hoje = hojeServidorInput(agora);
    // Em UTC-3 a data local ainda é 23/09, mas o servidor em UTC já está em 24/09.
    expect(hoje).toBe("2026-09-24");
  });

  it("validarDatasProjeto segue @FutureOrPresent/@Future", () => {
    expect(validarDatasProjeto("2026-09-20", "2026-10-01", "2026-09-23")).toMatch(/anterior a hoje/);
    expect(validarDatasProjeto("2026-09-23", "2026-09-23", "2026-09-23")).toMatch(/data futura/);
    expect(validarDatasProjeto("2026-09-25", "2026-09-24", "2026-09-23")).toMatch(/anterior à data de início/);
    expect(validarDatasProjeto("2026-09-23", "2026-09-24", "2026-09-23")).toBeNull();
  });
});

describe("limites do banco", () => {
  it("reflete as colunas das migrations", () => {
    expect(LIMITES.tituloPostagem).toBe(80);
    // V24 ampliou url_imagem_projeto de VARCHAR(155) para VARCHAR(2048).
    expect(LIMITES.urlImagemProjeto).toBe(2048);
    expect(LIMITES.imagensGaleria).toBe(10);
    expect(LIMITES.descricaoTermo).toBe(255);
    expect(LIMITES.nomeEspecialidade).toBe(120);
    expect(LIMITES.textoEndereco).toBe(155);
  });

  it("mesmoNome ignora espaços e maiúsculas", () => {
    expect(mesmoNome("  Backend ", "backend")).toBe(true);
    expect(mesmoNome("Ação", "AÇÃO")).toBe(true);
    expect(mesmoNome("Back", "Backend")).toBe(false);
    expect(mesmoNome(null, "")).toBe(true);
  });
});

describe("serviço de perfis", () => {
  it("ignora perfis sem usuário vinculado", async () => {
    vi.stubGlobal("window", { localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, dispatchEvent: () => true });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            { idPerfilUsuario: 1, linkedin: "x", identificador: "y", especialidade: null, usuario: { idUsuario: 3, nomeUsuario: "A", emailUsuario: "a@a.com", active: true } },
            { idPerfilUsuario: 2, linkedin: "x", identificador: "y", especialidade: null, usuario: null },
          ]),
          { status: 200 }
        )
      )
    );
    const { listarPerfisUsuario } = await import("../app/services/perfilUsuario.service");
    const perfis = await listarPerfisUsuario();
    expect(perfis.map((p) => p.idPerfilUsuario)).toEqual([1]);
  });
});
