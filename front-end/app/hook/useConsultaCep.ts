"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EnderecoCep, ErroCep, MENSAGEM_FALHA_CEP, consultarCep } from "../lib/cep";
import { somenteDigitos } from "../lib/validacao";

export type EstadoCep =
  | { status: "ocioso" }
  | { status: "carregando" }
  | { status: "encontrado"; endereco: EnderecoCep }
  | { status: "falha"; mensagem: string; motivo: ErroCep["motivo"] };

/**
 * Consulta automática de CEP para formulários de endereço.
 *
 * `aoDigitar(cep)` deve ser chamado a cada alteração do campo: quando o CEP completa
 * 8 dígitos, a consulta é feita uma única vez (uma nova digitação cancela a anterior) e
 * `aoEncontrar` recebe o endereço para preencher os campos. Nada é consultado ao abrir um
 * endereço já salvo — apenas quando o usuário altera o CEP.
 */
export function useConsultaCep(aoEncontrar: (endereco: EnderecoCep) => void) {
  const [estado, setEstado] = useState<EstadoCep>({ status: "ocioso" });
  const controllerRef = useRef<AbortController | null>(null);
  const ultimoRef = useRef("");
  const aoEncontrarRef = useRef(aoEncontrar);

  useEffect(() => {
    aoEncontrarRef.current = aoEncontrar;
  }, [aoEncontrar]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const consultar = useCallback(async (cep: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    ultimoRef.current = cep;
    setEstado({ status: "carregando" });
    try {
      const endereco = await consultarCep(cep, controller.signal);
      if (controller.signal.aborted) return;
      setEstado({ status: "encontrado", endereco });
      aoEncontrarRef.current(endereco);
    } catch (error) {
      if (controller.signal.aborted) return;
      const motivo = error instanceof ErroCep ? error.motivo : "indisponivel";
      setEstado({ status: "falha", motivo, mensagem: MENSAGEM_FALHA_CEP[motivo] });
    }
  }, []);

  const aoDigitar = useCallback(
    (valor: string) => {
      const cep = somenteDigitos(valor);
      if (cep.length < 8) {
        controllerRef.current?.abort();
        ultimoRef.current = "";
        setEstado({ status: "ocioso" });
        return;
      }
      if (cep.length === 8 && cep !== ultimoRef.current) consultar(cep);
    },
    [consultar]
  );

  /** Tenta de novo o último CEP (botão "Tentar novamente"). */
  const repetir = useCallback(() => {
    if (ultimoRef.current) consultar(ultimoRef.current);
  }, [consultar]);

  return { estado, aoDigitar, repetir };
}
