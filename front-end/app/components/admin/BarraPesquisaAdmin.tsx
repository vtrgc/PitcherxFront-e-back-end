"use client";

import { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { cls } from "../ui/estilos";

/** Campo "Pesquisar..." padrão das telas administrativas, com filtros extras opcionais. */
export default function BarraPesquisaAdmin({
  valor,
  onChange,
  placeholder = "Pesquisar...",
  rotulo,
  filtros,
  resultado,
}: {
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** Nome acessível do campo (ex.: "Pesquisar áreas"). */
  rotulo: string;
  filtros?: ReactNode;
  /** Ex.: "3 resultados" — exibido quando há termo. */
  resultado?: string;
}) {
  return (
    <div className={`${cls.card} p-3`}>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex h-11 min-w-0 shrink-0 items-center gap-2.5 rounded-lg border border-ink-200 bg-ink-25 px-3.5 transition-colors focus-within:border-brand-500 focus-within:bg-white sm:min-w-[240px] sm:flex-1">
          <Search size={17} className="shrink-0 text-brand-500" aria-hidden="true" />
          <input
            type="search"
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            aria-label={rotulo}
            className="h-full w-full min-w-0 bg-transparent text-[14px] text-ink-900 outline-none placeholder:text-ink-400 [&::-webkit-search-cancel-button]:hidden"
          />
          {valor && (
            <button type="button" onClick={() => onChange("")} className="shrink-0 rounded-md p-1 text-ink-400 hover:text-ink-700" aria-label="Limpar pesquisa">
              <X size={15} />
            </button>
          )}
        </div>
        {filtros && <div className="flex flex-wrap gap-2 [&>*]:min-w-0 [&>*]:flex-1 sm:[&>*]:flex-none">{filtros}</div>}
      </div>
      {valor.trim() && resultado && (
        <p className="mt-2 px-1 text-[12px] text-ink-500" aria-live="polite">
          {resultado}
        </p>
      )}
    </div>
  );
}
