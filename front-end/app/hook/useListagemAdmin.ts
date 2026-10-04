"use client";

import { useMemo, useState } from "react";
import { POR_PAGINA_PADRAO, filtrarPorTermo, paginar } from "../lib/listagem";

/**
 * Pesquisa + paginação de uma lista administrativa (dados já carregados da API).
 * Mudar o termo ou o tamanho da página volta para a página 1; uma página que deixou de
 * existir (ex.: após excluir o último item dela) é corrigida automaticamente.
 */
export function useListagemAdmin<T>(itens: T[], campos: (item: T) => unknown[], { porPaginaInicial = POR_PAGINA_PADRAO } = {}) {
  const [termo, setTermoEstado] = useState("");
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPaginaEstado] = useState(porPaginaInicial);

  // `campos` costuma ser uma função inline: a dependência é a lista e o termo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filtrados = useMemo(() => filtrarPorTermo(itens, termo, campos), [itens, termo]);
  const fatia = useMemo(() => paginar(filtrados, pagina, porPagina), [filtrados, pagina, porPagina]);

  return {
    termo,
    setTermo: (valor: string) => {
      setTermoEstado(valor);
      setPagina(1);
    },
    filtrados,
    ...fatia,
    porPagina,
    setPorPagina: (valor: number) => {
      setPorPaginaEstado(valor);
      setPagina(1);
    },
    irPara: (p: number) => setPagina(p),
  };
}
