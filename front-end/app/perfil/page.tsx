"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageShell from "../components/PageShell";
import PerfilView, { PerfilSkeleton } from "../components/perfil/PerfilView";
import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../components/ui/FeedbackProvider";

/**
 * Meu perfil: a mesma visualização do perfil público, com as ações de dono
 * (editar, trocar foto, completar perfil). Segurança (senha e exclusão da conta)
 * fica em /configuracoes.
 */
export default function MeuPerfilPage() {
  return (
    <PageShell rightRail={null}>
      <Suspense fallback={<PerfilSkeleton />}>
        <MeuPerfil />
      </Suspense>
    </PageShell>
  );
}

function MeuPerfil() {
  const { usuario } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const { notificar } = useFeedback();
  const salvo = params.get("salvo");

  // Mensagem vinda do fluxo de edição/completar cadastro (somente após sucesso real da API).
  useEffect(() => {
    if (salvo === "1") notificar("Perfil atualizado.", "sucesso");
    if (salvo === "completo") notificar("Tudo pronto! Seu perfil foi atualizado.", "sucesso");
    if (salvo) router.replace("/perfil", { scroll: false });
  }, [salvo, notificar, router]);

  if (!usuario) return null;
  return <PerfilView id={usuario.idUsuario} />;
}
