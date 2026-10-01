"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PageShell from "../components/PageShell";
import TiposProjetoView from "../components/TiposProjetoView";
import { useAuth } from "../context/AuthContext";

/** Tipos de projeto para usuários (somente leitura). O administrador usa /admin/tipos-projeto. */
export default function TiposProjetoPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAdmin) router.replace("/admin/tipos-projeto");
  }, [isAdmin, isLoading, router]);

  return (
    <PageShell>
      <TiposProjetoView />
    </PageShell>
  );
}
