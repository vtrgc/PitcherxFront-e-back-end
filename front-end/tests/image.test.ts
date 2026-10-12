import { describe, expect, it } from "vitest";
import { caminhoInternoSeguro, isValidImageUrl, linkExternoSeguro, resolverUrlImagem } from "../app/lib/image";

describe("URLs vindas de dados do usuário", () => {
  it("aceita apenas http(s) e caminhos relativos para imagens", () => {
    expect(isValidImageUrl("https://x.com/a.png")).toBe(true);
    expect(isValidImageUrl("/uploads/a.png")).toBe(true);
    expect(isValidImageUrl("//evil.com/a.png")).toBe(false);
    expect(isValidImageUrl("javascript:alert(1)")).toBe(false);
    expect(resolverUrlImagem("/uploads/a.png")).toBe("/api-backend/uploads/a.png");
    expect(resolverUrlImagem("")).toBeNull();
  });

  it("links externos (LinkedIn) não aceitam esquemas perigosos", () => {
    expect(linkExternoSeguro("javascript:alert(1)")).toBeNull();
    expect(linkExternoSeguro("data:text/html,x")).toBeNull();
    expect(linkExternoSeguro("linkedin.com/in/ana")).toBe("https://linkedin.com/in/ana");
    expect(linkExternoSeguro("https://www.linkedin.com/in/ana")).toBe("https://www.linkedin.com/in/ana");
  });

  it("redirecionamento pós-login só para caminhos internos", () => {
    expect(caminhoInternoSeguro("/projetos/3")).toBe("/projetos/3");
    expect(caminhoInternoSeguro("https://evil.com")).toBeNull();
    expect(caminhoInternoSeguro("//evil.com")).toBeNull();
    expect(caminhoInternoSeguro("/\\evil.com")).toBeNull();
    expect(caminhoInternoSeguro("/auth/login")).toBeNull();
  });
});
