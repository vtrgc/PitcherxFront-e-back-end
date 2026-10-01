import type { ReactNode } from "react";
import { CheckCircle2, RefreshCw, Search } from "lucide-react";
import { cls } from "../../ui/estilos";
import CartaoFantasma from "./CartaoFantasma";
import DemoCriarPost from "./DemoCriarPost";
import DemoPostCard from "./DemoPostCard";

/** Réplica do SearchBar (sem estado). */
export function DemoBusca({ texto }: { texto: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3">
      <div className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-ink-200 bg-ink-25 px-3.5">
        <Search size={17} className="shrink-0 text-brand-500" aria-hidden="true" />
        <span className="truncate text-[14px] text-ink-400">{texto}</span>
      </div>
      <span className="inline-flex h-11 items-center justify-center rounded-[0.625rem] bg-brand-600 px-3 text-white">
        <RefreshCw size={16} aria-hidden="true" />
      </span>
    </div>
  );
}

/**
 * Página /feed no celular: título, busca, composer e a lista. O primeiro item da lista é
 * um espaço reservado (mesmas dimensões) onde o cartão-fio da publicação "pousa".
 */
export default function DemoFeed({
  comComposer = true,
  depoisDoSlot,
}: {
  comComposer?: boolean;
  /** Conteúdo logo abaixo do espaço do cartão (ex.: bloco de comentários). */
  depoisDoSlot?: ReactNode;
}) {
  return (
    <>
      <div className="mb-1 pb-5">
        <p className={cls.eyebrow}>O feed</p>
        <h2 className={cls.h1}>O que estão lançando agora</h2>
      </div>
      <div className="space-y-6">
        <DemoBusca texto="Pesquisar publicações..." />
        {comComposer && (
          <div data-hx="composer">
            <DemoCriarPost />
          </div>
        )}
        <div className="space-y-4">
          <div>
            <DemoPostCard fantasma />
            {depoisDoSlot}
          </div>
          <CartaoFantasma />
          <CartaoFantasma />
        </div>
      </div>
    </>
  );
}

/** Aviso "Publicação criada." (mesmas classes do FeedbackProvider). Fica fora da área rolável. */
export function DemoToast() {
  return (
    <div
      data-hx="toast"
      className="hx-toast absolute bottom-24 left-4 right-4 z-30 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800 shadow-[0_10px_30px_-12px_rgba(21,15,40,0.3)]"
    >
      <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1">Publicação criada.</span>
    </div>
  );
}
