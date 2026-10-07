"use client";

import { useMemo, useState } from "react";
import { paginar } from "../lib/listagem";

/**
 * Paginação no cliente (ver lib/listagem). A página volta para 1 quando a busca/filtro muda
 * (`chaveReinicio`) e é ajustada automaticamente se a lista diminuir (ex.: após excluir).
 */
export function usePaginacao<T>(itens: T[], { tamanhoInicial = 10, chaveReinicio = "" }: { tamanhoInicial?: number; chaveReinicio?: string } = {}) {
  const [estado, setEstado] = useState({ pagina: 1, chave: chaveReinicio });
  const [tamanho, setTamanhoState] = useState(tamanhoInicial);

  // Mudou a busca/filtro: recomeça da primeira página (ajuste durante a renderização).
  const paginaPedida = estado.chave === chaveReinicio ? estado.pagina : 1;
  if (estado.chave !== chaveReinicio) setEstado({ pagina: 1, chave: chaveReinicio });

  const fatia = useMemo(() => paginar(itens, paginaPedida, tamanho), [itens, paginaPedida, tamanho]);

  return {
    ...fatia,
    tamanho,
    irPara: (pagina: number) => setEstado({ pagina, chave: chaveReinicio }),
    setTamanho: (novo: number) => {
      setTamanhoState(novo);
      setEstado({ pagina: 1, chave: chaveReinicio });
    },
  };
}
