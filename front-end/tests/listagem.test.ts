import { describe, expect, it } from "vitest";
import { filtrarPorTermo, normalizarTexto, paginar, paginasVisiveis } from "../app/lib/listagem";

describe("pesquisa das telas administrativas", () => {
  const areas = [
    { nome: "Tecnologia", descricao: "Software e hardware" },
    { nome: "Saúde", descricao: "Clínicas e hospitais" },
    { nome: "Educação", descricao: "Escolas e cursos de tecnologia" },
  ];
  const campos = (a: (typeof areas)[number]) => [a.nome, a.descricao];

  it("ignora maiúsculas e acentos", () => {
    expect(normalizarTexto("  Educação ")).toBe("educacao");
    expect(filtrarPorTermo(areas, "SAUDE", campos).map((a) => a.nome)).toEqual(["Saúde"]);
  });
  it("procura em todos os campos e exige todas as palavras", () => {
    expect(filtrarPorTermo(areas, "tecnologia", campos)).toHaveLength(2);
    expect(filtrarPorTermo(areas, "escolas tecnologia", campos).map((a) => a.nome)).toEqual(["Educação"]);
  });
  it("termo vazio devolve tudo; sem resultado devolve lista vazia", () => {
    expect(filtrarPorTermo(areas, "   ", campos)).toHaveLength(3);
    expect(filtrarPorTermo(areas, "xyz", campos)).toEqual([]);
    expect(filtrarPorTermo([{ a: null as string | null }], "x", (i) => [i.a])).toEqual([]);
  });
});

describe("paginação", () => {
  const itens = Array.from({ length: 23 }, (_, i) => i + 1);
  it("recorta a página e informa o intervalo", () => {
    expect(paginar(itens, 1, 10)).toMatchObject({ itens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], pagina: 1, totalPaginas: 3, inicio: 1, fim: 10, total: 23 });
    expect(paginar(itens, 3, 10)).toMatchObject({ itens: [21, 22, 23], inicio: 21, fim: 23 });
  });
  it("corrige página fora do intervalo (ex.: após excluir)", () => {
    expect(paginar(itens, 9, 10).pagina).toBe(3);
    expect(paginar(itens, 0, 10).pagina).toBe(1);
    expect(paginar([1, 2], 2, 10)).toMatchObject({ pagina: 1, itens: [1, 2] });
  });
  it("lista vazia não quebra", () => {
    expect(paginar([], 1, 10)).toEqual({ itens: [], pagina: 1, totalPaginas: 1, total: 0, inicio: 0, fim: 0 });
  });
  it("números de página com reticências", () => {
    expect(paginasVisiveis(1, 1)).toEqual([1]);
    expect(paginasVisiveis(1, 3)).toEqual([1, 2, 3]);
    expect(paginasVisiveis(5, 10)).toEqual([1, "…", 4, 5, 6, "…", 10]);
    expect(paginasVisiveis(1, 10)).toEqual([1, 2, "…", 10]);
    expect(paginasVisiveis(3, 10)).toEqual([1, 2, 3, 4, "…", 10]);
  });
});
