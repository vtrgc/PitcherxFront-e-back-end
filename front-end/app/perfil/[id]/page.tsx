"use client";

import { useParams } from "next/navigation";
import { UserX } from "lucide-react";
import PageShell from "../../components/PageShell";
import EmptyState from "../../components/EmptyState";
import PerfilView from "../../components/perfil/PerfilView";
import { cls } from "../../components/ui/estilos";

/** Perfil público de qualquer usuário (inclusive o próprio, com as ações de dono). */
export default function PerfilUsuarioPage() {
  const params = useParams();
  const id = Number(params.id);
  const valido = Number.isInteger(id) && id > 0;

  return (
    <PageShell rightRail={null}>
      {valido ? (
        <PerfilView key={id} id={id} mostrarVoltar />
      ) : (
        <div className={cls.card}>
          <EmptyState icon={UserX} title="Perfil não encontrado" description="O endereço deste perfil não é válido." />
        </div>
      )}
    </PageShell>
  );
}
