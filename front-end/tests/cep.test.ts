import { afterEach, describe, expect, it, vi } from "vitest";
import { ErroCep, cepValido, consultarCep, formatarCep, lerRespostaBrasilApi, lerRespostaViaCep } from "../app/lib/cep";

function resposta(status: number, corpo: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => corpo } as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe("CEP — formatação e validação", () => {
  it("formata enquanto digita e valida 8 dígitos", () => {
    expect(formatarCep("01001")).toBe("01001");
    expect(formatarCep("01001000")).toBe("01001-000");
    expect(formatarCep("01001-0009")).toBe("01001-000");
    expect(cepValido("01001-000")).toBe(true);
    expect(cepValido("0100100")).toBe(false);
    expect(cepValido("00000000")).toBe(false);
  });

  it("normaliza as respostas da ViaCEP e da BrasilAPI", () => {
    expect(lerRespostaViaCep({ logradouro: "Praça da Sé", bairro: "Sé", localidade: "São Paulo", uf: "sp" }, "01001000")).toEqual({
      cep: "01001000",
      logradouro: "Praça da Sé",
      bairro: "Sé",
      cidade: "São Paulo",
      uf: "SP",
    });
    expect(lerRespostaViaCep({ erro: true }, "99999999")).toBeNull();
    expect(lerRespostaViaCep({ erro: "true" }, "99999999")).toBeNull();
    expect(lerRespostaBrasilApi({ street: "Rua A", neighborhood: "B", city: "C", state: "RJ" }, "20000000").uf).toBe("RJ");
  });
});

describe("CEP — consulta", () => {
  it("CEP inválido não faz requisição", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(consultarCep("123")).rejects.toMatchObject({ motivo: "invalido" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preenche com a ViaCEP", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(resposta(200, { logradouro: "Praça da Sé", bairro: "Sé", localidade: "São Paulo", uf: "SP" })));
    await expect(consultarCep("01001-000")).resolves.toMatchObject({ logradouro: "Praça da Sé", uf: "SP", cidade: "São Paulo" });
  });

  it("CEP inexistente", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(resposta(200, { erro: true })));
    const erro = await consultarCep("12345678").catch((e) => e);
    expect(erro).toBeInstanceOf(ErroCep);
    expect(erro.motivo).toBe("inexistente");
  });

  it("usa a BrasilAPI quando a ViaCEP falha na rede", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(resposta(200, { street: "Rua X", neighborhood: "Centro", city: "Curitiba", state: "PR" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(consultarCep("80010000")).resolves.toMatchObject({ cidade: "Curitiba", uf: "PR" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("serviço indisponível nas duas fontes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(consultarCep("80010000")).rejects.toMatchObject({ motivo: "indisponivel" });
  });
});
