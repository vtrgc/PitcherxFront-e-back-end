"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

/**
 * Garante que apenas administradores permaneçam na área /admin (navegação).
 * As operações administrativas continuam protegidas pelo backend (@PreAuthorize).
 */
export function useRequireAdmin() {
  const { usuario, isAuthenticated, isLoading, isAdmin, sessaoExpirada } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/auth/login?redirect=%2Fadmin${sessaoExpirada ? "&expirada=1" : ""}`);
      return;
    }
    if (usuario?.isActive === false) {
      router.replace("/auth/verificar-conta?redirect=%2Fadmin");
      return;
    }
    if (!isAdmin) {
      router.replace("/feed");
    }
  }, [isLoading, isAuthenticated, isAdmin, router, sessaoExpirada, usuario?.isActive]);

  return { usuario, isAdmin, pronto: !isLoading && isAuthenticated && isAdmin && usuario?.isActive !== false };
}
