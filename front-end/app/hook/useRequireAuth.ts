"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

/**
 * Área de uma página:
 *  - "usuario": exclusiva de usuários comuns (feed, criação de projetos...). Administradores
 *    são levados ao dashboard, conforme a regra de negócio do PitcherX.
 *  - "autenticado": qualquer usuário logado (inclusive administradores).
 */
export type AreaPagina = "usuario" | "autenticado";

/**
 * Proteção de rotas no cliente. Isso só controla a NAVEGAÇÃO: a autorização real
 * continua sendo feita pelo backend em cada requisição.
 */
export function useRequireAuth(area: AreaPagina = "autenticado") {
  const { usuario, isAuthenticated, isLoading, isAdmin, sessaoExpirada } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const bloqueadoParaAdmin = area === "usuario" && isAdmin;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      const params = new URLSearchParams();
      if (pathname && pathname !== "/") params.set("redirect", pathname);
      if (sessaoExpirada) params.set("expirada", "1");
      const query = params.toString();
      router.replace(`/auth/login${query ? `?${query}` : ""}`);
      return;
    }
    if (bloqueadoParaAdmin) {
      router.replace("/admin");
    }
  }, [isLoading, isAuthenticated, bloqueadoParaAdmin, router, pathname, sessaoExpirada]);

  return {
    usuario,
    isAdmin,
    pronto: !isLoading && isAuthenticated && !bloqueadoParaAdmin,
  };
}
