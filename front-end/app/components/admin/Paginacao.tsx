"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { OPCOES_POR_PAGINA, paginasVisiveis } from "../../lib/listagem";

/**
 * Barra de paginação das telas administrativas: "Mostrando X–Y de Z", anterior/próxima,
 * números de página (com reticências) e itens por página. Some quando não há registros.
 */
export default function Paginacao({
  pagina,
  totalPaginas,
  total,
  inicio,
  fim,
  porPagina,
  onPagina,
  onPorPagina,
  rotuloItens = "registros",
  opcoesPorPagina = OPCOES_POR_PAGINA,
}: {
  pagina: number;
  totalPaginas: number;
  total: number;
  inicio: number;
  fim: number;
  porPagina: number;
  onPagina: (p: number) => void;
  onPorPagina?: (n: number) => void;
  rotuloItens?: string;
  opcoesPorPagina?: readonly number[];
}) {
  if (total === 0) return null;
  const ir = (p: number) => {
    onPagina(p);
    document.getElementById("conteudo")?.scrollIntoView({ block: "start", behavior: "smooth" });
  };
  const botao =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-col gap-3 border-t border-ink-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-ink-500">
        <span aria-live="polite">
          Mostrando <strong className="font-semibold text-ink-800">{inicio}–{fim}</strong> de{" "}
          <strong className="font-semibold text-ink-800">{total}</strong> {rotuloItens}
        </span>
        {onPorPagina && (
          <label className="inline-flex items-center gap-1.5">
            Por página
            <select
              value={porPagina}
              onChange={(e) => onPorPagina(Number(e.target.value))}
              className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-[12.5px] font-semibold text-ink-800 outline-none focus:border-brand-500"
            >
              {opcoesPorPagina.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center gap-1 self-center sm:self-auto">
          <button
            type="button"
            onClick={() => ir(pagina - 1)}
            disabled={pagina <= 1}
            className={`${botao} border-ink-200 bg-white text-ink-700 hover:bg-ink-50`}
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            <span className="ml-0.5 hidden sm:inline">Anterior</span>
          </button>
          {/* Celular: só "página X de Y"; a partir de sm, os números. */}
          <span className="px-2 text-[12.5px] font-semibold text-ink-600 sm:hidden">
            {pagina} / {totalPaginas}
          </span>
          <ul className="hidden items-center gap-1 sm:flex">
            {paginasVisiveis(pagina, totalPaginas).map((p, i) =>
              p === "…" ? (
                <li key={`r${i}`} className="px-1 text-[13px] text-ink-400" aria-hidden="true">
                  …
                </li>
              ) : (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => ir(p)}
                    aria-current={p === pagina ? "page" : undefined}
                    aria-label={`Página ${p}`}
                    className={`${botao} ${
                      p === pagina ? "border-brand-600 bg-brand-600 text-white" : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
                    }`}
                  >
                    {p}
                  </button>
                </li>
              )
            )}
          </ul>
          <button
            type="button"
            onClick={() => ir(pagina + 1)}
            disabled={pagina >= totalPaginas}
            className={`${botao} border-ink-200 bg-white text-ink-700 hover:bg-ink-50`}
            aria-label="Próxima página"
          >
            <span className="mr-0.5 hidden sm:inline">Próxima</span>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </nav>
  );
}
