"use client";

import { ReactNode, useEffect, useId, useRef } from "react";
import { Loader2, Save, X } from "lucide-react";
import { cls } from "../ui/estilos";

/**
 * Modal padrão de cadastro/edição das telas administrativas.
 * - Formulário com Enter para enviar; "Cancelar" e o botão principal no rodapé.
 * - Fecha com Esc, clique fora ou X (bloqueado enquanto salva).
 * - Foco preso dentro da modal e devolvido ao elemento de origem ao fechar.
 * - No celular abre como painel inferior com rolagem própria.
 * - `!mt-0`: o <main> do admin usa `space-y-6`, que daria margem à camada fixa e deixaria
 *   uma faixa sem escurecer no topo da tela.
 */
export default function ModalAdmin({
  aberto,
  titulo,
  descricao,
  onFechar,
  onSalvar,
  salvando = false,
  rotuloSalvar,
  desabilitarSalvar = false,
  largura = "max-w-lg",
  children,
}: {
  aberto: boolean;
  titulo: string;
  descricao?: string;
  onFechar: () => void;
  /** Sem `onSalvar`, a modal mostra só "Fechar" (ex.: telas sem cadastro pela API). */
  onSalvar?: () => void;
  salvando?: boolean;
  rotuloSalvar?: string;
  desabilitarSalvar?: boolean;
  largura?: string;
  children: ReactNode;
}) {
  if (!aberto) return null;
  return (
    <Conteudo
      titulo={titulo}
      descricao={descricao}
      onFechar={onFechar}
      onSalvar={onSalvar}
      salvando={salvando}
      rotuloSalvar={rotuloSalvar}
      desabilitarSalvar={desabilitarSalvar}
      largura={largura}
    >
      {children}
    </Conteudo>
  );
}

function Conteudo({
  titulo,
  descricao,
  onFechar,
  onSalvar,
  salvando,
  rotuloSalvar,
  desabilitarSalvar,
  largura,
  children,
}: {
  titulo: string;
  descricao?: string;
  onFechar: () => void;
  onSalvar?: () => void;
  salvando: boolean;
  rotuloSalvar?: string;
  desabilitarSalvar: boolean;
  largura: string;
  children: ReactNode;
}) {
  const caixaRef = useRef<HTMLDivElement>(null);
  const salvandoRef = useRef(salvando);
  const onFecharRef = useRef(onFechar);
  const base = useId();

  useEffect(() => {
    salvandoRef.current = salvando;
    onFecharRef.current = onFechar;
  }, [salvando, onFechar]);

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    const primeiro = caixaRef.current?.querySelector<HTMLElement>(
      "[data-autofocus], input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled])"
    );
    (primeiro ?? caixaRef.current)?.focus();

    function aoTeclar(e: KeyboardEvent) {
      // Um diálogo de confirmação aberto por cima cuida das próprias teclas.
      if (document.querySelector('[role="alertdialog"]')) return;
      if (e.key === "Escape" && !salvandoRef.current) {
        e.preventDefault();
        onFecharRef.current();
      }
      if (e.key === "Tab" && caixaRef.current) {
        const alvos = Array.from(
          caixaRef.current.querySelectorAll<HTMLElement>(
            "a[href], input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])"
          )
        );
        if (alvos.length === 0) return;
        const primeiroAlvo = alvos[0];
        const ultimo = alvos[alvos.length - 1];
        if (e.shiftKey && document.activeElement === primeiroAlvo) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primeiroAlvo.focus();
        }
      }
    }
    document.addEventListener("keydown", aoTeclar);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflow;
      anterior?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[75] !mt-0 flex items-end justify-center bg-void/45 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !salvandoRef.current) onFechar();
      }}
    >
      <div
        ref={caixaRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${base}-titulo`}
        aria-describedby={descricao ? `${base}-descricao` : undefined}
        tabIndex={-1}
        className={`flex max-h-[92vh] w-full ${largura} flex-col rounded-t-2xl border border-ink-100 bg-white shadow-[0_24px_60px_-20px_rgba(21,15,40,0.45)] outline-none sm:rounded-2xl`}
      >
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            if (onSalvar && !salvando && !desabilitarSalvar) onSalvar();
          }}
        >
          <div className="flex items-start justify-between gap-3 border-b border-ink-100 px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 id={`${base}-titulo`} className="font-display text-[1.1rem] font-bold text-ink-900">
                {titulo}
              </h2>
              {descricao && (
                <p id={`${base}-descricao`} className="mt-0.5 text-[13px] text-ink-500">
                  {descricao}
                </p>
              )}
            </div>
            <button type="button" onClick={onFechar} disabled={salvando} className={`${cls.btnIcone} !h-8 !w-8 shrink-0`} aria-label="Fechar">
              <X size={16} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

          <div className="flex flex-col-reverse gap-2 border-t border-ink-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button type="button" onClick={onFechar} disabled={salvando} className={cls.btnSecundario}>
              {onSalvar ? "Cancelar" : "Fechar"}
            </button>
            {onSalvar && (
              <button type="submit" disabled={salvando || desabilitarSalvar} className={cls.btnPrimario}>
                {salvando ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
                {rotuloSalvar ?? "Salvar"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
