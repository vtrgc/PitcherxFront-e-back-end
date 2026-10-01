"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CHAVE_ANIMAR } from "../home/constantes";

/**
 * Leva para a experiência animada (/). Quem tem "movimento reduzido" no sistema é mandado
 * para esta página por padrão; ao clicar aqui, a escolha fica guardada e a animação abre.
 */
export default function LinkAnimada({ className, children }: { className?: string; children: ReactNode }) {
  function escolher() {
    try {
      window.localStorage.setItem(CHAVE_ANIMAR, "1");
    } catch {
      /* sem armazenamento: a página inicial decide pelo padrão do sistema */
    }
  }
  return (
    <Link href="/" prefetch={false} className={className} onClick={escolher}>
      {children}
    </Link>
  );
}
