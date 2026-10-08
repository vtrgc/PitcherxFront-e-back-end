"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Janela modal (cadastro/edição). Fecha com Esc, com o "X" ou clicando fora (quando não
 * está ocupada salvando), trava a rolagem da página e devolve o foco ao fechar.
 */
export default function Modal({
  aberto,
  titulo,
  descricao,
  onFechar,
  ocupado = false,
  largura = "max-w-lg",
  children,
}: {
  aberto: boolean;
  titulo: string;
  descricao?: ReactNode;
  onFechar: () => void;
  /** Enquanto true (ex.: salvando), Esc e clique fora não fecham. */
  ocupado?: boolean;
  largura?: string;
  children: ReactNode;
}) {
  const id = useId();
  const caixa = useRef<HTMLDivElement>(null);
  const fecharRef = useRef(onFechar);
  const ocupadoRef = useRef(ocupado);
  useEffect(() => {
    fecharRef.current = onFechar;
    ocupadoRef.current = ocupado;
  });

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Foca o primeiro campo do formulário (ou a própria caixa).
    const alvo = caixa.current?.querySelector<HTMLElement>("input, textarea, select, button:not([data-fechar])");
    (alvo ?? caixa.current)?.focus();

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape" && !ocupadoRef.current) fecharRef.current();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflow;
      anterior?.focus?.();
    };
  }, [aberto]);

  if (!aberto) return null;

  // `!m-0`: o modal é renderizado dentro de containers com `space-y-*`, que dariam margem
  // ao overlay fixo e deixariam uma faixa descoberta no topo.
  return (
    <div
      className="fixed inset-0 z-[78] !m-0 flex items-end justify-center bg-void/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !ocupado) onFechar();
      }}
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-titulo`}
        tabIndex={-1}
        className={`flex max-h-[92vh] w-full ${largura} flex-col rounded-t-2xl bg-white shadow-2xl outline-none sm:rounded-2xl`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-ink-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={`${id}-titulo`} className="font-display text-[1.1rem] font-bold text-ink-900">
              {titulo}
            </h2>
            {descricao && <div className="mt-0.5 text-[0.8125rem] text-ink-500">{descricao}</div>}
          </div>
          <button
            type="button"
            data-fechar
            onClick={onFechar}
            disabled={ocupado}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900 disabled:opacity-50"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
