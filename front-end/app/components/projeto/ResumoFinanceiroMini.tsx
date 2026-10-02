import { FichaProjeto, resumoFinanceiro } from "../../lib/fichaProjeto";
import { formatarPercentual } from "../../lib/perfil";

function moedaCurta(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", notation: v >= 100000 ? "compact" : "standard", maximumFractionDigits: v >= 100000 ? 1 : 0 });
}

/** Meta, progresso e participação em formato compacto (cartões de lista). Nada aparece sem dados. */
export default function ResumoFinanceiroMini({ ficha, className = "" }: { ficha: FichaProjeto | null | undefined; className?: string }) {
  const r = resumoFinanceiro(ficha);
  if (r.meta === null && ficha?.participacao === undefined) return null;
  return (
    <div className={`rounded-xl bg-ink-25 px-3 py-2.5 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[12.5px]">
        {r.meta !== null && (
          <span className="text-ink-600">
            Meta <strong className="font-semibold text-ink-900">{moedaCurta(r.meta)}</strong>
          </span>
        )}
        {ficha?.participacao !== undefined && (
          <span className="text-ink-600">
            Participação <strong className="font-semibold text-ink-900">{formatarPercentual(ficha.participacao)}</strong>
          </span>
        )}
      </div>
      {r.percentual !== null && (
        <>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100" aria-hidden="true">
            <div className={`h-full rounded-full ${r.metaAtingida ? "bg-emerald-500" : "bg-brand-500"}`} style={{ width: `${Math.min(100, r.percentual)}%` }} />
          </div>
          <p className="mt-1 text-[11.5px] text-ink-500">
            {moedaCurta(r.captado ?? 0)} captados · {formatarPercentual(r.percentual, 1)} da meta
          </p>
        </>
      )}
    </div>
  );
}
