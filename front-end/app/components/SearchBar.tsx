"use client";

import { useId } from "react";
import { Search, RefreshCw, Loader2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
  placeholder?: string;
  /** Nome acessível do campo (padrão: o placeholder). */
  rotulo?: string;
}

export default function SearchBar({ value, onChange, onRefresh, loading, placeholder, rotulo }: Props) {
  const id = useId();
  const texto = placeholder || "Pesquisar pessoas ou projetos...";
  return (
    <div role="search" className="rounded-2xl border border-ink-100 bg-white flex items-center gap-3 p-3">
      <div className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-ink-200 bg-ink-25 px-3.5 transition-colors focus-within:border-brand-500 focus-within:bg-white focus-within:shadow-glow">
        <Search size={17} className="shrink-0 text-brand-500" aria-hidden="true" />
        <label htmlFor={id} className="sr-only">
          {rotulo || texto}
        </label>
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={texto}
          className="h-full w-full min-w-0 bg-transparent text-[14px] outline-none placeholder:text-ink-400"
        />
      </div>

      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Atualizar"
          className="inline-flex h-11 items-center justify-center gap-[0.45rem] rounded-[0.625rem] px-3 sm:px-[1.15rem] text-sm font-semibold leading-none whitespace-nowrap transition-all cursor-pointer active:scale-[0.97] disabled:opacity-55 disabled:cursor-not-allowed bg-brand-600 text-white hover:bg-brand-700"
        >
          {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      )}
    </div>
  );
}
