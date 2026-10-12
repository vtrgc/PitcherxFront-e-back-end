"use client";

import { useMemo, useState } from "react";
import { paginar } from "../lib/listagem";

/**
 * Paginação no cliente para as listas do usuário (Projetos, Propostas, Contratos).
 * Os endpoints `GET /projeto`, `/proposta` e `/contrato` devolvem listas completas, sem
 * `Pageable`, então a página é recortada aqui. Quando `chave` muda (filtro/aba/busca),
 * volta para a página 1.
 */
export function usePaginacao<T>(
  itens: T[],
  opcoes: string | { chaveReinicio?: string; tamanhoInicial?: number } = "",
  porPaginaInicialArg = 12
) {
  // Aceita também a forma `{ chaveReinicio, tamanhoInicial }` (usada por `CrudAdmin`).
  const chave = typeof opcoes === "string" ? opcoes : (opcoes.chaveReinicio ?? "");
  const porPaginaInicial = typeof opcoes === "string" ? porPaginaInicialArg : (opcoes.tamanhoInicial ?? 10);
  const [estado, setEstado] = useState({ chave, pagina: 1 });
  const [porPagina, setPorPaginaEstado] = useState(porPaginaInicial);
  if (estado.chave !== chave) setEstado({ chave, pagina: 1 });
  const pagina = estado.chave === chave ? estado.pagina : 1;

  const fatia = useMemo(() => paginar(itens, pagina, porPagina), [itens, pagina, porPagina]);

  const setPorPagina = (n: number) => {
    setPorPaginaEstado(n);
    setEstado({ chave, pagina: 1 });
  };
  return {
    ...fatia,
    porPagina,
    irPara: (p: number) => setEstado({ chave, pagina: p }),
    setPorPagina,
    tamanho: porPagina,
    setTamanho: setPorPagina,
  };
}
