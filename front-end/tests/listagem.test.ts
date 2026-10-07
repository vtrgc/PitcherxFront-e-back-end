import { describe, expect, it } from "vitest";
import { correspondeBusca, normalizarTexto, paginar, paginasVisiveis } from "../app/lib/listagem";

describe("busca nas listas", () => {
  it("ignora acentos e maiúsculas", () => {
    expect(normalizarTexto("  Área de Tecnologia ")).toBe("area de tecnologia");
    expect(correspondeBusca("area", "Área")).toBe(true);
  });
  it("todas as palavras precisam aparecer em algum campo", () => {
    expect(correspondeBusca("ana sp", "Ana Souza", "SP")).toBe(true);
    expect(correspondeBusca("ana rj", "Ana Souza", "SP")).toBe(false);
    expect(correspondeBusca("", "qualquer")).toBe(true);
    expect(correspondeBusca("12", null, undefined, 123)).toBe(true);
  });
});

describe("paginação no cliente", () => {
  const itens = Array.from({ length: 23 }, (_, i) => i + 1);
  it("fatia e informa a faixa exibida", () => {
    expect(paginar(itens, 1, 10)).toMatchObject({ itens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], pagina: 1, totalPaginas: 3, total: 23, inicio: 1, fim: 10 });
    expect(paginar(itens, 3, 10)).toMatchObject({ itens: [21, 22, 23], inicio: 21, fim: 23 });
  });
  it("ajusta página fora do intervalo (ex.: depois de excluir)", () => {
    expect(paginar(itens, 9, 10).pagina).toBe(3);
    expect(paginar(itens, 0, 10).pagina).toBe(1);
    expect(paginar([], 2, 10)).toMatchObject({ itens: [], pagina: 1, totalPaginas: 1, inicio: 0, fim: 0 });
  });
  it("números de página com reticências", () => {
    expect(paginasVisiveis(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(paginasVisiveis(6, 12)).toEqual([1, "…", 5, 6, 7, "…", 12]);
    expect(paginasVisiveis(1, 12)).toEqual([1, 2, "…", 12]);
  });
});
