"use client";

import { useId, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { cls } from "./estilos";

/**
 * Barra de busca das listas (admin e demais telas de cadastro). A busca filtra enquanto a
 * pessoa digita; `children` recebe filtros extras (selects) exibidos ao lado.
 */
export default function CampoBusca({
  valor,
  onChange,
  placeholder,
  rotulo,
  children,
}: {
  valor: string;
  onChange: (valor: string) => void;
  placeholder: string;
  rotulo?: string;
  children?: ReactNode;
}) {
  const id = useId();
  return (
    <div role="search" className={`${cls.card} flex flex-wrap items-center gap-3 p-3`}>
      <div className="flex h-11 min-w-[200px] flex-1 items-center gap-2.5 rounded-lg border border-ink-200 bg-ink-25 px-3.5 transition-colors focus-within:border-brand-500 focus-within:bg-white">
        <Search size={17} className="shrink-0 text-brand-500" aria-hidden="true" />
        <label htmlFor={id} className="sr-only">
          {rotulo || placeholder}
        </label>
        <input
          id={id}
          type="search"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-full w-full min-w-0 bg-transparent text-[14px] outline-none placeholder:text-ink-400 [&::-webkit-search-cancel-button]:hidden"
        />
        {valor && (
          <button type="button" onClick={() => onChange("")} className="text-ink-400 hover:text-ink-700" aria-label="Limpar busca">
            <X size={16} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
