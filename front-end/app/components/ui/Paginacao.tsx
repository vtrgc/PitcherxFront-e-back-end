"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { TAMANHOS_PAGINA, paginasVisiveis } from "../../lib/listagem";

/**
 * Rodapé de paginação: "Mostrando X–Y de N", quantidade por página, anterior/próxima e
 * números de página. Some quando não há itens.
 */
export default function Paginacao({
  pagina,
  totalPaginas,
  total,
  inicio,
  fim,
  tamanho,
  onPagina,
  onTamanho,
  rotulo = "registros",
}: {
  pagina: number;
  totalPaginas: number;
  total: number;
  inicio: number;
  fim: number;
  tamanho: number;
  onPagina: (pagina: number) => void;
  onTamanho?: (tamanho: number) => void;
  rotulo?: string;
}) {
  if (total === 0) return null;

  const botao =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-col gap-3 border-t border-ink-100 bg-ink-25/60 px-4 py-3 text-[13px] text-ink-500 sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span aria-live="polite">
          Mostrando <strong className="font-semibold text-ink-800">{inicio}</strong>–<strong className="font-semibold text-ink-800">{fim}</strong> de{" "}
          <strong className="font-semibold text-ink-800">{total}</strong> {rotulo}
        </span>
        {onTamanho && (
          <label className="inline-flex items-center gap-2">
            <span className="sr-only sm:not-sr-only">Por página</span>
            <select
              value={tamanho}
              onChange={(e) => onTamanho(Number(e.target.value))}
              className="h-8 rounded-lg border border-ink-200 bg-white px-2 text-[13px] text-ink-800 outline-none focus:border-brand-500"
              aria-label="Registros por página"
            >
              {TAMANHOS_PAGINA.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPagina(pagina - 1)}
            disabled={pagina <= 1}
            className={`${botao} text-ink-600 hover:bg-brand-50 hover:text-brand-700`}
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Anterior</span>
          </button>
          {paginasVisiveis(pagina, totalPaginas).map((p, i) =>
            p === "…" ? (
              <span key={`r${i}`} className="px-1 text-ink-400" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPagina(p)}
                aria-current={p === pagina ? "page" : undefined}
                aria-label={`Página ${p}`}
                className={`${botao} ${p === pagina ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-brand-50 hover:text-brand-700"}`}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            onClick={() => onPagina(pagina + 1)}
            disabled={pagina >= totalPaginas}
            className={`${botao} text-ink-600 hover:bg-brand-50 hover:text-brand-700`}
            aria-label="Próxima página"
          >
            <span className="hidden sm:inline">Próxima</span>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </nav>
  );
}
