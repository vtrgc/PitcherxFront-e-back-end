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
  // Conta criada mas ainda não verificada pelo código do e-mail (ou desativada): o backend
  // a mantém inativa; a interface só libera as páginas depois da verificação.
  const aguardandoVerificacao = isAuthenticated && usuario?.isActive === false;

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
    if (aguardandoVerificacao) {
      const destino = pathname && pathname !== "/" ? `?redirect=${encodeURIComponent(pathname)}` : "";
      router.replace(`/auth/verificar-conta${destino}`);
      return;
    }
    if (bloqueadoParaAdmin) {
      router.replace("/admin");
    }
  }, [isLoading, isAuthenticated, bloqueadoParaAdmin, aguardandoVerificacao, router, pathname, sessaoExpirada]);

  return {
    usuario,
    isAdmin,
    pronto: !isLoading && isAuthenticated && !bloqueadoParaAdmin && !aguardandoVerificacao,
  };
}
