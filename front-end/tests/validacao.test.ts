import { describe, expect, it } from "vitest";
import {
  documentoValido,
  emailValido,
  formatarDocumento,
  formatarMoeda,
  parseValorMonetario,
  telefoneValido,
  validarCadastro,
} from "../app/lib/validacao";

describe("validações de formulário", () => {
  it("e-mail", () => {
    expect(emailValido("a@b.com")).toBe(true);
    expect(emailValido("a@b")).toBe(false);
    expect(emailValido("sem arroba")).toBe(false);
  });

  it("CPF e CNPJ com dígitos verificadores", () => {
    expect(documentoValido("529.982.247-25")).toBe(true);
    expect(documentoValido("111.111.111-11")).toBe(false);
    expect(documentoValido("529.982.247-24")).toBe(false);
    expect(documentoValido("11.222.333/0001-81")).toBe(true);
    expect(documentoValido("11.222.333/0001-80")).toBe(false);
    expect(formatarDocumento("52998224725")).toBe("529.982.247-25");
    expect(formatarDocumento("11222333000181")).toBe("11.222.333/0001-81");
  });

  it("telefone", () => {
    expect(telefoneValido("(11) 99999-9999")).toBe(true);
    expect(telefoneValido("1234")).toBe(false);
  });

  it("valores monetários", () => {
    expect(parseValorMonetario("")).toBeNull();
    expect(parseValorMonetario("1500")).toBe(1500);
    expect(parseValorMonetario("1.500,50")).toBe(1500.5);
    expect(parseValorMonetario("10.5")).toBe(10.5);
    expect(Number.isNaN(parseValorMonetario("1,2,3"))).toBe(true);
    expect(formatarMoeda(null)).toBe("Valor a combinar");
    expect(formatarMoeda(10)).toContain("10,00");
  });

  it("cadastro", () => {
    expect(validarCadastro({ nome: "", email: "x", senha: "1", confirmarSenha: "2" })).toMatchObject({
      nome: expect.any(String),
      email: expect.any(String),
      senha: expect.any(String),
      confirmarSenha: expect.any(String),
    });
    expect(validarCadastro({ nome: "Ana", email: "ana@x.com", senha: "123456", confirmarSenha: "123456" })).toEqual({});
  });
});
