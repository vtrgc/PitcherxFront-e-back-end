"use client";

import { useCallback, useRef, useState } from "react";
import { mensagemErro } from "../lib/api";
import { useFeedback } from "../components/ui/FeedbackProvider";

/**
 * Estado da modal de cadastro/edição: qual registro está sendo editado (null = novo),
 * erro do formulário e envio protegido contra clique duplo.
 */
export function useModalCadastro<T>() {
  const { notificar } = useFeedback();
  const [aberto, setAberto] = useState(false);
  const [registro, setRegistro] = useState<T | null>(null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const salvandoRef = useRef(false);

  const abrirNovo = useCallback(() => {
    setRegistro(null);
    setErro("");
    setAberto(true);
  }, []);

  const abrirEdicao = useCallback((r: T) => {
    setRegistro(r);
    setErro("");
    setAberto(true);
  }, []);

  const fechar = useCallback(() => {
    if (salvandoRef.current) return;
    setAberto(false);
    setRegistro(null);
    setErro("");
  }, []);

  /**
   * Executa o salvamento. `validar` devolve a mensagem de erro (ou null). Em caso de
   * sucesso, fecha a modal, mostra a notificação e chama `depois` (recarregar a lista).
   */
  const salvar = useCallback(
    async (opcoes: {
      validar?: () => string | null;
      enviar: () => Promise<unknown>;
      sucesso: string;
      falha: string;
      depois?: () => unknown;
    }) => {
      if (salvandoRef.current) return;
      const invalido = opcoes.validar?.() ?? null;
      if (invalido) {
        setErro(invalido);
        return;
      }
      salvandoRef.current = true;
      setSalvando(true);
      setErro("");
      try {
        await opcoes.enviar();
      } catch (error) {
        setErro(mensagemErro(error, opcoes.falha));
        salvandoRef.current = false;
        setSalvando(false);
        return;
      }
      salvandoRef.current = false;
      setAberto(false);
      setRegistro(null);
      try {
        // A lista é atualizada antes do aviso: quando a mensagem aparece, o registro já está lá.
        await opcoes.depois?.();
      } finally {
        notificar(opcoes.sucesso, "sucesso");
        setSalvando(false);
      }
    },
    [notificar]
  );

  return { aberto, registro, editando: registro !== null, erro, setErro, salvando, abrirNovo, abrirEdicao, fechar, salvar };
}
