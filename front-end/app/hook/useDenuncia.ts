"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { EVENTO_DENUNCIAS_ALTERADAS, jaDenunciado, listarMinhasDenuncias } from "../services/denuncia.service";
import { TipoDenuncia } from "../types/Denuncia";

/**
 * Estado de denúncia de um conteúdo para o usuário logado (modal aberto e se já denunciou).
 * "Já denunciou" vem de GET /denuncia/me (o backend recusa uma segunda denúncia do mesmo alvo).
 * Respostas a comentários ("SUBCOMENTARIO") não são um tipo aceito pelo backend.
 */
export function useDenuncia(tipo: TipoDenuncia | "SUBCOMENTARIO", conteudoId: number) {
  const { usuario, isAdmin } = useAuth();
  const eu = usuario?.idUsuario ?? null;
  const suportado = tipo !== "SUBCOMENTARIO";
  const [denunciado, setDenunciado] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  const sincronizar = useCallback(() => {
    if (!eu || !suportado) return;
    listarMinhasDenuncias()
      .then((lista) => setDenunciado(jaDenunciado(lista ?? [], tipo as TipoDenuncia, conteudoId)))
      .catch(() => undefined);
  }, [eu, suportado, tipo, conteudoId]);

  useEffect(() => {
    sincronizar();
    window.addEventListener(EVENTO_DENUNCIAS_ALTERADAS, sincronizar);
    return () => window.removeEventListener(EVENTO_DENUNCIAS_ALTERADAS, sincronizar);
  }, [sincronizar]);

  return {
    /** Contas comuns denunciam; o administrador modera em Admin → Denúncias. */
    podeDenunciar: !!eu && suportado && !isAdmin,
    denunciado,
    modalAberto,
    abrir: () => setModalAberto(true),
    fechar: () => setModalAberto(false),
  };
}
