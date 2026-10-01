"use client";

import { useEffect } from "react";
import { cls } from "./components/ui/estilos";

/** Limite de erro global: evita tela em branco se um componente falhar ao renderizar. */
export default function ErroGlobal({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Registro local para diagnóstico; nenhum detalhe interno é mostrado ao usuário.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center" role="alert">
      <h1 className="font-display text-[1.75rem] font-extrabold text-ink-900">Algo deu errado</h1>
      <p className={`${cls.texto} mt-2 max-w-md`}>Não foi possível exibir esta página. Tente novamente.</p>
      <button type="button" onClick={reset} className={`${cls.btnPrimario} mt-6`}>
        Tentar novamente
      </button>
    </main>
  );
}
