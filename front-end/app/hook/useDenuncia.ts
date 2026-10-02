"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  EVENTO_DENUNCIAS_ALTERADAS,
  TipoConteudoDenuncia,
  desfazerDenuncia,
  jaDenunciado,
} from "../services/denuncia.service";

/** Estado de denúncia de um conteúdo para o usuário logado (modal aberto e se já denunciou). */
export function useDenuncia(tipo: TipoConteudoDenuncia, conteudoId: number) {
  const { usuario } = useAuth();
  const eu = usuario?.idUsuario ?? null;
  const [denunciado, setDenunciado] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  const sincronizar = useCallback(() => setDenunciado(jaDenunciado(eu, tipo, conteudoId)), [eu, tipo, conteudoId]);

  useEffect(() => {
    sincronizar();
    window.addEventListener(EVENTO_DENUNCIAS_ALTERADAS, sincronizar);
    window.addEventListener("storage", sincronizar);
    return () => {
      window.removeEventListener(EVENTO_DENUNCIAS_ALTERADAS, sincronizar);
      window.removeEventListener("storage", sincronizar);
    };
  }, [sincronizar]);

  const desfazer = useCallback(() => {
    if (eu) desfazerDenuncia(eu, tipo, conteudoId);
  }, [eu, tipo, conteudoId]);

  return {
    /** Só contas comuns denunciam (o administrador modera diretamente). */
    podeDenunciar: !!eu,
    denunciado,
    modalAberto,
    abrir: () => setModalAberto(true),
    fechar: () => setModalAberto(false),
    desfazer,
  };
}
