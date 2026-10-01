"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function ComentariosIndexPage() {
  const router = useRouter();
  const { isAdmin, isLoading } = useAuth();

  // Não há página de listagem de comentários: eles aparecem em cada publicação.
  useEffect(() => {
    if (isLoading) return;
    router.replace(isAdmin ? "/admin/postagens" : "/feed");
  }, [router, isAdmin, isLoading]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-transparent">
      <p className="text-ink-500">Redirecionando...</p>
    </main>
  );
}
